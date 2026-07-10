import { UserModel } from "../models/userModel.js";
import { hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";
const { sign } = jwt;
import {config} from "dotenv"

config()
// controller for register 
export const register = async(req,res,next)=>{
try
{
//Take user input (name, email, password, role, section, etc.)
const { name, email, password, role, section, year } = req.body;

if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
}

const allowedRoles=["STUDENT","FACULTY","ADMIN"];
const normalizedRole = role?.toUpperCase?.() ?? "";

if(!allowedRoles.includes(normalizedRole))
{
    return res.status(400).json({
        message:"Invalid Role"
    });
}

if (normalizedRole === "STUDENT") {
    if (!section) {
        return res.status(400).json({ message: "Section is required for students" });
    }
    if (!year) {
        return res.status(400).json({ message: "Year is required for students" });
    }
} else if (normalizedRole === "ADMIN") {
    // Admin accounts do not require section/year
}

const newUser = {
    name: name.trim(),
    email,
    password,
    role: normalizedRole,
    section: section?.trim() || undefined,
    year: normalizedRole === "STUDENT" ? Number(year) : undefined,
};

// Check if user already exists using email
const userEmail= await UserModel.findOne({email:newUser.email});
    if (userEmail){
        // → If exists → return error
    return res.status(409).json({
        message:"Email already exists"
    });
    }

// Hash the password using bcrypt
    newUser.password= await hash(newUser.password,12)

// Replace plain password with hashed password

// create new user document 
const newUserDoc = new UserModel(newUser);
// Save user in database

await newUserDoc.save()
// Send success response}
res.status(200).json({
    message:"User created successfully"
})

}
catch (err) {
    next(err)        // sending errors to error handling middleware
}
};



// login controller 
export const login = async(req,res)=>{
    // Take email and password from request
    const {email , password } = req.body;
    console.log("📥 Login request received:", { email, password, bodyKeys: Object.keys(req.body), contentType: req.headers['content-type'] })
    if (!email || !password) {
        console.warn("❌ Missing credentials:", { email: !!email, password: !!password })
        return res.status(400).json({ message: "Email and password are required", received: { email: !!email, password: !!password } })
    }
    
    try {
        console.log("🔍 Looking up user:", email)
        // Find user in database using email
        const user = await UserModel.findOne({email:email})
        // → If not found → return "User not found"
        if(!user){
            return res.status(400).json({message:"Invalid Email"})
        }
        // Compare entered password with stored hashed password\
        const isMatched = await compare(password,user.password) // 
        // console.log(isMatched)

        // → If not matching → return "Invalid credentials"
        if(!isMatched){
            return res.status(400).json({
                message:"Password is incorrect"
            })  
        }
        // Generate JWT token (include user id / role)          // token is used to 
        const signedToken = sign(
            {
                id: user._id,
                email: email,
                role: user.role,
                name: user.name,
            },
            process.env.SECRET_KEY,
            {
                expiresIn:"1h"
            },

        )

//     ✅ Correct Understanding (Polished)

// 👉 Step-by-step flow:

// User logs in
// Server creates a JWT token
// Token is stored in a cookie
// Browser automatically sends cookie in every request
// Server reads token from cookie
// Server verifies token
// If valid → user is identified ✅
        // Store token in cookie (httpOnly) 
        
// ✔ Token identifies the user
// ✔ Cookie just stores & sends the token

// JWT Token → Identity proof 🪪
// Cookie → Storage + transport 📦

//     res.cookie("token", signedToken, {
//     httpOnly: true,                                // currently i am using localStorage later i will use cookie 
//     secure: false,
//     sameSite: "lax",
//   });

       //remove password from user document
        let userObj = user.toObject();
        delete userObj.password;
        // Send success response
        console.log("Login success for user:", userObj.email)
        res.status(200).json({ message: "login success", payload: userObj ,token:signedToken});
    } catch (err) {
        console.error("❌ Login Error:", err.message)
        console.error("Full error:", err)
        res.status(500).json({ message: "Login failed - server error", error: err.message })
    }
}



// logout    
// in this oogout does not tries to detect the logind cookie its just look for the token inside the cookie if the token exist then remove the token from the cookie 
export const logout = async (req,res)=>{
    // Clear the cookie (token)
    // res.clearCookie("token",{
    //     httpOnly:true,
    //     secure:false,
    //     sameSite:"lax",
    // });

//     🧠 Important Concept

// 👉 clearCookie() does NOT check:

// if user is logged in ❌
// if token exists ❌

// 👉 It just says:

// “If cookie exists → delete it
// If not → do nothing”

    // Send success message
    res.status(200).json({
        message:"Logout Successfully "
    })
    
}

// change password controller 

export const changePassword = async (req,res)=>{

// Get user id from token (middleware)
const userId = req.user.id;
// Get oldPassword and newPassword
const {oldPassword,newPassword}=req.body;
// Find user by id
const user = await UserModel.findById(userId);
// if user not found
if (!user){
    return res.status(404).json({
        message:"Invalid user"
    })
}
// Compare oldPassword with stored password
const comparePass = await compare(oldPassword,user.password);
// → If not match → return error
if(!comparePass){
    return res.status(400).json({
        message:"Incorrect Old Password "
    });
}
// Hash newPassword
const newHashedPassword = await hash(newPassword,12);
// Update password in DB
user.password = newHashedPassword;
// Save user
await user.save();
// Send success response
return res.status(200).json({
    message:"Password Changed Successfully"
})
}



// get current logged-in user
export const getMe = async (req, res) => {
  try {
    res.status(200).json({
      payload: req.user
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch user"
    });
  }
};