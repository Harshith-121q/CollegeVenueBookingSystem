import jwt from "jsonwebtoken"
const {verify}=jwt;
import { config } from "dotenv"
config()

// cookies are very safe and there is now xss attacks by using cookies but there is a chance of xss attacks using localStorage 
// So use Cookies setup in frontend for production level 
export const verifyToken= (...allowedRoles)=>{
    return (req,res,next)=>{
        try {
            // // Extract token from request
            // const token = req.cookies?.token;
            // // printing cookie's(Token)
            // console.log("Token:", req.cookies?.token);   presently working with hearders but later i will update it with cookies for security 

            // get Token From Authorization header 
            const authHeader = req.headers.authorization;
            const token = authHeader?.split(" ")[1];
            // If token missing → return 401
            if(!token){
                return res.status(401).json({   
                    message:"Plz login first"  // this is for the one who dont have token i.e did'nt logged in an accessing the components 
                })
            }
            // Verify token using secret key
            const decodedToken = verify(token,process.env.SECRET_KEY);

            // If invalid → return 401
            if(!decodedToken){
                return res.status(401).json({
                    message:"Invalid token"
                });

            }

            // If roles provided → check authorization
            // If unauthorized → return 403
            if(allowedRoles.length > 0 && !allowedRoles.includes(decodedToken.role)){
                return res.status(403).json({
                    message:"You are not authorized "
                });
            }
            
            // Attach decoded user to req.user
            req.user=decodedToken;
            // Call next()
            next();


        }
        catch(err){
            res.status(401).json({
                message:"Invalid Token"
            });
        }
    }
}
