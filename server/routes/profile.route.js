"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("../utils/multer")); // import multer middleware
const profile_controller_1 = require("../controllers/profile.controller");
const profileRoutes = express_1.default.Router();
// Use upload.single for 'profilePic' field
profileRoutes.post("/create", multer_1.default.single("profilePic"), profile_controller_1.createProfileHandler);
profileRoutes.get("/", profile_controller_1.getProfileHandler);
profileRoutes.patch("/update", multer_1.default.single("profilePic"), profile_controller_1.updateProfileHandler);
exports.default = profileRoutes;
