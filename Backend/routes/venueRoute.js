import exp from "express";
import { createVenue,deleteVenue,getAllVenues,getVenueById,updateVenue } from "../controllers/venueController.js";
import { verifyToken } from "../middleware/verifyToken.js";

export const venueApp = exp.Router();

// create venue 
venueApp.post("/create_venue",verifyToken("ADMIN"),createVenue);

// update venue 
venueApp.put("/update_venue/:id",verifyToken("ADMIN"),updateVenue);

// Delete Venue
venueApp.delete("/delete_venue/:id",verifyToken("ADMIN"),deleteVenue);

// Get All Venues
venueApp.get("/get_venues",verifyToken(),getAllVenues);

// Get Venue By Id 
venueApp.get("/get-venueById/:id",verifyToken("ADMIN"),getVenueById);