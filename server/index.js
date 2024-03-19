import express from "express";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

import userRoutes from "./routes/users.js";
import videoRoutes from "./routes/videos.js";
import commentRoutes from "./routes/comments.js";
import authRoutes from "./routes/auth.js";

import { uploadVideo, upload } from "./controllers/videoupload.js";
import { verifyToken } from "./verifyToken.js";
import User from "./models/User.js";
import Video from "./models/Video.js";
import { createError } from "./error.js";

const app = express();

app.use(cookieParser());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../frontend")));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

dotenv.config();

app.set("frontend", path.join(__dirname, "..", "frontend"));

app.get("/",(req, res) => {
  const token = req.cookies.access_token;
  if(!token) 
    res.sendFile(path.join(__dirname, "../frontend", "select.html"));
  else
    res.redirect("/auth/home")
});

app.post("/uploadvideo", verifyToken, upload.single('videoFile'),  async (req, res) => {
  uploadVideo(req,res);
  // const {videoUrl, captionsUrl} = uploadVideo(req,res);
  //   const newVideo = new Video({
  //     userId: req.user.id,
  //     title: req.body.title,
  //     desc: req.body.desc,
  //     videoUrl: videoUrl,
  //     captionsUrl: captionsUrl,
  //     tags: req.body.tags,
  //   });
  
  //   try {
  //     const savedVideo = await newVideo.save();
  //     res.status(200).json(savedVideo);
  //   } catch (err) {
  //     console.error("Error saving video to database:", err);
  //     res.status(500).json({ success: false, message: "Failed to save video to database." });
  //   }
});

const connect = () => {
  mongoose
    .connect(process.env.MONGO)
    .then(() => {
      console.log("Connected to DB");
    })
    .catch((err) => {
      throw err;
    });
}

app.use(express.json());
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/videos", videoRoutes);
app.use("/comments", commentRoutes);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Something went wrong!";
  return res.status(status).json({
    success: false,
    status,
    message,
    // status: status,
    // message:message
  });
});
const port = 4000;
app.listen(port, () => {
  try {
    connect();
    console.log("Connected to server");
    console.log(`http://localhost:${port}`);
  } catch {
    console.log(err);
  }
});