import exp from "express";
import { register , login , logout , changePassword , getMe} from "../controllers/authController.js";
import { verifyToken } from "../middleware/verifyToken.js";

export const commanApp = exp.Router();

// register
commanApp.post("/register",register);

// login 
commanApp.post("/login",login);

// logout 
commanApp.post("/logout",logout);

// Change Password 
commanApp.put("/changePassword", verifyToken("FACULTY","STUDENT"),changePassword)

// this is used for restoring the user by checking the token again 
commanApp.get("/me", verifyToken(),getMe);