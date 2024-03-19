import express from "express";
import {
  forgotPW,
  logout,
  resetPW,
  signin,
  signup,
  validateOTP,
} from "../controllers/auth.js";
import { verifyToken } from "../verifyToken.js";

import path from "path";
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const router = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.use(express.static(path.join(__dirname, "../../frontend")));

router.get("/signup", (req, res) => {
  const token = req.cookies.access_token;
  if(!token) res.sendFile(path.join(__dirname, "../../frontend", "signup.html"));
  else
    res.redirect("/auth/home")
});

router.get("/signin",(req, res, next) => {
  const token = req.cookies.access_token;
  if(!token) 
    res.sendFile(path.join(__dirname, "../../frontend", "signin.html"));
  else
    res.redirect("/auth/home")
});

router.get("/home",  verifyToken, (req, res, next) => {
  res.sendFile(path.join(__dirname, "../../frontend", "home.html"));
});

router.get("/forgotpassword",  (req,res) => {
  const token = req.cookies.access_token;
  if(!token) res.sendFile(path.join(__dirname, "../../frontend", "forgotpw.html"));
  else res.redirect("/auth/home")
});


router.get("/otp", (req, res) => {
  const token = req.cookies.access_token;
  if(!token) res.sendFile(path.join(__dirname, "../../frontend", "otp.html"));
  else res.redirect("/auth/home")
});

router.get("/resetpassword", (req,res) =>{
  const token = req.cookies.access_token;
  if(!token) res.sendFile(path.join(__dirname, "../../frontend", "resetpw.html"));
  else res.redirect("/auth/home")
});

router.post("/forgotpw",forgotPW);
router.post("/forgotpw/validateOTP", validateOTP);
router.post("/forgotpw/validateOTP/resetpw", resetPW);
router.post("/logout",verifyToken, logout);

//CREATE A USER
router.post("/createNewUser", signup);
//SIGN IN
router.post("/userValidation", signin);
//GOOGLE AUTH
router.post("/google");
export default router;
