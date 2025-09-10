"use strict";

const appAssert = require('../utils/appAssert').default;
const { UNAUTHORIZED } = require('../constants/http');
const { verifyToken } = require('../utils/jwt');

const authenticate = (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  appAssert(accessToken, UNAUTHORIZED, "Not authorized", "InvalidAccessToken");

  const { error, payload } = verifyToken(accessToken);
  appAssert(payload, UNAUTHORIZED, error === "jwt expired" ? "Token expired" : "Invalid token", "InvalidAccessToken");

  req.userId = payload.userId;
  req.sessionId = payload.sessionId;
  next();
};

module.exports = authenticate;
