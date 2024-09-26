import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "node:path";
import mongoose from "mongoose";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from "node:fs";
import { AuthRequest } from "../middlewares/authanticate";

interface MulterFiles {
  coverImage?: Express.Multer.File[];
  file?: Express.Multer.File[];
}

// CREATE BOOK
const createBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre, description } = req.body;
  const files = req.files as MulterFiles;

  // Validate required files
  if (!files?.coverImage?.[0] || !files?.file?.[0]) {
    return res
      .status(400)
      .json({ error: "Both coverImage and file are required." });
  }

  const coverImage = files.coverImage[0];
  const bookFile = files.file[0];
  const validImageTypes = ["jpg", "jpeg", "png", "gif"];
  const coverImageExtension = coverImage.originalname
    .split(".")
    .at(-1)
    ?.toLowerCase();

  // Validate image extension
  if (!validImageTypes.includes(coverImageExtension || "")) {
    return res
      .status(400)
      .json({ error: "Invalid file format. Only images are allowed." });
  }

  const coverImagePath = path.resolve(
    __dirname,
    "../../public/data/uploads",
    coverImage.filename
  );
  const bookFilePath = path.resolve(
    __dirname,
    "../../public/data/uploads",
    bookFile.filename
  );

  try {
    const [_coverImageUpload, _bookFileUpload] = await Promise.all([
      cloudinary.uploader.upload(coverImagePath, { folder: "book-covers" }),
      cloudinary.uploader.upload(bookFilePath, {
        resource_type: "raw",
        folder: "book-pdfs",
        format: "pdf",
      }),
    ]);

    const _req = req as AuthRequest;

    if (!_req.userId) {
      return next(createHttpError(401, "Unauthorized user."));
    }

    // Create new book entry
    const newBook = await bookModel.create({
      title,
      description,
      genre,
      author: _req.userId,
      coverImage: _coverImageUpload.secure_url,
      file: _bookFileUpload.secure_url,
    });

    // Clean up local files after successful upload
    await Promise.all([
      fs.promises.unlink(coverImagePath),
      fs.promises.unlink(bookFilePath),
    ]);

    return res
      .status(201)
      .json({ id: newBook._id, message: "Book created successfully" });
  } catch (err) {
    // Clean up files even in case of failure
    await Promise.all([
      fs.promises.unlink(coverImagePath).catch(() => {}),
      fs.promises.unlink(bookFilePath).catch(() => {}),
    ]);

    // Send error response and stop further execution
    return next(createHttpError(500, "Error while uploading the files."));
  }
};

// UPDATE BOOK
const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre, description } = req.body;
  const bookId = req.params.bookId;

  try {
    const _req = req as AuthRequest;
    const files = req.files as MulterFiles;

    let updates: { [key: string]: any } = {};

    const book = await bookModel.findOne({ _id: bookId, author: _req.userId });

    if (!book) {
      return next(createHttpError(404, "Book not found or unauthorized."));
    }

    // Handle cover image update
    if (files?.coverImage?.[0]) {
      const coverImage = files.coverImage[0];
      const coverImageExtension = coverImage.originalname
        .split(".")
        .at(-1)
        ?.toLowerCase();

      const validImageTypes = ["jpg", "jpeg", "png", "gif", "jfif"];
      if (!validImageTypes.includes(coverImageExtension || "")) {
        return next(
          createHttpError(400, "Invalid file format. Only images are allowed.")
        );
      }

      // Delete the previous cover image from Cloudinary
      const coverFileSplits = book.coverImage.split("/");
      const coverImagePublicId = `${coverFileSplits.at(-2)}/${coverFileSplits
        .at(-1)
        ?.split(".")
        .at(-2)}`;
      await cloudinary.uploader.destroy(coverImagePublicId);

      // Upload the new cover image to Cloudinary
      const coverImagePath = path.resolve(
        __dirname,
        "../../public/data/uploads",
        coverImage.filename
      );
      const coverImageUpload = await cloudinary.uploader.upload(
        coverImagePath,
        {
          folder: "book-covers",
        }
      );

      updates.coverImage = coverImageUpload.secure_url;
      await fs.promises.unlink(coverImagePath);
    }

    // Handle book file update
    if (files?.file?.[0]) {
      const bookFile = files.file[0];

      // Delete the previous book file from Cloudinary
      const bookFileSplits = book.file.split("/");
      const bookFilePublicId = `${bookFileSplits.at(-2)}/${bookFileSplits
        .at(-1)
        ?.split(".")
        .at(-2)}`;
      await cloudinary.uploader.destroy(bookFilePublicId, {
        resource_type: "raw",
      });

      // Upload the new book file to Cloudinary
      const bookFilePath = path.resolve(
        __dirname,
        "../../public/data/uploads",
        bookFile.filename
      );
      const bookFileUpload = await cloudinary.uploader.upload(bookFilePath, {
        resource_type: "raw",
        folder: "book-pdfs",
        format: "pdf",
      });

      updates.file = bookFileUpload.secure_url;
      await fs.promises.unlink(bookFilePath);
    }

    if (title) updates.title = title;
    if (genre) updates.genre = genre;
    if (description) updates.description = description;


    const updatedBook = await bookModel.findOneAndUpdate(
      { _id: bookId, author: _req.userId },
      { $set: updates },
      { new: true }
    );

    if (!updatedBook) {
      return next(createHttpError(404, "Book not found or unauthorized."));
    }
    res
      .status(200)
      .json({ message: "Book updated successfully", book: updatedBook });
  } catch (err) {
    return next(createHttpError(500, "Error while updating the book."));
  }
};

// GET ALL BOOKS
const listBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const book = await bookModel.find();
    res.json(book);
  } catch (err) {
    return next(createHttpError(500, "Error while getting the book."));
  }
};

// GET A SINGLE BOOK
const getSingleBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const bookId = req.params.bookId;
    const book = await bookModel.findOne({ _id: bookId });
    if (!book) {
      return res.status(404).json({ Message: "Book not found." });
    }

    res.json(book);
  } catch (err) {
    return next(createHttpError(500, "Error while getting the book."));
  }
};

// DELETE BOOK

const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookId = req.params.bookId;

    console.log("Received bookId:", bookId);

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return next(createHttpError(400, "Invalid Book ID."));
    }
    const book = await bookModel.findOne({ _id: bookId });

    if (!book) {
      return next(createHttpError(404, "Book not found.")); // If no book is found, respond with 404
    }

    const _req = req as AuthRequest;
    if (book.author.toString() !== _req.userId) {
      return next(
        createHttpError(403, "Only authorized persons can delete the book.")
      );
    }

    // Extract public IDs for Cloudinary images/files
    const coverFileSplits = book.coverImage.split("/");
    const coverImagePublicId = `${coverFileSplits.at(-2)}/${coverFileSplits
      .at(-1)
      ?.split(".")
      .at(-2)}`;

    const bookFileSplits = book.file.split("/");
    const bookFilePublicId = `${bookFileSplits.at(-2)}/${bookFileSplits
      .at(-1)
      ?.split(".")
      .at(-2)}`;

    // Delete cover image and book file from Cloudinary
    await Promise.all([
      cloudinary.uploader.destroy(coverImagePublicId),
      cloudinary.uploader.destroy(bookFilePublicId, { resource_type: "raw" }),
    ]);

    await bookModel.findOneAndDelete({ _id: bookId });

    return res.status(200).json({ message: "Book deleted successfully." });
  } catch (err) {
    console.error("Error during book deletion:", err);
    return next(createHttpError(500, "Error while deleting the book."));
  }
};

export { createBook, updateBook, listBooks, getSingleBook, deleteBook };
