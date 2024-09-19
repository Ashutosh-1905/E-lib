import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "node:path";
import createHttpError from "http-errors";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  console.log("files", req.files);

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
  const coverImage = files.coverImage[0];

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
    
  const filePath = path.resolve(
    __dirname,
    "../../public/data/uploads",
    coverImage.filename
  );

  try {
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      folder: "book-covers",
    });

      
      const bookFileName = files.file[0].filename;

      const bookFilePath = path.resolve(
          __dirname,
          "../../public/data/uploads",
          bookFileName
      );
      
      const bookFileUploadResult = await cloudinary.uploader.upload(bookFilePath, {
          resource_type: "raw",
          filename_override: bookFileName,
          folder: "book-pdfs",
          format: "pdf",
      });

       console.log("bookFileUploadResult: ", bookFileUploadResult);
      
      console.log("uploadResult: ", uploadResult);
      
    res.json({ Message: "Book created successfully", uploadResult });
  } catch (error) {
    console.error("Cloudinary Upload Error: ", error);
      return next(createHttpError(500, "Error while uploading the files."))
    }
    
};

export { createBook };
