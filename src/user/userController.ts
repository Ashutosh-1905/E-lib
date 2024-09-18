import { NextFunction, Request, Response } from "express";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
    res.json({ Message: "User Registered" });
    next();
};



export { createUser };
