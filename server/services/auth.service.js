"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword =
  exports.sendPasswordResetEmail =
  exports.refreshUserAccessToken =
  exports.verifyEmail =
  exports.loginUser =
  exports.createAccount =
    void 0;
const env_1 = require("../constants/env");
const http_1 = require("../constants/http");
const session_model_1 = __importDefault(require("../models/session.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const verificationCode_model_1 = __importDefault(
  require("../models/verificationCode.model"),
);
const appAssert_1 = __importDefault(require("../utils/appAssert"));
const bcrypt_1 = require("../utils/bcrypt");
const date_1 = require("../utils/date");
const emailTemplates_1 = require("../utils/emailTemplates");
const jwt_1 = require("../utils/jwt");
const sendMail_1 = require("../utils/sendMail");
const NotificationService = require("../services/notificationService");

const createAccount = async (data) => {
  const existingUser = await user_model_1.default.findOne({
    email: data.email,
  });
  (0, appAssert_1.default)(
    !existingUser,
    http_1.CONFLICT,
    "Email already in use",
  );
  const user = await user_model_1.default.create({
    email: data.email,
    password: data.password,
  });
  const userId = user._id;
  const verificationCode = await verificationCode_model_1.default.create({
    userId,
    type: "email_verification",
    expiresAt: (0, date_1.oneYearFromNow)(),
  });
  const url = `${env_1.APP_ORIGIN}/email/verify/${verificationCode._id}`;
  const response = await (0, sendMail_1.sendMail)({
    to: user.email,
    ...(0, emailTemplates_1.getVerifyEmailTemplate)(url),
  });

  if (response.error) {
    console.error("Email sending failed:", response.error);
  } else {
    console.log("Verification email sent successfully");
  }
  const session = await session_model_1.default.create({
    userId,
    userAgent: data.userAgent,
  });
  const refreshToken = (0, jwt_1.signToken)(
    {
      sessionId: session._id,
    },
    jwt_1.refreshTokenSignOptions,
  );
  const accessToken = (0, jwt_1.signToken)({
    userId,
    sessionId: session._id,
  });

  return {
    user: user.omitPassword(),
    accessToken,
    refreshToken,
  };
};
exports.createAccount = createAccount;

const loginUser = async ({ email, password, userAgent }) => {
  const user = await user_model_1.default.findOne({ email });
  (0, appAssert_1.default)(
    user,
    http_1.UNAUTHORIZED,
    "Invalid email or password",
  );
  (0, appAssert_1.default)(
    user.verified,
    http_1.UNAUTHORIZED,
    "Please verify your email before logging in.",
    "EmailNotVerified",
  );
  (0, appAssert_1.default)(
    user.status !== "suspended",
    http_1.UNAUTHORIZED,
    "Your account has been suspended. Please contact support.",
  );

  const isValid = await user.comparePassword(password);
  (0, appAssert_1.default)(
    isValid,
    http_1.UNAUTHORIZED,
    "Invalid email or password",
  );
  const userId = user._id;

  const session = await session_model_1.default.create({
    userId,
    userAgent,
  });
  const sessionInfo = {
    sessionId: session._id,
  };
  const refreshToken = (0, jwt_1.signToken)(
    sessionInfo,
    jwt_1.refreshTokenSignOptions,
  );
  const accessToken = (0, jwt_1.signToken)({
    ...sessionInfo,
    userId,
  });
  return {
    user: user.omitPassword(),
    accessToken,
    refreshToken,
  };
};
exports.loginUser = loginUser;

const verifyEmail = async (code) => {
  const validCode = await verificationCode_model_1.default.findOne({
    _id: code,
    type: "email_verification",
    expiresAt: { $gt: new Date() },
  });
  (0, appAssert_1.default)(
    validCode,
    http_1.NOT_FOUND,
    "Invalid or expired verification code",
  );
  const updatedUser = await user_model_1.default.findByIdAndUpdate(
    validCode.userId,
    {
      verified: true,
    },
    { new: true },
  );
  (0, appAssert_1.default)(
    updatedUser,
    http_1.INTERNAL_SERVER_ERROR,
    "Failed to verify email",
  );
  await validCode.deleteOne();
  return {
    user: updatedUser.omitPassword(),
  };
};
exports.verifyEmail = verifyEmail;

const refreshUserAccessToken = async (refreshToken) => {
  const { payload } = (0, jwt_1.verifyToken)(refreshToken, {
    secret: jwt_1.refreshTokenSignOptions.secret,
  });
  (0, appAssert_1.default)(
    payload,
    http_1.UNAUTHORIZED,
    "Invalid refresh token",
  );
  const session = await session_model_1.default.findById(payload.sessionId);
  const now = Date.now();
  (0, appAssert_1.default)(
    session && session.expiresAt.getTime() > now,
    http_1.UNAUTHORIZED,
    "Session expired",
  );

  const sessionNeedsRefresh =
    session.expiresAt.getTime() - now <= date_1.ONE_DAY_MS;
  if (sessionNeedsRefresh) {
    session.expiresAt = (0, date_1.thirtyDaysFromNow)();
    await session.save();
  }
  const newRefreshToken = sessionNeedsRefresh
    ? (0, jwt_1.signToken)(
        {
          sessionId: session._id,
        },
        jwt_1.refreshTokenSignOptions,
      )
    : undefined;
  const accessToken = (0, jwt_1.signToken)({
    userId: session.userId,
    sessionId: session._id,
  });
  return {
    accessToken,
    newRefreshToken,
  };
};
exports.refreshUserAccessToken = refreshUserAccessToken;

const sendPasswordResetEmail = async (email) => {
  try {
    const user = await user_model_1.default.findOne({ email });
    (0, appAssert_1.default)(user, http_1.NOT_FOUND, "User not found");
    const fiveMinAgo = (0, date_1.fiveMinutesAgo)();
    const count = await verificationCode_model_1.default.countDocuments({
      userId: user._id,
      type: "password_reset",
      createdAt: { $gt: fiveMinAgo },
    });
    (0, appAssert_1.default)(
      count <= 1,
      http_1.TOO_MANY_REQUESTS,
      "Too many requests, please try again later",
    );
    const expiresAt = (0, date_1.oneHourFromNow)();
    const verificationCode = await verificationCode_model_1.default.create({
      userId: user._id,
      type: "password_reset",
      expiresAt,
    });
    const url = `${env_1.APP_ORIGIN}/password/reset?code=${verificationCode._id}&exp=${expiresAt.getTime()}`;
    const { data, error } = await (0, sendMail_1.sendMail)({
      to: email,
      ...(0, emailTemplates_1.getPasswordResetTemplate)(url),
    });
    (0, appAssert_1.default)(
      data?.id,
      http_1.INTERNAL_SERVER_ERROR,
      `${error?.name} - ${error?.message}`,
    );
    return {
      url,
      emailId: data.id,
    };
  } catch (error) {
    console.log("SendPasswordResetError:", error.message);
    return {};
  }
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;

const resetPassword = async ({ verificationCode, password }) => {
  const validCode = await verificationCode_model_1.default.findOne({
    _id: verificationCode,
    type: "password_reset",
    expiresAt: { $gt: new Date() },
  });
  (0, appAssert_1.default)(
    validCode,
    http_1.NOT_FOUND,
    "Invalid or expired verification code",
  );
  const updatedUser = await user_model_1.default.findByIdAndUpdate(
    validCode.userId,
    {
      password: await (0, bcrypt_1.hashValue)(password),
    },
  );
  (0, appAssert_1.default)(
    updatedUser,
    http_1.INTERNAL_SERVER_ERROR,
    "Failed to reset password",
  );
  await validCode.deleteOne();

  await session_model_1.default.deleteMany({ userId: validCode.userId });
  return { user: updatedUser.omitPassword() };
};
exports.resetPassword = resetPassword;
