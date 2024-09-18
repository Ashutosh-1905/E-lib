import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import userModel from "./userModel";
import { sign } from "jsonwebtoken";
import { config } from "../config/config";
import { User } from "./userTypes";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;

  // validation
  if (!name || !email || !password) {
    const error = createHttpError(400, "All field are required");
    return next(error);
  }
  // database call.
  try {
    const user = await userModel.findOne({ email: email });
    if (user) {
      const error = createHttpError(
        400,
        "User already exists with this email."
      );
      return next(error);
    }
  } catch (err) {
    return next(createHttpError(500, "Error While getting user"));
  }
  // password -> hash.
  const hashedPassword = await bcrypt.hash(password, 10);
  let newUser: User;
  try {
    newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });
  } catch (err) {
    return next(createHttpError(500, "error While Creating User"));
  }

  // generate token.
  try {
    const token = sign({ sub: newUser._id }, config.jwtSecret as string, {
      expiresIn: "7d",
    });

    res.status(201).json({ accessToken: token });
    next();
  } catch (err) {
    return next(createHttpError(500, "Error While signing jwt token"));
  }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  
  const { email, password } = req.body;
  if (!email || !password) {
    return next(createHttpError(400, "All Fields are required"));
  }

  const user = await userModel.findOne({ email });
   if (!user) {
     return next(createHttpError(404, "User not not Found"));
  }

  try {
    const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
    return next(createHttpError(400, "Email or Password are incorrect !"))
    }
  } catch (err) {
    return next(createHttpError(500, "Bcrypt password error"));
  }

   try {
    const token = sign({ sub: user._id }, config.jwtSecret as string, {
      expiresIn: "7d",
    });

    res.status(201).json({ accessToken: token });
     next();
     
  } catch (err) {
    return next(createHttpError(500, "Error While signing jwt token"));
  }

  res.json({ Message: "OK" });
};

export { createUser, loginUser };
