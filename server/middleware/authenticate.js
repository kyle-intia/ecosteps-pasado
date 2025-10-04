"use strict";

const appAssert = require('../utils/appAssert').default;
const UserModel = require('../models/user.model');
const { UNAUTHORIZED } = require('../constants/http');
const { verifyToken } = require('../utils/jwt');

const authenticate = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  appAssert(accessToken, UNAUTHORIZED, "Not authorized", "InvalidAccessToken");

  const { error, payload } = verifyToken(accessToken);
  appAssert(payload, UNAUTHORIZED, error === "jwt expired" ? "Token expired" : "Invalid token", "InvalidAccessToken");

  req.userId = payload.userId;
  req.sessionId = payload.sessionId;


  const now = new Date();

    // Update user's lastActive if now is later
  await UserModel.findByIdAndUpdate(req.userId, {
    $max: { lastActive: now },
  });

  const user = await UserModel.findById(req.userId).select('email');
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  req.user = user;


  next();
};

module.exports = authenticate;
