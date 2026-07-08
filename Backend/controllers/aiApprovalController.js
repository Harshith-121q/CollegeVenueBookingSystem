import { VenueBookingModel } from "../models/venueBooking.js";
import { NotificationModel } from "../models/notificationModel.js";

export const aiApproveBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const { bookedStatus, reason } = req.body;

    const allowedStatuses = ["booked", "rejected"];
    if (!allowedStatuses.includes(bookedStatus)) {
      return res.status(400).json({ message: "Invalid booking status for AI approval" });
    }

    const existingBooking = await VenueBookingModel.findById(bookingId);
    if (!existingBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const updatedBooking = await VenueBookingModel.findByIdAndUpdate(
      bookingId,
      {
        bookedStatus,
        reason: reason || existingBooking.reason || "Approved by AI",
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
        ? `Your booking for ${updatedBooking.venue?.name} was approved by AI. ${reason ? `Reason: ${reason}` : ""}`.trim()
        : `Your booking for ${updatedBooking.venue?.name} was rejected by AI. ${reason ? `Reason: ${reason}` : ""}`.trim(),
      bookingId: updatedBooking._id,
      receiverRole: "FACULTY",
      receiverId: updatedBooking.user,
      type: "BOOKING_DECISION",
    });

    res.status(200).json({
      message: "Booking status updated by AI",
      payload: updatedBooking,
    });
  } catch (err) {
    next(err);
  }
};
