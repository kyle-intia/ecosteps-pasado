"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileHandler = exports.getProfileHandler = exports.createProfileHandler = void 0;
const profile_schemas_1 = require("./profile.schemas");
const profile_service_1 = require("../services/profile.service");
const appAssert_1 = __importDefault(require("../utils/appAssert"));
const http_1 = require("../constants/http");
const catchErrors_1 = __importDefault(require("../utils/catchErrors"));
exports.createProfileHandler = (0, catchErrors_1.default)(async (req, res) => {
    const userId = req.userId;
    (0, appAssert_1.default)(userId, http_1.UNAUTHORIZED, "User not authenticated");
    const filePath = req.file
        ? `/uploads/profile_pics/${req.file.filename}`
        : undefined;
    const input = profile_schemas_1.createProfileSchema.parse({
        ...req.body,
        profilePic: filePath,
        userProfileDone: true,
    });
    const profile = await (0, profile_service_1.createProfile)(userId, input);
    return res.status(http_1.CREATED).json(profile);
});
const getProfileHandler = async (req, res) => {
    try {
        const userId = req.userId;
        const profile = await (0, profile_service_1.getProfile)(userId);
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }
        return res.status(200).json(profile);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.getProfileHandler = getProfileHandler;
exports.updateProfileHandler = (0, catchErrors_1.default)(async (req, res) => {
    const userId = req.userId;
    (0, appAssert_1.default)(userId, http_1.UNAUTHORIZED, "User not authenticated");
    const filePath = req.file
        ? `/uploads/profile_pics/${req.file.filename}`
        : undefined;
    const input = profile_schemas_1.updateProfileSchema.parse({
        ...req.body,
        profilePic: filePath,
    });
    const profile = await (0, profile_service_1.updateProfile)(userId, input);
    (0, appAssert_1.default)(profile, http_1.NOT_FOUND, "Profile not found");
    return res.status(http_1.OK).json(profile);
});
const getProfileDone = async (req, res) => {
    console.log(req.userId)
    try {
        const user = req.userId;
        const profile = await (0, profile_service_1.getProfile)(user);
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }
        return res.status(200).json({userProfileDone: profile.userProfileDone});
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.getProfileDone = getProfileDone;
