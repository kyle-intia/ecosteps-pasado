"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.createProfileSchema = void 0;
const zod_1 = require("zod");

exports.createProfileSchema = zod_1.z.object({
  firstName: zod_1.z.string().min(1, "First name is required"),
  lastName: zod_1.z.string().min(1, "Last name is required"),
  username: zod_1.z.string().min(1, "Username is required"),
  birthday: zod_1.z.coerce.date().optional(),
  profilePic: zod_1.z.string().optional(),
  address: zod_1.z.string().optional(),
  bio: zod_1.z.string().optional(),
});

exports.updateProfileSchema = zod_1.z.object({
  firstName: zod_1.z.string().min(1, "First name is required").optional(),
  lastName: zod_1.z.string().min(1, "Last name is required").optional(),
  username: zod_1.z.string().min(1, "Username is required").optional(),
  birthday: zod_1.z.coerce.date().optional(),
  profilePic: zod_1.z.string().optional(),
  address: zod_1.z.string().optional(),
  bio: zod_1.z.string().optional(),
});
