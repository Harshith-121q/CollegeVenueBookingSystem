import { Schema, model } from "mongoose";

const userSchema = new Schema({
    name:{
        type:String,
        required:[true,"Name is required "]
    },
    email:{
        type:String,
        required:[true,"Email is required"],
        unique:true 
    },
    // pin_no:{
    //     type:String,
    //     required:[true,"Pin no is required "],
    //     unique:true,
    // },
    
    // department:String,
    role:{
        type:String,
        required:[true,"Role is required "],
        enum:["FACULTY","STUDENT","ADMIN"],
        default:"FACULTY",

    },
    year:{
        type:Number,
        required:[function() { return this.role === 'STUDENT' }, "Year is required for students"],
    },
    section:{
        type:String,
        required:[function() { return this.role === 'STUDENT' }, "Section is required for students"]
    },
    password:{type:String,required:true},

},{
    timestamps:true
});


export const UserModel = model("User",userSchema);