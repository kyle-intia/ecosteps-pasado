
import { z } from "zod";

export const createProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(1, "Username is required"),
  birthday: z.coerce.date().optional(), 
  profilePic: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  username: z.string().min(1, "Username is required").optional(),
  birthday: z.coerce.date().optional(),
  profilePic: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;