"use strict";
const UserModel = require("../models/user.model");
const { FORBIDDEN } = require("../constants/http");
const appAssert = require("../utils/appAssert").default;

const isAdmin = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.userId);

    appAssert(
      user?.role === "admin",
      FORBIDDEN,
      "Access denied",
      "AccessDenied",
    );

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = isAdmin;
