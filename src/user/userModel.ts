import { Schema, model } from "mongoose";
import { User } from "./userTypes";

const userSchema = new Schema<User>(
  {
    name: {
      type: String,
      required: [true, "Name is Required"],
    },
    email: {
      type: String,
      required: [true,"email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password must be Required"],
    },
  },
  { timestamps: true }
);

const userModel = model<User>("User", userSchema);

export default userModel;
