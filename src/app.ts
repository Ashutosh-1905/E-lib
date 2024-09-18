import express from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import userRouter from "./user/userRouter";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ Message: "Welcome to E-lib" });
});


app.use("/api/users", userRouter)


// global Error Handler

app.use(globalErrorHandler)

export default app;
