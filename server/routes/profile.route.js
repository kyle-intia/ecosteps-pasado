"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer = require('../utils/multer');
const profile_controller_1 = require("../controllers/profile.controller");
const profileRoutes = express_1.default.Router();
// Use upload.single for 'profilePic' field
profileRoutes.post("/create", (req, res) => {
  multer.uploadProfilePic.single("profilePic")(req, res, (error) => {
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    // Call your existing handler
    profile_controller_1.createProfileHandler(req, res).catch(next); // make sure you pass next if you use it
  });
});
profileRoutes.get("/", profile_controller_1.getProfileHandler);
profileRoutes.patch("/update", (req, res) => {
  multer.uploadProfilePic.single("profilePic")(req, res, (error) => {
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    // If no error, call your existing handler logic
    profile_controller_1.updateProfileHandler(req, res).catch(next);
  });
});
profileRoutes.get("/user/status", profile_controller_1.getProfileDone);
exports.default = profileRoutes;