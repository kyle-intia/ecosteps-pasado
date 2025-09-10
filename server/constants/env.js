"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESEND_API_KEY = exports.EMAIL_SENDER = exports.JWT_REFRESH_SECRET = exports.JWT_SECRET = exports.APP_ORIGIN = exports.MONGO_URI = exports.PORT = exports.NODE_ENV = void 0;
const getEnv = (key, defaultValue) => {
    const value = process.env[key] || defaultValue;
    if (value === undefined) {
        throw Error(`Missing String environment variable for ${key}`);
    }
    return value;
};
exports.NODE_ENV = getEnv("NODE_ENV", "development");
exports.PORT = getEnv("PORT", "4004");
exports.MONGO_URI = getEnv("MONGO_URI");
exports.APP_ORIGIN = getEnv("APP_ORIGIN");
exports.JWT_SECRET = getEnv("JWT_SECRET");
exports.JWT_REFRESH_SECRET = getEnv("JWT_REFRESH_SECRET");
exports.EMAIL_SENDER = getEnv("EMAIL_SENDER");
exports.RESEND_API_KEY = getEnv("RESEND_API_KEY");
