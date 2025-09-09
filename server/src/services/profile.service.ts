// profile.service.ts

import UserProfileModel, { UserProfileDocument } from "../models/userprofile.model";
import { CreateProfileInput, UpdateProfileInput } from "../controllers/profile.schemas";
import { Types } from "mongoose";



export const createProfile = async (userId: Types.ObjectId, input: CreateProfileInput): Promise<UserProfileDocument> => {
  const existingProfile = await UserProfileModel.findOne({ user: userId });
  if (existingProfile) {
    throw new Error("Profile already exists for this user");
  }

  const profileData = {
    user: userId,
    ...input,
    profilePic: input.profilePic ?? undefined, 
  };

  const profile = await UserProfileModel.create(profileData);
  return profile;
};

export const getProfile = async (userId: Types.ObjectId): Promise<UserProfileDocument | null> => {
  return UserProfileModel.findOne({ user: userId });
};

export const updateProfile = async (userId: Types.ObjectId, input: UpdateProfileInput): Promise<UserProfileDocument | null> => {
  return UserProfileModel.findOneAndUpdate({ user: userId }, input, { new: true, runValidators: true });
};