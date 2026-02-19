"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = exports.createProfile = void 0;
const userprofile_model_1 = __importDefault(
  require("../models/userprofile.model"),
);
const NotificationService = require("../services/notificationService");

const createProfile = async (userId, input) => {
  const existingProfile = await userprofile_model_1.default.findOne({
    user: userId,
  });
  if (existingProfile) {
    throw new Error("Profile already exists for this user");
  }
  const profileData = {
    userId: userId,
    ...input,
    profilePic: input.profilePic ?? undefined,
    userProfileDone: true,
    status: "active",
    role: "user",
  };
  const profile = await userprofile_model_1.default.create(profileData);
  return profile;
};
exports.createProfile = createProfile;

const getProfile = async (userId) => {
  return userprofile_model_1.default.findOne({ userId: userId });
};
exports.getProfile = getProfile;

const updateProfile = async (userId, input) => {
  return userprofile_model_1.default.findOneAndUpdate(
    { userId: userId },
    input,
    { new: true, runValidators: true },
  );
};
exports.updateProfile = updateProfile;

const getProfileDone = async (userId) => {
  return userprofile_model_1.default.findOne(
    { userId: userId },
    { userProfileDone: 1 },
  );
};
exports.getProfileDone = getProfileDone;
