import { Request, Response } from "express";
import { createProfileSchema, updateProfileSchema } from "./profile.schemas";
import { createProfile, getProfile, updateProfile } from "../services/profile.service";
import appAssert from "../utils/appAssert";
import { CREATED, NOT_FOUND, OK, UNAUTHORIZED } from "../constants/http";
import catchErrors from "../utils/catchErrors";

export const createProfileHandler = catchErrors(async (req, res) => {
  const userId = req.userId;
  appAssert(userId, UNAUTHORIZED, "User not authenticated");

  const filePath = req.file
  ? `/uploads/profile_pics/${req.file.filename}`
  : undefined; 


  const input = createProfileSchema.parse({
    ...req.body,
    profilePic: filePath,
  });

  const profile = await createProfile(userId, input);

  return res.status(CREATED).json(profile);
});

export const getProfileHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.userId; 
    const profile = await getProfile(userId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    return res.status(200).json(profile);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};


export const updateProfileHandler = catchErrors(async (req, res) => {
  const userId = req.userId;
  appAssert(userId, UNAUTHORIZED, "User not authenticated");

  const filePath = req.file
  ? `/uploads/profile_pics/${req.file.filename}`
  : undefined;


  const input = updateProfileSchema.parse({
    ...req.body,
    profilePic: filePath,
  });

  const profile = await updateProfile(userId, input);
  appAssert(profile, NOT_FOUND, "Profile not found");

  return res.status(OK).json(profile);
});
