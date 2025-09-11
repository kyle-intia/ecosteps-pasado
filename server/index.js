"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("./config/db"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const http_1 = require("./constants/http");
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const user_route_1 = __importDefault(require("./routes/user.route"));
const env_1 = require("./constants/env");
const authenticate_1 = __importDefault(require("./middleware/authenticate"));
const session_route_1 = __importDefault(require("./routes/session.route"));
const profile_route_1 = __importDefault(require("./routes/profile.route"));
// Bring in feature routers that were previously mounted in server.js
const preAssessmentRoutes = require("./routes/preAssessmentRoutes");
const dailyTrackingRoutes = require("./routes/dailyTrackingRoutes");
const app = (0, express_1.default)();
const path_1 = __importDefault(require("path"));
app.use(express_1.default.static(path_1.default.join(__dirname, "../../client/public")));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: process.env.APP_ORIGIN,
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
app.get("/", (_, res) => {
    return res.status(http_1.OK).json({
        status: "healthy",
    });
});
app.use("/auth", auth_route_1.default);
app.use("/user", authenticate_1.default, user_route_1.default);
app.use("/sessions", authenticate_1.default, session_route_1.default);
app.use("/profile", authenticate_1.default, profile_route_1.default);
// Mount Daily Tracking and Pre-Assessment routes under both legacy and /api prefixes
app.use("/preassessment", authenticate_1.default, preAssessmentRoutes);
app.use("/daily-tracking", authenticate_1.default, dailyTrackingRoutes);
app.use("/api/preassessment", authenticate_1.default, preAssessmentRoutes);
app.use("/api/daily-tracking", authenticate_1.default, dailyTrackingRoutes);
app.use(errorHandler_1.default);
const startServer = async () => {
    await (0, db_1.default)();
    app.listen(env_1.PORT, () => {
        console.log(`🚀 Server is running on port ${env_1.PORT} in ${env_1.NODE_ENV} mode`);
    });
};
startServer().catch((err) => {
    console.error("❌ Failed to start server:", err);
});
