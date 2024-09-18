import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import User from "./userModel";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;
  // validation
  if (!name || !email || !password) {
    const error = createHttpError(400, "All field are required");
    return next(error);
    }
    
    const user = await User.findOne({ email: email });
    if (user) {
        const error = createHttpError(400, "User already exists with is email.")
        return next(error);
}

  res.json({ Message: "User Registered" });
  next();
};



export { createUser };
