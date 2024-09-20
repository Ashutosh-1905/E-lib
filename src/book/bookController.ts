import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "node:path";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from "node:fs";
import { AuthRequest } from "../middlewares/authanticate";

interface MulterFiles {
  coverImage?: Express.Multer.File[];
  file?: Express.Multer.File[];
}

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre } = req.body;

  const files = req.files as MulterFiles;

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
    // Upload the cover image
    const coverImageUpload = await cloudinary.uploader.upload(coverImagePath, {
      folder: "book-covers",
    });

    // Upload the book PDF
    const bookFileUpload = await cloudinary.uploader.upload(bookFilePath, {
      resource_type: "raw",
      folder: "book-pdfs",
      format: "pdf",
    });

    const _req = req as AuthRequest;

    // Save book data to the database
    const newBook = await bookModel.create({
      title,
      genre,
      author: _req.userId,
      coverImage: coverImageUpload.secure_url,
      file: bookFileUpload.secure_url,
    });

    // Delete the temporary files after uploading
    await fs.promises.unlink(coverImagePath);
    await fs.promises.unlink(bookFilePath);

    res
      .status(201)
      .json({ id: newBook._id, message: "Book created successfully" });
  } catch (err) {
    return next(createHttpError(500, "Error while uploading the files."));
  }
};

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre } = req.body;
  const bookId = req.params.bookId;

  try {
    // Extract the authenticated user's ID
    const _req = req as AuthRequest;

    // Handle file uploads if provided
    const files = req.files as MulterFiles;

    // Prepare updates object
    let updates: { [key: string]: any } = {};

    // If a new cover image is uploaded
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

      const coverImagePath = path.resolve(
        __dirname,
        "../../public/data/uploads",
        coverImage.filename
      );

      // Upload the new cover image
      const coverImageUpload = await cloudinary.uploader.upload(
        coverImagePath,
        {
          folder: "book-covers",
        }
      );

      // Add the coverImage URL to updates object
      updates.coverImage = coverImageUpload.secure_url;

      // Delete the temporary file after upload
      await fs.promises.unlink(coverImagePath);
    }

    // If a new book file is uploaded
    if (files?.file?.[0]) {
      const bookFile = files.file[0];

      const bookFilePath = path.resolve(
        __dirname,
        "../../public/data/uploads",
        bookFile.filename
      );

      // Upload the new book file (PDF)
      const bookFileUpload = await cloudinary.uploader.upload(bookFilePath, {
        resource_type: "raw",
        folder: "book-pdfs",
        format: "pdf",
      });

      // Add the book file URL to updates object
      updates.file = bookFileUpload.secure_url;

      // Delete the temporary file after upload
      await fs.promises.unlink(bookFilePath);
    }

    // Add other fields to update if they are provided
    if (title) updates.title = title;
    if (genre) updates.genre = genre;

    // Find and update the book
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

const listBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // ADD Pagination

    const book = await bookModel.find();

    res.json(book);
  } catch (err) {
    return next(createHttpError(500, "Error while getting the book."));
  }
};

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

export { createBook, updateBook, listBooks, getSingleBook };
