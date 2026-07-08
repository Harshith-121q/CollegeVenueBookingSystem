import exp from "express"
import { bookVenue, getAdminBookingRequests, getAdminNotifications, getAutomationSetting, getMyBookings, getMyNotifications, updateAutomationSetting, updateBookingStatus, getVenueBookings } from "../controllers/venueBookingController.js";
import { aiApproveBooking } from "../controllers/aiApprovalController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyApiKey } from "../middleware/verifyApiKey.js";

export const venueBookingApp = exp.Router();

// book the venue 
venueBookingApp.post("/book_venue/:id", verifyToken("FACULTY"), bookVenue);

// get faculty booking requests
venueBookingApp.get("/my_bookings", verifyToken("FACULTY"), getMyBookings);
venueBookingApp.get("/venue_bookings/:id", verifyToken("FACULTY"), getVenueBookings);

// admin endpoints
venueBookingApp.get("/admin_requests", verifyToken("ADMIN"), getAdminBookingRequests);
venueBookingApp.get("/admin_notifications", verifyToken("ADMIN"), getAdminNotifications);
venueBookingApp.get("/my_notifications", verifyToken("FACULTY", "ADMIN"), getMyNotifications);
venueBookingApp.patch("/update_status/:id", verifyToken("ADMIN"), updateBookingStatus);
venueBookingApp.get("/automation_setting", verifyToken("ADMIN"), getAutomationSetting);
venueBookingApp.patch("/automation_setting", verifyToken("ADMIN"), updateAutomationSetting);

// AI approval endpoint
venueBookingApp.post("/ai_approve/:id", verifyApiKey, aiApproveBooking);
