import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import User from "./userModel";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;
  // validation
  if (!name || !email || !password) {
    const error = createHttpError(400, "All field are required");
    return next(error);
    }
    
    // database call.
    const user = await User.findOne({ email: email });
    if (user) {
        const error = createHttpError(400, "User already exists with is email.")
        return next(error);
}
    // password -> hash
    const hashedPassword = await bcrypt.hash(password, 10)
    
    
  res.json({ Message: "User Registered" });
  next();
};



export { createUser };
