import API from "../config/apiClient";

// ========== AUTH ==========
export const login = (data) => API.post("/auth/login", data);
export const logout = () => API.post("/auth/logout");
export const register = (data) => API.post("/auth/register", data);
export const verifyEmail = (code) => API.get(`/auth/email/verify/${code}`);
export const sendPasswordResetEmail = (email) =>
  API.post("/auth/password/forgot", { email });
export const resetPassword = ({ verificationCode, password }) =>
  API.post("/auth/password/reset", { verificationCode, password });

// ========== USER ==========
export const getUser = () => API.get("/user");
export const getSessions = () => API.get("/sessions");
export const deleteSession = (id) => API.delete(`/sessions/${id}`);

// ========== PROFILE ==========
export const createProfile = (data) => API.post("/profile/create", data);
export const getProfile = () => API.get("/profile");
export const updateProfile = (data) => API.patch("/profile/update", data);

// ========== DAILY TRACKING ==========
export const submitDailyTracking = (trackingData) =>
  API.post("/daily-tracking/submit", trackingData);

export const checkResubmission = () =>
  API.post("/daily-tracking/check-resubmission");

export const getDailyTrackingHistory = (limit = 30, offset = 0) =>
  API.get(`/daily-tracking?limit=${limit}&offset=${offset}`);

export const getTodaysTracking = () =>
  API.get(`/daily-tracking/today`);

export const getDailyTrackingStats = (days = 7) =>
  API.get(`/daily-tracking/stats?days=${days}`);

export const deleteDailyTracking = (entryId) =>
  API.delete(`/daily-tracking/${entryId}`);

// ========== CHALLENGES ==========
export const getTodaysChallenges = () =>
  API.get("/challenges/today");

export const completeChallenge = (challengeId) =>
  API.post("/challenges/complete", { challengeId });

export const getChallengeHistory = (limit = 30, offset = 0) =>
  API.get(`/challenges/history?limit=${limit}&offset=${offset}`);

export const getChallengeStats = (days = 7) =>
  API.get(`/challenges/stats?days=${days}`);

export const getChallengeLibrary = () =>
  API.get("/challenges/library");

// ========== PRE-ASSESSMENT ==========
export const submitPreAssessment = (assessmentData) =>
  API.post("/preassessment/submit", assessmentData);

export const getPreAssessmentHistory = () =>
  API.get(`/preassessment`);

export const getLatestPreAssessment = () =>
  API.get(`/preassessment/latest`);

// ========== ROUTES ESSENTIALS ==========
export const getUserRole = () => API.get("/user/role/status");
export const assessmentDone = () => API.get("api/preassessment/user/status");
export const userProfileDone = () => API.get("/profile/user/status");

// ========== ADMIN ==========
export const listUsers = (params) => API.get("/api/admin/users", { params });
export const searchUsers = (id) => API.get(`/api/admin/users/${id}`);
export const createUser = (data) => API.post("/api/admin/users", data);
export const updateUser = (id, data) => API.put(`/api/admin/users/${id}`, data);
export const deleteUser = (id) => API.delete(`/api/admin/users/${id}`);
export const updateStatus = (id, status) => API.patch(`/api/admin/users/${id}/status`, { status });
export const changeRole = (id, role) => API.patch(`/api/admin/users/${id}/role`, { role });

// ========== ADMIN DASHBOARD ==========
export const getUserGrowthStats = () => API.get("/api/admin/dashboard/user-growth");
export const getActivityGrowthStats = () => API.get("/api/admin/dashboard/activity-growth");
export const getAvgFootprintGrowthStats = () => API.get("/api/admin/dashboard/avg-footprint-growth");

export const listDailyTrackings = (params) => API.get("/api/admin/dashboard/dailytrackings", {params})
export const getDailyTrackingByUserId = (id) => API.get(`/api/admin/dashboard/dailytrackings/user/${id}`);
export const updateDailyTracking = (id, data) => API.patch(`/api/admin/dashboard/dailytrackings/${id}`, data);
export const deleteDailyTrackingAdmin = (id) => API.delete(`/api/admin/dashboard/dailytrackings/${id}`);

//========== ADMIN DASHBOARD STATS ==========
export const getDailyFootprintByCategory = (date) => API.get(`/api/admin/dashboard/emission/daily/${date}`);
export const getMonthlyFootprintByCategory = (month) => API.get(`/api/admin/dashboard/emission/monthly/${month}`);
export const getYearlyFootprintByCategory = (year) => API.get(`/api/admin/dashboard/emission/yearly/${year}`);

//========== ADMIN SETTINGS EMISSION FACTORS ==========

export const createEmissionFactor = (data) => API.post("/api/admin/emissionfactor/create", data);
export const getAllEmissionFactors = () => API.get("/api/admin/emissionfactor/");
export const getEmissionFactorById = (id) => API.get(`/api/admin/emissionfactor/${id}`);
export const updateEmissionFactor = (id, data) => API.patch(`/api/admin/emissionfactor/${id}`, data);
export const deleteEmissionFactor = (id) => API.delete(`/api/admin/emissionfactor/${id}`);

//======== NOTIFICATIONS ==============

export const getAllNotification = () => API.get("/api/notifications/admin/all");
export const markAsReadNotification = (id) => API.put(`/api/notifications/${id}/read`);

export const getMaintenanceMode = () => API.get("/api/admin/maintenance");
export const toggleMaintenance = (data) => API.post(`/api/admin/maintenance`, data);

export const getPushNotificationMode = () => API.get("/api/notifications/push_notification");
export const togglePushNotification = (data) => API.post(`/api/notifications/push_notification`, data);


export const getUserSettings = (userId) => API.get(`/api/user-settings/notification/${userId}`);
export const updateUserSettings = (userId, data) => API.put(`/api/user-settings/notification/${userId}`, data);

//======== PUSH NOTIFICATIONS ==============
export const pushSubscribe = (userId, subscription) => API.post("/api/push/subscribe", { userId, subscription });


// ========== DASHBOARD ==========
export const getDashboardSummary = () =>
  API.get("/dashboard/summary");

export const getDashboardTrends = (months = 6) =>
  API.get(`/dashboard/trends?months=${months}`);

// ========== RECOMMENDATIONS ==========
export const regenerateRecommendations = () =>
  API.post("/dashboard/recommendations/regenerate");

// ========== ACHIEVEMENTS ==========
export const getUserAchievements = () => API.get("/achievements");

export const equipAchievement = (achievementId) =>
  API.post("/achievements/equip", { achievementId });

export const unequipAchievement = (achievementId) =>
  API.post("/achievements/unequip", { achievementId });

export const getAchievementNotifications = (limit = 20, unreadOnly = false) =>
  API.get(`/achievements/notifications?limit=${limit}&unreadOnly=${unreadOnly}`);

export const markNotificationAsRead = (notificationId) =>
  API.patch(`/achievements/notifications/${notificationId}/read`);

export const checkAchievements = (triggerEvent, context = {}) =>
  API.post("/achievements/check", { triggerEvent, context });
