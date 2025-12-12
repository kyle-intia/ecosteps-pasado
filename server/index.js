"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("dotenv").config();
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
const adminCertificateRoute = require('./routes/adminCertificateRoute');
const adminRewardRoute = require('./routes/adminRewardRoute');
const emailRoutes = require("./routes/email");
const supportEmailRoute = require("./routes/supportEmailRoute")
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
const activityRoutes = require("./routes/ActivityRoute");
const stravaRoutes = require("./routes/stravaRoutes");
const foodRoute = require("./routes/foodRoute");
// Import new AI recommendation routes
const footprintRoutes = require("./routes/footprintRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");

// Import achievement routes
const achievementRoutes = require("./routes/achievementRoutes");
const rewardRoute = require('./routes/rewardRoute');
const certificateRoute = require('./routes/certificateRoute');

const app = (0, express_1.default)();
const socketIo = require('socket.io');
const cron = require('node-cron');
const sendDailyTrackingReminders = require('./controllers/dailyReminder');

const seedAchievements = require('./utils/seedAchievement');

app.use((0, cors_1.default)({
    origin: env_1.APP_ORIGIN,
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());

app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));

app.get("/", (_, res) => {
    return res.status(http_1.OK).json({
        status: "healthy",
    });
});

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: env_1.APP_ORIGIN, // must match frontend
    methods: ["GET", "POST"],
    credentials: true // ⚡ THIS IS REQUIRED
  }
});

const activeUsers = new Set();

io.on("connection", (socket) => {
  socket.on("joinRoom", (userId) => {
    socket.join(userId);
    activeUsers.add(userId.toString());
  });

  socket.on("disconnect", () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        activeUsers.delete(room);
        break;
      }
    }
  });
});

// Pass both
NotificationService.setSocketIoInstance(io, activeUsers);

const activitylogRoutes = require("./routes/activity.route");
app.use("/activitylogs", activitylogRoutes);
// Authentication routes
app.use("/auth", auth_route_1.default);

// Protected routes
app.use("/user", authenticate_1.default, user_route_1.default);
app.use("/sessions", authenticate_1.default, session_route_1.default);
app.use("/profile", authenticate_1.default, profile_route_1.default);
app.use("/api/users", profile_route_1.default);
// Existing feature routes - both legacy and /api prefixes for compatibility
app.use("/preassessment", authenticate_1.default, preAssessmentRoutes);
app.use("/daily-tracking", authenticate_1.default, dailyTrackingRoutes);
app.use("/api/preassessment", authenticate_1.default, preAssessmentRoutes);
app.use("/api/daily-tracking", authenticate_1.default, dailyTrackingRoutes);
app.use("/api/food", foodRoute);
app.use("/api/activities", activityRoutes);
app.use("/api/strava", stravaRoutes);
app.use("/contact-support", supportEmailRoute )

// ADMIN
app.use("/api/admin", authenticate_1.default, isAdmin, adminRoutes);
app.use('/api/admin/certificates', authenticate_1.default, isAdmin, adminCertificateRoute);
app.use('/api/admin/rewards', authenticate_1.default, isAdmin, adminRewardRoute);
app.use('/api/admin/emissionfactor', authenticate_1.default, isAdmin, emissionFactorRoute);
app.use('/api/notifications', notificationRoutes);
app.use('/api/user-settings', userSettingsRoute);
app.use('/api/push', pushNotificationRoutes);
app.use("/api/admin/achievements", badgeAchievementRoutes);
app.use('/api/admin/eco-challenges', ecoChallengeRoutes);
app.use("/api/send-email", emailRoutes);

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

app.use("/api/certificates", certificateRoute);
app.use("/api/rewards", rewardRoute);

app.use("/api/admin/certificates", require("./routes/adminCertificateRoute"));
app.use("/api/admin/rewards", require("./routes/adminRewardRoute"));
app.use("/api/user", require("./routes/userCertificateRewardRoute"));

// Error handling middleware
app.use(errorHandler_1.default);

// Schedule to run at 9 AM and every 3 hours thereafter
cron.schedule('0 9/3 * * *', () => {
  sendDailyTrackingReminders()
    .then(() => console.log('Tracking reminder sent at scheduled time.'))
    .catch((err) => console.error('Failed to send tracking reminders:', err));
}, {
  timezone: 'Asia/Manila'
});

const now = new Date();
const hour = now.getHours();

if (hour >= 9) {
  sendDailyTrackingReminders()
    .then(() => console.log('Reminder sent on server start (aligned with 4-hour schedule).'))
    .catch((err) => console.error('Failed to send reminder on server start:', err));
}

const startServer = async () => {
  try {
    await (0, db_1.default)();  // DB connection
    
    await seedAchievements();  

    server.listen(env_1.PORT, '0.0.0.0', () => {
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