import express from "express";
import upload from "../utils/multer"; // import multer middleware
import {
  createProfileHandler,
  getProfileHandler,
  updateProfileHandler,
} from "../controllers/profile.controller";

const profileRoutes = express.Router();

// Use upload.single for 'profilePic' field
profileRoutes.post("/create", upload.single("profilePic"), createProfileHandler);
profileRoutes.get("/", getProfileHandler);
profileRoutes.patch("/update", upload.single("profilePic"), updateProfileHandler);

export default profileRoutes;




