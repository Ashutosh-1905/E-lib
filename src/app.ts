import express from "express";

const app = express();

app.get("/", (req, res) => {
    res.json({ Message: "Jai Shree Mahakal" });
})




export default app;