// THIS PAGE IS ONLY FOR ADMIN
import { VenueModel } from "../models/venueModel.js";

//  * create venue:
// Get data from request:
export const createVenue = async (req, res, next) => {
  try {
    const { name, roomNumber, type, capacity, block, floor, facilities } =
      req.body;

    // Get admin ID from req.user.id
    const adminId = req.user.id;
    // Validate required fields
    // validate if all the fields are exist or not
    if (!name || !roomNumber || !type || !capacity || !block) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (name.trim() === "") {
      return res.status(401).json({
        message: "Name Should not be Empty",
      });
    }
    // 5️⃣ Validate roomNumber
    if (roomNumber <= 0) {
      return res.status(400).json({
        message: "Room number must be positive",
      });
    }

    // 6️⃣ Validate type (enum)
    const validTypes = ["CLASSROOM", "LAB", "SEMINAR_HALL", "AUDITORIUM"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        message: "Invalid venue type",
      });
    }

    // 8️⃣ Validate block
    if (block.trim() === "") {
      return res.status(400).json({
        message: "Block cannot be empty",
      });
    }

    // 9️⃣ Check duplicate roomNumber
    const existingVenue = await VenueModel.findOne({ roomNumber });
    if (existingVenue) {
      return res.status(400).json({
        message: "Room already exists",
      });
    }
    // If missing → return error

    // Create new venue object
    const venue = new VenueModel({
      name,
      roomNumber,
      type,
      capacity,
      block,
      floor,
      facilities,
      createdBy: adminId, // Add createdBy = adminId
    });

    // Save venue to database
    await venue.save();
    // Return success response with venue data
    return res.status(201).json({
      message: "Venue Created Successfully",
    });
  } catch (err) {
    next(err);
  }
};


//  * Venue update controller (used to update the venue details )

export const updateVenue = async (req, res, next) => {
  try {
    // Receive Request
    const venueId = req.params.id;
    const newVenue = req.body;
    // Authenticate User
    const adminid = req.user?.id;
    const isAdmin = req.user?.role === "ADMIN";
    // Validate Venue ID
    if (!venueId) {
      return res.status(400).json({
        message: "Invalid Venue Id",
      });
    }
    // Check Venue Exists
    const venue = await VenueModel.findById(venueId);
    if (!venue) {
      return res.status(404).json({
        message: "Venue not Found",
      });
    }
    // Authorization Check
    if (!isAdmin && venue.createdBy?.toString() !== adminid) {
      return res.status(403).json({
        message: "You are not Authorized",
      });
    }

    // 6. Validate Input Fields (only if provided)
    if (newVenue.name && newVenue.name.trim() === "") {
      return res.status(400).json({ message: "Name cannot be empty" });
    }

    if (newVenue.roomNumber && newVenue.roomNumber === "") {
      return res.status(400).json({ message: "Room number cannot be empty" });
    }

    if (newVenue.capacity && newVenue.capacity <= 0) {
      return res.status(400).json({ message: "Capacity must be positive" });
    }

    if (newVenue.block && newVenue.block.trim() === "") {
      return res.status(400).json({ message: "Block cannot be empty" });
    }

    // Check Duplicate Room
    if (newVenue.roomNumber) {
      const existing = await VenueModel.findOne({
        roomNumber: newVenue.roomNumber,
      });

      if (existing && existing._id.toString() !== venueId) {
        return res.status(400).json({
          message: "Room Already exists",
        });
      }
    }
    // Update Fields
    const updatedVenue = await VenueModel.findByIdAndUpdate(
      venueId,
      { $set: newVenue },
      { new: true, runValidators: true }, // this will update and do changes in db
    );
    // for update we can use this also
    //const venue = await VenueModel.findById(venueId);

    // Object.assign(venue, newVenue);

    // await venue.save();

    // // Save Changes
    // await venue.save()
    // Send Response
    return res.status(200).json({
      message: "Venue Updated Successfully",
      venue: updatedVenue,
    });
    // Handle Errors
  } catch (err) {
    next(err);
  }
};

// * Hard Delete the venue

export const deleteVenue = async (req,res,next)=>{
  try{

    // Receive Request
    const venueId = req.params.id;
    
    // Authenticate User
    const adminid = req.user?.id;
    const isAdmin = req.user?.role === "ADMIN";
    // Validate Venue ID
    if (!venueId) {
      return res.status(400).json({
        message: "Invalid Venue Id",
      });
    }
    // Check Venue Exists // it wiil get the mongoose object and later it can do further operations 
    const venue = await VenueModel.findById(venueId);       //  .save() ✅
                                                              // .toObject() ✅
                                                              // .toJSON() ✅
                                                              // schema methods ✅
    if (!venue) {
      return res.status(404).json({
        message: "Venue not Found",
      });
    }
    // Authorization Check
    if (!isAdmin && venue.createdBy?.toString() !== adminid) {
      return res.status(403).json({
        message: "You are not Authorized",
      });
    }
    // Delete Venue
    await VenueModel.findByIdAndDelete(venueId);
    
    // Send Response
    return res.status(200).json({
      message:`veneu ${venue.roomNumber} deleted Successfully `
    })
    
  }
  // Handle Errors
  catch(err){
    next(err)
  }
}


// get All venues Available
export const getAllVenues = async (req,res,next)=>{
  try{
    // find all venues 
    const venues = await VenueModel.find()
    // if venues not found return error
    if(!venues){
      return res.status(404).json({
        message:"Venues Not Found"
      })
    }

    // return venues 
    return res.status(200).json({
      message:"All Venues ",
      payload:venues
    })
  }
  catch(err){
    next(err)
  }
}


// get venue by id 
export const getVenueById = async (req,res,next)=>{
  try {
    // get venue id 
    const venueId = req.params.id
    // check id is valid 
    if(!venueId){
      return res.status(400).json({
        message:"Venue id is Invalid"
      })
    }
    // get venue by id 
    const venue = await VenueModel.findById(venueId);
    // check venue exist or not 
    if (!venue){
      return res.status(404).json({
        message:"Venue not Found"
      });
    }

    // if venue founded send response 
    return res.status(200).json({
      message:"Venue Founded",
      payload:venue
    });
  } catch(err){
    next(err);
  }
}
