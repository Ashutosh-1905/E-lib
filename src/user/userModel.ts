import { Schema, model } from "mongoose";
import { User } from "./userTypes";

const userSchema = new Schema<User>(
  {
    name: {
      type: String,
      required: [true, "Name is Required"]
    },
    email: {
      type: String,
      required: [true, "E-mail is Required"],
      unique: [true, "Unique email is required"],
    },
    password: {
      type: String,
      required: [true, "Password must be Required"],
    },
  },
  { timestamps: true }
);

const User = model<User>("User", userSchema);

export default User;
