"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema =
  exports.verificationCodeSchema =
  exports.registerSchema =
  exports.loginSchema =
  exports.emailSchema =
    void 0;
const zod_1 = require("zod");

exports.emailSchema = zod_1.z.string().email().min(1).max(255);
const passwordSchema = zod_1.z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^[a-zA-Z0-9!@#$%^&*()\-_=+]+$/,
    "Password can only contain letters, numbers, and the following special characters: !@#$%^&*()-_=+",
  );

exports.loginSchema = zod_1.z.object({
  email: exports.emailSchema,
  password: passwordSchema,
  userAgent: zod_1.z.string().optional(),
});

exports.registerSchema = exports.loginSchema
  .extend({
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

exports.verificationCodeSchema = zod_1.z.string().min(1).max(24);

exports.resetPasswordSchema = zod_1.z.object({
  password: passwordSchema,
  verificationCode: exports.verificationCodeSchema,
});
