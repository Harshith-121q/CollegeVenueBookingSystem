import axios from "axios";
import { VenueBookingModel } from "../models/venueBooking.js";
import { VenueModel } from "../models/venueModel.js";
import { NotificationModel } from "../models/notificationModel.js";
import { AutomationSettingModel } from "../models/automationSettingModel.js";
import { Types } from "mongoose";

const toMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const isOverlapping = (existingStart, existingEnd, newStart, newEnd) => {
  return existingStart < newEnd && existingEnd > newStart;
};

const isAiAutomationEnabled = async () => {
  const envValue = process.env.AI_AUTOMATION_ENABLED;
  if (envValue !== undefined) {
    return String(envValue).toLowerCase() === "true";
  }

  const setting = await AutomationSettingModel.findOne({ key: "ai_automation" });
  return setting?.enabled === true;
};

const triggerAiAutomation = async (booking) => {
  const automationEnabled = await isAiAutomationEnabled();
  if (!automationEnabled) {
    console.log("AI skipped (disabled)");
    return;
  }

  const webhookUrl = process.env.AI_WEBHOOK_URL;
  console.log("DEBUG webhookUrl:", JSON.stringify(webhookUrl));
  if (!webhookUrl) {
    console.log("AI skipped (disabled)");
    return;
  }

  console.log("AI automation triggered");

  try {
    const payload = {
      bookingId: booking._id?.toString(),
      venueId: booking.venue?.toString?.() || booking.venue,
      userId: booking.user?.toString?.() || booking.user,
      date: booking.date instanceof Date ? booking.date.toISOString().slice(0, 10) : booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      reason: booking.reason,
    };

    await axios.post(webhookUrl, payload, {
      timeout: 5000,
      headers: { "Content-Type": "application/json",
        "x-api-key":process.env.AI_API_KEY
       },

    });

    console.log("AI response received");
  } catch (error) {
    console.error("AI automation failed:", error.message);
  }
};

export const bookVenue = async (req, res, next) => {
  try {
    const venueId = req.params.id;
    const { date, startTime, endTime, reason } = req.body;
    const user = req.user?.id;

    if (!user) {
      return res.status(401).json({ message: "You are not authorised" });
    }

    if (!venueId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: "Input fields are required" });
    }

    if (!Types.ObjectId.isValid(venueId)) {
      return res.status(400).json({ message: "Invalid Venue Id" });
    }

    const venue = await VenueModel.findById(venueId);
    if (!venue) {
      return res.status(404).json({ message: "Venue not Found" });
    }

    const [year, month, day] = date.split("-").map(Number);
    const bookingDate = new Date(Date.UTC(year, month - 1, day));

    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(today.getUTCDate() + 1);

    if (bookingDate.getTime() !== today.getTime() && bookingDate.getTime() !== tomorrow.getTime()) {
      return res.status(400).json({ message: "Booking is allowed for today and tomorrow" });
    }

    const start = toMinutes(startTime);
    const end = toMinutes(endTime);

    if (start >= end) {
      return res.status(400).json({ message: "Invalid Time range" });
    }

    if (start < 540 || end > 1200) {
      return res.status(400).json({ message: "Booking is allowed between 9:00 am and 3:00 pm" });
    }

    if (bookingDate.getTime() === today.getTime()) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (start < currentMinutes) {
        return res.status(400).json({ message: `You cannot book for ${startTime}` });
      }
    }

    const existingBookings = await VenueBookingModel.find({
      venue: venueId,
      date: bookingDate,
      bookedStatus: { $in: ["pending", "booked"] },
    });

    const hasConflict = existingBookings.some((booking) => {
      return isOverlapping(
        toMinutes(booking.startTime),
        toMinutes(booking.endTime),
        start,
        end
      );
    });

    if (hasConflict) {
      return res.status(400).json({ message: "The selected time slot is already booked" });
    }

    const newVenueBooking = new VenueBookingModel({
      venue: venueId,
      user,
      date: bookingDate,
      startTime,
      endTime,
      reason,
      bookedStatus: "pending",
    });

    await newVenueBooking.save();

    void triggerAiAutomation(newVenueBooking);

    await NotificationModel.create({
      title: "New venue booking request",
      message: `Faculty requested ${venue.name} for ${date} from ${startTime} to ${endTime}`,
      bookingId: newVenueBooking._id,
      receiverRole: "ADMIN",
      receiverId: req.user?.id,
    });

    res.status(201).json({
      message: "Venue request submitted successfully",
      payload: newVenueBooking,
    });
  } catch (err) {
    next(err);
  }
};

export const handleAiDecision = async (req, res, next) => {
  try {
    const { bookingId, aiStatus, aiReason } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "bookingId is required" });
    }

    if (!["approved", "rejected"].includes(aiStatus)) {
      return res.status(400).json({ message: "Invalid AI status" });
    }

    const existingBooking = await VenueBookingModel.findById(bookingId);
    if (!existingBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const shouldUpdateBookedStatus = existingBooking.bookedStatus === "pending";
    const nextBookedStatus = aiStatus === "approved" ? "booked" : "rejected";

    const updatedBooking = await VenueBookingModel.findByIdAndUpdate(
      bookingId,
      {
        aiStatus,
        aiReason: aiReason || "",
        ...(shouldUpdateBookedStatus ? { bookedStatus: nextBookedStatus } : {}),
      },
      { new: true }
    )
      .populate("venue", "name roomNumber type block floor capacity facilities")
      .populate("user", "name email role");

    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (shouldUpdateBookedStatus) {
      await NotificationModel.create({
        title: aiStatus === "approved" ? "Venue booking approved" : "Venue booking rejected",
        message: aiStatus === "approved"
          ? `Your booking for ${updatedBooking.venue?.name} was approved by AI. ${aiReason ? `Reason: ${aiReason}` : ""}`.trim()
          : `Your booking for ${updatedBooking.venue?.name} was rejected by AI. ${aiReason ? `Reason: ${aiReason}` : ""}`.trim(),
        bookingId: updatedBooking._id,
        receiverRole: "FACULTY",
        receiverId: updatedBooking.user,
        type: "BOOKING_DECISION",
      });
    }

    res.status(200).json({
      message: "AI decision applied",
      payload: updatedBooking,
    });
  } catch (err) {
    next(err);
  }
};

export const getAutomationSetting = async (req, res, next) => {
  try {
    if (process.env.AI_AUTOMATION_ENABLED !== undefined) {
      const enabled = String(process.env.AI_AUTOMATION_ENABLED).toLowerCase() === "true";
      return res.status(200).json({
        message: "Automation setting fetched",
        payload: { enabled },
      });
    }

    const setting = await AutomationSettingModel.findOneAndUpdate(
      { key: "ai_automation" },
      { $setOnInsert: { enabled: true } },
      { new: true, upsert: true }
    );

    res.status(200).json({
      message: "Automation setting fetched",
      payload: { enabled: setting.enabled },
    });
  } catch (err) {
    next(err);
  }
};

export const updateAutomationSetting = async (req, res, next) => {
  try {
    const { enabled } = req.body;

    const setting = await AutomationSettingModel.findOneAndUpdate(
      { key: "ai_automation" },
      { enabled: Boolean(enabled) },
      { new: true, upsert: true }
    );

    res.status(200).json({
      message: "Automation setting updated",
      payload: { enabled: setting.enabled },
    });
  } catch (err) {
    next(err);
  }
};

export const getMyBookings = async (req, res, next) => {
  try {
    const user = req.user?.id;

    if (!user) {
      return res.status(401).json({ message: "You are not authorised" });
    }

    const bookings = await VenueBookingModel.find({ user })
      .populate("venue", "name roomNumber type block floor capacity facilities")
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      message: "Your booking requests",
      payload: bookings,
    });
  } catch (err) {
    next(err);
  }
};

export const getBookedVenueBookings = async (req, res, next) => {
  try {
    const bookings = await VenueBookingModel.find({ bookedStatus: "booked" })
      .populate("venue", "name roomNumber type block floor capacity facilities")
      .populate("user", "name email role")
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      message: "Booked venue requests",
      payload: bookings,
    });
  } catch (err) {
    next(err);
  }
};

export const cancelPendingBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const user = req.user?.id;

    if (!user) {
      return res.status(401).json({ message: "You are not authorised" });
    }

    const existingBooking = await VenueBookingModel.findById(bookingId);
    if (!existingBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (existingBooking.user?.toString() !== user.toString()) {
      return res.status(403).json({ message: "You can only cancel your own bookings" });
    }

    if (existingBooking.bookedStatus === "cancelled") {
      return res.status(200).json({
        message: "Booking was already cancelled",
        payload: existingBooking,
      });
    }

    if (existingBooking.bookedStatus !== "pending") {
      return res.status(400).json({ message: "Only pending bookings can be cancelled" });
    }

    const updatedBooking = await VenueBookingModel.findByIdAndUpdate(
      bookingId,
      {
        bookedStatus: "cancelled",
        reason: existingBooking.reason ? `${existingBooking.reason} | Cancelled by faculty` : "Cancelled by faculty",
      },
      { new: true }
    )
      .populate("venue", "name roomNumber type block floor capacity facilities")
      .populate("user", "name email role");

    try {
      await NotificationModel.create({
        title: "Venue booking cancelled",
        message: `Your booking request for ${updatedBooking?.venue?.name || "the selected venue"} was cancelled by you before approval.`,
        bookingId: updatedBooking?._id,
        receiverRole: "ADMIN",
        receiverId: user,
        type: "BOOKING_CANCELLED",
      });
    } catch (notifyErr) {
      console.error("Notification creation failed:", notifyErr?.message || notifyErr);
    }

    return res.status(200).json({
      message: "Booking cancelled successfully",
      payload: updatedBooking,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteMyBookings = async (req, res, next) => {
  try {
    const user = req.user?.id;
    const { bookingIds } = req.body;

    if (!user) {
      return res.status(401).json({ message: "You are not authorised" });
    }

    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      return res.status(400).json({ message: "Please select at least one booking to delete" });
    }

    const validBookingIds = bookingIds.filter((id) => Types.ObjectId.isValid(id));

    if (validBookingIds.length === 0) {
      return res.status(400).json({ message: "Invalid booking selection" });
    }

    const ownedBookings = await VenueBookingModel.find({
      _id: { $in: validBookingIds },
      user,
    }).select("_id");

    if (ownedBookings.length !== validBookingIds.length) {
      return res.status(403).json({ message: "You can only delete your own bookings" });
    }

    await VenueBookingModel.deleteMany({ _id: { $in: validBookingIds } });
    await NotificationModel.deleteMany({ bookingId: { $in: validBookingIds } });

    return res.status(200).json({
      message: "Selected bookings deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const updateBookingStatus = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const { bookedStatus, reason } = req.body;

    const allowedStatuses = ["pending", "booked", "cancelled", "rejected"];

    if (!allowedStatuses.includes(bookedStatus)) {
      return res.status(400).json({ message: "Invalid booking status" });
    }

    const existingBooking = await VenueBookingModel.findById(bookingId);
    if (!existingBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const updatedBooking = await VenueBookingModel.findByIdAndUpdate(
      bookingId,
      {
        bookedStatus,
        reason: reason || existingBooking.reason || "",
      },
      { new: true }
    )
      .populate("venue", "name roomNumber type block floor capacity facilities")
      .populate("user", "name email role");

    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    await NotificationModel.create({
      title: bookedStatus === "booked" ? "Venue booking approved" : "Venue booking rejected",
      message: bookedStatus === "booked"
        ? `Your booking for ${updatedBooking.venue?.name} was approved. ${reason ? `Reason: ${reason}` : ""}`.trim()
        : `Your booking for ${updatedBooking.venue?.name} was rejected. ${reason ? `Reason: ${reason}` : ""}`.trim(),
      bookingId: updatedBooking._id,
      receiverRole: "FACULTY",
      receiverId: updatedBooking.user,
      type: "BOOKING_DECISION",
    });

    res.status(200).json({
      message: "Booking status updated",
      payload: updatedBooking,
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminBookingRequests = async (req, res, next) => {
  try {
    const requests = await VenueBookingModel.find({ bookedStatus: "pending" })
      .populate("venue", "name roomNumber type block floor capacity facilities")
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Pending booking requests",
      payload: requests,
    });
  } catch (err) {
    next(err);
  }
};

export const getVenueBookings = async (req, res, next) => {
  try {
    const venueId = req.params.id
    const { date } = req.query

    if (!venueId || !Types.ObjectId.isValid(venueId)) {
      return res.status(400).json({ message: "Invalid Venue Id" })
    }

    if (!date) {
      return res.status(400).json({ message: "Date query is required" })
    }

    const [year, month, day] = date.split("-").map(Number)
    const bookingDate = new Date(Date.UTC(year, month - 1, day))

    const bookings = await VenueBookingModel.find({
      venue: venueId,
      date: bookingDate,
      bookedStatus: { $in: ["pending", "booked"] },
    }).select("startTime endTime bookedStatus")

    res.status(200).json({
      message: "Venue bookings loaded",
      payload: bookings,
    })
  } catch (err) {
    next(err)
  }
};

export const getAdminNotifications = async (req, res, next) => {
  try {
    const notifications = await NotificationModel.find({ receiverRole: "ADMIN" })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Admin notifications",
      payload: notifications,
    });
  } catch (err) {
    next(err);
  }
};

export const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "You are not authorised" });
    }

    const notifications = await NotificationModel.find({ receiverId: userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Your notifications",
      payload: notifications,
    });
  } catch (err) {
    next(err);
  }
};