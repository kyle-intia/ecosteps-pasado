"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const AppError_1 = __importDefault(require("../utils/AppError"));
const http_1 = require("../constants/http");
const cookies_1 = require("../utils/cookies");
const handleZodError = (res, error) => {
    const errors = error.issues.map((err) => ({
        path: err.path.join("."),
        message: err.message,
    }));
    return res.status(http_1.BAD_REQUEST).json({
        errors,
        message: error.message,
    });
};
const handleAppError = (res, error) => {
    return res.status(error.statusCode).json({
        message: error.message,
        errorCode: error.errorCode,
    });
};
const errorHandler = (error, req, res, next) => {
    console.log(`PATH ${req.path}`, error);
    if (req.path === cookies_1.REFRESH_PATH) {
        (0, cookies_1.clearAuthCookies)(res);
    }
    if (error instanceof zod_1.z.ZodError) {
        return handleZodError(res, error);
    }
    if (error instanceof AppError_1.default) {
        return handleAppError(res, error);
    }
    return res.status(http_1.INTERNAL_SERVER_ERROR).send("Internal server error");
};
exports.default = errorHandler;
