import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import userModel from "./userModel";
import { sign } from "jsonwebtoken";
import { config } from "../config/config";
import { User } from "./userTypes";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    return next(createHttpError(400, "All fields are required"));
  }

  // Database call
  try {
    const user = await userModel.findOne({ email: email });
    if (user) {
      return next(createHttpError(400, "User already exists with this email."));
    }
  } catch (err) {
    return next(createHttpError(500, "Error while getting user"));
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);
  let newUser: User;
  try {
    newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });
  } catch (err) {
    return next(createHttpError(500, "Error while creating user"));
  }

  // Generate token
  try {
    const token = sign({ sub: newUser._id }, config.jwtSecret as string, {
      expiresIn: "7d",
    });

    return res.status(201).json({
      Success: true,
      message: "User created successfully.",
      accessToken: token,
    });
  } catch (err) {
    return next(createHttpError(500, "Error while signing JWT token"));
  }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(createHttpError(400, "All fields are required"));
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(createHttpError(400, "Email or password are incorrect!"));
    }

    // Generate token
    const token = sign({ sub: user._id }, config.jwtSecret as string, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      Success: true,
      message: "User login successfully.",
      accessToken: token,
    });
  } catch (err) {
    return next(createHttpError(500, "Bcrypt password error"));
  }
};


export { createUser, loginUser };
