"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const userRoutes = (0, express_1.Router)();

userRoutes.get("/", user_controller_1.getUserHandler);

userRoutes.get("/role/status", user_controller_1.getUserRoleHandler);

exports.default = userRoutes;
