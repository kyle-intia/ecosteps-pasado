// server/index.js
// Updated server index with AI recommendation routes integration

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
const http = require('http');
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const user_route_1 = __importDefault(require("./routes/user.route"));
const env_1 = require("./constants/env");
const authenticate_1 = __importDefault(require("./middleware/authenticate"));
const session_route_1 = __importDefault(require("./routes/session.route"));
const profile_route_1 = __importDefault(require("./routes/profile.route"));

// Import existing feature routers
const preAssessmentRoutes = require("./routes/preAssessmentRoutes");
const dailyTrackingRoutes = require("./routes/dailyTrackingRoutes");

const adminRoutes = require('./routes/adminRoute');
const emissionFactorRoute = require('./routes/emissionFactorRoute');
const isAdmin = require("./middleware/isAdmin");
const notificationRoutes = require('./routes/notificationRoute');
const userSettingsRoute = require('./routes/userSettingsRoute');
const pushNotificationRoutes = require("./routes/pushNotificationRoute")
const NotificationService = require('./services/notificationService');
const badgeAchievementRoutes = require("./routes/badgeAchievementRoute");
const ecoChallengeRoutes = require("./routes/ecoChallengeRoute")
const challengeRoutes = require("./routes/challengeRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const communityRoutes = require("./routes/communityRoute");
const leaderboardRoutes = require("./routes/leaderboardsRoutes");

// Import new AI recommendation routes
const footprintRoutes = require("./routes/footprintRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");

// Import achievement routes
const achievementRoutes = require("./routes/achievementRoutes");

const app = (0, express_1.default)();
const path_1 = __importDefault(require("path"));
const socketIo = require('socket.io');
const cron = require('node-cron');
const sendDailyTrackingReminders = require('./controllers/dailyReminder');

const seedAchievements = require('./utils/seedAchievement');

app.use(express_1.default.static(path_1.default.join(__dirname, "../../server/public")));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());

app.get("/", (_, res) => {
    return res.status(http_1.OK).json({
        status: "healthy",
    });
});

const server = http.createServer(app);
const io = socketIo(server);

NotificationService.setSocketIoInstance(io);

// Authentication routes
app.use("/auth", auth_route_1.default);

// Protected routes
app.use("/user", authenticate_1.default, user_route_1.default);
app.use("/sessions", authenticate_1.default, session_route_1.default);
app.use("/profile", authenticate_1.default, profile_route_1.default);

// Existing feature routes - both legacy and /api prefixes for compatibility
app.use("/preassessment", authenticate_1.default, preAssessmentRoutes);
app.use("/daily-tracking", authenticate_1.default, dailyTrackingRoutes);
app.use("/api/preassessment", authenticate_1.default, preAssessmentRoutes);
app.use("/api/daily-tracking", authenticate_1.default, dailyTrackingRoutes);

// ADMIN
app.use("/api/admin", authenticate_1.default, isAdmin, adminRoutes);
app.use('/api/admin/emissionfactor', authenticate_1.default, isAdmin, emissionFactorRoute);
app.use('/api/notifications', notificationRoutes);
app.use('/api/user-settings', userSettingsRoute);
app.use('/api/push', pushNotificationRoutes);
app.use("/api/admin/achievements", badgeAchievementRoutes);
app.use('/api/admin/eco-challenges', ecoChallengeRoutes);

// Challenge routes
app.use("/challenges", authenticate_1.default, challengeRoutes);
app.use("/api/challenges", authenticate_1.default, challengeRoutes);

// Dashboard routes
app.use("/dashboard", authenticate_1.default, dashboardRoutes);
app.use("/api/dashboard", authenticate_1.default, dashboardRoutes);

// NEW: AI Recommendation Feature Routes
app.use("/footprint", authenticate_1.default, footprintRoutes);
app.use("/api/footprint", authenticate_1.default, footprintRoutes);
app.use("/recommendations", authenticate_1.default, recommendationRoutes);
app.use("/api/recommendations", authenticate_1.default, recommendationRoutes);


// Achievement routes 
app.use("/achievements", authenticate_1.default, achievementRoutes);
app.use("/api/achievements", authenticate_1.default, achievementRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Error handling middleware
app.use(errorHandler_1.default);

cron.schedule('10 0 * * *', () => {
  sendDailyTrackingReminders()
    .then(() => console.log('Daily tracking reminders sent at 8:00 AM.'))
    .catch((err) => console.error('Failed to send daily reminders:', err));
}, {
  timezone: 'Asia/Manila' 
});
 
const now = new Date();
if (now.getHours() >= 20) {
  sendDailyTrackingReminders()
    .then(() => console.log('Reminder sent on server start (after 8 PM).'))
    .catch((err) => console.error('Failed to send reminder on server start:', err));
}

const startServer = async () => {
  try {
    await (0, db_1.default)();  // DB connection
    
    await seedAchievements();  

    app.listen(env_1.PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on port ${env_1.PORT} in ${env_1.NODE_ENV} mode`);
      console.log(`📊 Challenge API available at /api/challenges`);
      console.log(`🤖 AI Recommendations API available at /api/recommendations`);
      console.log(`📈 Footprint API available at /api/footprint`);
    });
  } catch (error) {
    console.error("Error during server startup:", error);
  }
};


startServer().catch((err) => {
    console.error("❌ Failed to start server:", err);
});