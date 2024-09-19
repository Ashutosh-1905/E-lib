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
      author:_req.userId,
      coverImage: coverImageUpload.secure_url,
      file: bookFileUpload.secure_url,
    });

    // Delete the temporary files after uploading
    await fs.promises.unlink(coverImagePath);
    await fs.promises.unlink(bookFilePath);

    res
      .status(201)
      .json({ id: newBook._id, message: "Book created successfully" });
  } catch (error) {
    console.error("Error while uploading files: ", error);
    return next(createHttpError(500, "Error while uploading the files."));
  }
};

export { createBook };
