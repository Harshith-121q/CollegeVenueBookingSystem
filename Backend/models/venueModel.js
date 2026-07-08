import {Schema , model  , Types } from "mongoose";

const venueSchema = new Schema({
  name: {
    type: String,
    required: [true, "Venue name is required"],
    trim: true
  },
  roomNumber:{
    type:String,
    required:[true,"venue number is required "],
    unique:true
  },
  type: {
    type: String,
    enum: ["CLASSROOM", "LAB", "SEMINAR_HALL", "AUDITORIUM"],
    required: true
  },

  capacity: {
    type: Number,
    required: true,
    min: 1
  },

  block: {
    type: String,
    required: true,
    
  },

  floor: {
    type: Number
  },

  facilities: [
    {
      type: String
    }
  ],
  createdBy:{
    type:Types.ObjectId,
    ref:"User",
    required:true
  },
  isActive:{
    type:Boolean,
    default:true
}
}
,{
    timestamps:true
});

export const VenueModel = model("Venue",venueSchema);
