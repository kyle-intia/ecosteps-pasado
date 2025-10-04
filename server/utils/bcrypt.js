"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareValue = exports.hashValue = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const hashValue = async (val, saltRounds) => bcrypt_1.default.hash(val, saltRounds || 10);
exports.hashValue = hashValue;
const compareValue = async (val, hashedValue) => bcrypt_1.default.compare(val, hashedValue).catch(() => false);
exports.compareValue = compareValue;
