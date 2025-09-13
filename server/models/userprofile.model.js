"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const userProfileSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: true },
    birthday: { type: Date },
    profilePic: { type: String },
    address: { type: String },
    bio: { type: String },
    userProfileDone: {type: Boolean, default: false}
}, {
    timestamps: true,
});
const UserProfileModel = mongoose_1.default.model("users_profile", userProfileSchema);
exports.default = UserProfileModel;