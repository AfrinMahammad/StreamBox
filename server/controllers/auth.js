import mongoose from "mongoose";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { createError } from "../error.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

import dotenv from "dotenv";
dotenv.config()

export const signup = async (req, res, next) => {
  try {
    
    // const salt = bcrypt.genSaltSync(10);
    // const hash = bcrypt.hashSync(req.body.password, salt);
    // const newUser = new User({email, password: hash });
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    const newUser = new User({
      name: name,
      email: email,
      password: hashedPassword,
    });

    await newUser.save();
    //res.status(200).send("User has been created!");
    res.redirect("/auth/signin");
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const signin = async (req, res, next) => {
  try {

    const user = await User.findOne({ email: req.body.email });
    if (!user) return next(createError(404, "User not found!"));

    const isCorrect = await bcrypt.compare(req.body.password, user.password);
    if (!isCorrect) return next(createError(400, "Wrong Credentials"));

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "24h" });
    const { password, ...others } = user._doc;

    res
      .cookie("access_token", token, {
         httpOnly: true,
      })
      .status(200)
      .redirect("/auth/home")
    console.log("User Validated");
  } catch (err) {
    next(err);
  }
};

let useremail = "";
export const forgotPW = async (req, res, next) => {
  useremail = req.body.email;
  const user = await User.findOne({ email: useremail });
  if (!user) return next(createError(404, "User not found!"));

  const transporter = nodemailer.createTransport({
    service: "gmail",
    secure: false,
    auth: {
      user: process.env.SENDER_EMAIL_ID,
      pass: process.env.SENDER_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.SENDER_EMAIL_ID,
    to: req.body.email,
    subject: "OTP to change your StreamBox Password",
    text: `Please, use the following One Time Password - ${otp} to verify your login id and create your profile.`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.send("Error sending email");
    } else {
      console.log("Email sent: " + info.response);
      //res.send('Email sent successfully');
      res.redirect("/auth/otp");
    }
  });
};

function generateRandomNumber() {
  const randomNumber = Math.floor(Math.random() * 900000) + 100000;
  return randomNumber.toString();
}

const otp = generateRandomNumber();

export const validateOTP = async (req, res, next) => {
  const { d1, d2, d3, d4, d5, d6 } = req.body;
  const param_otp =
    d1.toString() +
    d2.toString() +
    d3.toString() +
    d4.toString() +
    d5.toString() +
    d6.toString();

  if (otp.toString() === param_otp) {
    res.redirect("/auth/resetpassword");
  } else {
    res.send("Incorrect OTP");
  }
};

export const resetPW = async (req, res, next) => {
  if (req.body.password === req.body.confirm_password){
    const password = req.body.password;
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.findOneAndUpdate(
      { email : useremail},
      {password: hashedPassword}
     )
     .catch((error) => {
      console.error('Error updating user:', error);
     });
     res.redirect('/auth/signin');
  }else{
    res.send("Try Again, Confirm Password is not same as Password given")
  }
};

export const logout =  (req, res) => {
  // Clear the JWT token from the client side (e.g., clear cookie or localStorage)
  // For example, if using cookies:
  res.clearCookie('access_token'); // Adjust cookie name as needed

  // Send a response indicating successful logout
  res.status(200).json({ message: 'Logout successful' });
};