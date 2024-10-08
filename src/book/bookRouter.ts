import express from "express";
import { createBook, deleteBook, getSingleBook, listBooks, updateBook } from "./bookController";
import multer from "multer";
import path from "node:path";
import authanticate from "../middlewares/authanticate";

const bookRouter = express.Router();

const upload = multer({
  dest: path.resolve(__dirname, "../../public/data/uploads"),
  limits: { fileSize: 10 * 1024 * 1024 },
});

bookRouter.post(
  "/",
  authanticate,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  createBook
);

bookRouter.patch(
  "/:bookId",
  authanticate,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  updateBook
);

bookRouter.get("/", listBooks);

bookRouter.get("/:bookId", getSingleBook)

bookRouter.delete("/:bookId",authanticate, deleteBook);


export default bookRouter;
