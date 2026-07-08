import { Schema, model, Types } from "mongoose";

const notificationSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["BOOKING_REQUEST", "BOOKING_DECISION"],
    default: "BOOKING_REQUEST",
  },
  bookingId: {
    type: Types.ObjectId,
    ref: "VenueBooking",
    required: true,
  },
  receiverRole: {
    type: String,
    enum: ["ADMIN", "FACULTY"],
    default: "ADMIN",
  },
  receiverId: {
    type: Types.ObjectId,
    ref: "User",
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export const NotificationModel = model("Notification", notificationSchema);
