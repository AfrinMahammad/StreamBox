import express from "express";
import { addVideo,updateVideo, deleteVideo, getVideo, trend, random, sub, addView, getByTag, search } from "../controllers/video.js";
import { verifyToken } from "../verifyToken.js";

import path from "path";
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const router = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.use(express.static(path.join(__dirname, "../../frontend")));

//create a video

router.get("/uploadvideo", verifyToken, (req,res) => {
    res.sendFile(path.join(__dirname, "../../frontend", "uploadvideo.html"));
});

router.post("/add", verifyToken, addVideo)
router.put("/:id", verifyToken, addVideo)
router.delete("/:id", verifyToken, addVideo)
router.get("/find/:id", getVideo)
router.put("/view/:id",addView)
router.get("/trend",trend)
router.get("/random",random)
router.get("/sub", verifyToken, sub)
router.get("/tags", getByTag)
router.get("/search", search)
//router.post('/upload', upload.single('videoFile'), uploadVideo);

export default router;