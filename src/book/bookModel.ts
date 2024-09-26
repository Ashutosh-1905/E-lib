import { Schema, model } from "mongoose";
import { Book } from "./bookTypes";

const bookSchema = new Schema<Book>(
  {
    title: {
      type: String,
      required: [true, "Book name is required"],
    },
    author: {
      type: Schema.Types.ObjectId,
      required: [true, "Author name is required"],
    },
    description: {
      type: String,
      require: true,
    },
    coverImage: {
      type: String,
      required: [true, "cover image is required"],
    },
    file: {
      type: String,
      required: [true, "file is required"],
    },
    genre: {
      type: String,
      required: [true, "genre is required"],
    },
  },
  { timestamps: true }
);

const bookModel = model<Book>("Book", bookSchema);

export default bookModel;
