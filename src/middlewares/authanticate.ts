import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { verify } from "jsonwebtoken";
import { config } from "../config/config";

export interface AuthRequest extends Request {
  userId: string;
}
const authanticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return next(createHttpError(401, "Authorization token is required."));
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = verify(token, config.jwtSecret as string);

    const _req = req as AuthRequest;
    _req.userId = decoded.sub as string;
    next();
  } catch (err) {
    return next(createHttpError(401, "Invalid token."));
  }
};

export default authanticate;
