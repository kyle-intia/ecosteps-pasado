import API from "../config/apiClient";

// ========== AUTH ==========
export const login = (data) => API.post("/auth/login", data);
export const logout = () => API.post("/auth/logout");
export const register = (data) => API.post("/auth/register", data);
export const verifyEmail = (code) => API.get(`auth/email/verify/${code}`);
export const sendPasswordResetEmail = (email) =>
  API.post("/auth/password/forgot", { email });
export const resetPassword = ({ verificationCode, password }) =>
  API.post("/auth/password/reset", { verificationCode, password });

// ========== USER ==========
export const getUser = () => API.get("/user");
export const getSessions = () => API.get("/sessions");
export const deleteSession = (id) => API.delete(`/sessions/${id}`);
export const contactSupportEmail = (data) => API.post("/contact-support", data);

// ========== PROFILE ==========
export const createProfile = (data) => API.post("/profile/create", data);
export const getProfile = () => API.get("/profile");
export const updateProfile = (data) => API.patch("/profile/update", data);

// ========== DAILY TRACKING ==========
export const submitDailyTracking = (trackingData) =>
  API.post("/api/footprint/submit", trackingData);

export const checkResubmission = () =>
  API.post("/api/daily-tracking/check-resubmission");

export const getDailyTrackingHistory = (limit = 30, offset = 0) =>
  API.get(`/api/daily-tracking?limit=${limit}&offset=${offset}`);

export const getTodaysTracking = () => API.get(`/api/footprint/today`);

export const getDailyTrackingStats = (days = 7) =>
  API.get(`/api/daily-tracking/stats?days=${days}`);

export const deleteDailyTracking = (entryId) =>
  API.delete(`/api/footprint/${entryId}`);

export const getRecipes = (params) => API.get("/api/recipes/food", { params });

export const getTodayEntries = () => API.get("/activitylogs/fetch/today");

export const addActivityEntry = (data) =>
  API.post("/activitylogs/submit", data);

export const updateActivityEntry = (id, data) =>
  API.patch(`/activitylogs/patch/${id}`, data);

export const deleteActivityEntry = (id) =>
  API.post(`/activitylogs/delete/${id}`);

// ========== CHALLENGES ==========
export const getTodaysChallenges = () => API.get("/challenges/today");

export const completeChallenge = (challengeId) =>
  API.post("/challenges/complete", { challengeId });

export const getChallengeHistory = (limit = 30, offset = 0) =>
  API.get(`/challenges/history?limit=${limit}&offset=${offset}`);

export const getChallengeStats = (days = 7) =>
  API.get(`/challenges/stats?days=${days}`);

export const getChallengeLibrary = () => API.get("/challenges/library");

// ========== PRE-ASSESSMENT ==========
export const submitPreAssessment = (assessmentData) =>
  API.post("/preassessment/submit", assessmentData);

export const getPreAssessmentHistory = () => API.get(`/preassessment`);

export const getLatestPreAssessment = () => API.get(`/preassessment/latest`);

export const getAssessmentResults = (userId) =>
  API.get(`/api/assessments/result/${userId}`);

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
export const updateStatus = (id, status) =>
  API.patch(`/api/admin/users/${id}/status`, { status });
export const changeRole = (id, role) =>
  API.patch(`/api/admin/users/${id}/role`, { role });

// ========== ADMIN DASHBOARD ==========
export const getUserGrowthStats = () =>
  API.get("/api/admin/dashboard/user-growth");
export const getActivityGrowthStats = () =>
  API.get("/api/admin/dashboard/activity-growth");
export const getAvgFootprintGrowthStats = () =>
  API.get("/api/admin/dashboard/avg-footprint-growth");

export const listDailyTrackings = (params) =>
  API.get("/api/admin/dashboard/dailytrackings", { params });
export const getDailyTrackingByUserId = (id) =>
  API.get(`/api/admin/dashboard/dailytrackings/user/${id}`);
export const updateDailyTracking = (id, data) =>
  API.patch(`/api/admin/dashboard/dailytrackings/${id}`, data);
export const deleteDailyTrackingAdmin = (id) =>
  API.delete(`/api/admin/dashboard/dailytrackings/${id}`);

//========== ADMIN DASHBOARD STATS ==========
export const getDailyFootprintByCategory = (date) =>
  API.get(`/api/admin/dashboard/emission/daily/${date}`);
export const getMonthlyFootprintByCategory = (month) =>
  API.get(`/api/admin/dashboard/emission/monthly/${month}`);
export const getYearlyFootprintByCategory = (year) =>
  API.get(`/api/admin/dashboard/emission/yearly/${year}`);

export const getOverallAssessmentResults = () =>
  API.get("/api/admin/assessments/overall");

//========== ADMIN SETTINGS EMISSION FACTORS ==========

export const createEmissionFactor = (data) =>
  API.post("/api/admin/emissionfactor/create", data);
export const getAllEmissionFactors = () =>
  API.get("/api/admin/emissionfactor/");
export const getEmissionFactorById = (id) =>
  API.get(`/api/admin/emissionfactor/${id}`);
export const updateEmissionFactor = (id, data) =>
  API.patch(`/api/admin/emissionfactor/${id}`, data);
export const deleteEmissionFactor = (id) =>
  API.delete(`/api/admin/emissionfactor/${id}`);

export const createAchievements = (data) =>
  API.post("/api/admin/achievements/create", data);
export const getAchievements = () => API.get("/api/admin/achievements/");
export const getAchievementsId = (id) =>
  API.get(`/api/admin/achievements/${id}`);
export const updateAchievements = (id, data) =>
  API.patch(`/api/admin/achievements/${id}`, data);
export const deleteAchievements = (id) =>
  API.delete(`/api/admin/achievements/${id}`);

export const createChallenge = (data) =>
  API.post("/api/admin/eco-challenges/create", data);
export const getChallenge = () => API.get("/api/admin/eco-challenges/");
export const getChallengeId = (id) =>
  API.get(`/api/admin/eco-challenges/${id}`);
export const updateChallenge = (id, data) =>
  API.patch(`/api/admin/eco-challenges/${id}`, data);
export const deleteChallenge = (id) =>
  API.delete(`/api/admin/eco-challenges/${id}`);

export const createCertificate = (data) =>
  API.post("/api/admin/certificates/create", data);
export const getCertificates = () => API.get("/api/admin/certificates/");
export const getCertificateById = (id) =>
  API.get(`/api/admin/certificates/${id}`);
export const updateCertificate = (id, data) =>
  API.patch(`/api/admin/certificates/${id}`, data);
export const deleteCertificate = (id) =>
  API.delete(`/api/admin/certificates/${id}`);

export const createReward = (data) =>
  API.post("/api/admin/rewards/create", data);
export const getRewards = () => API.get("/api/admin/rewards/");
export const getRewardsById = (id) => API.get(`/api/admin/rewards/${id}`);
export const updateReward = (id, data) =>
  API.patch(`/api/admin/rewards/${id}`, data);
export const deleteReward = (id) => API.delete(`/api/admin/rewards/${id}`);

export const adminEmail = (data) => API.post("/api/send-email", data);
//======== NOTIFICATIONS ==============

export const getUserSettingsNotificationEnabled = () =>
  API.get("/api/user-settings/notification-enabled");

export const getAllNotification = () => API.get("/api/notifications/admin/all");
export const markAsReadNotification = (id) =>
  API.put(`/api/notifications/${id}/read`);

export const getMaintenanceMode = () => API.get("/api/admin/maintenance");
export const toggleMaintenance = (data) =>
  API.post(`/api/admin/maintenance`, data);

export const getPushNotificationMode = () =>
  API.get("/api/notifications/push_notification");
export const togglePushNotification = (data) =>
  API.post(`/api/notifications/push_notification`, data);

export const getUserSettings = (userId) =>
  API.get(`/api/user-settings/notification/${userId}`);
export const updateUserSettings = (userId, data) =>
  API.put(`/api/user-settings/notification/${userId}`, data);

//======== Footprint Live Tracking

export const submitLivetracking = (trackingData) =>
  API.post("/api/activities", trackingData);

export const updateLivetracking = (id, data) =>
  API.patch(`/api/activities/${id}`, data);

//======== PUSH NOTIFICATIONS ==============
export const pushSubscribe = (userId, subscription) =>
  API.post("/api/push/subscribe", { userId, subscription });

// ========== DASHBOARD ==========
export const getDashboardSummary = () => API.get("/dashboard/summary");

export const getDashboardTrends = (months = 6) =>
  API.get(`/dashboard/trends?months=${months}`);

// ========== RECOMMENDATIONS ==========
export const regenerateRecommendations = () =>
  API.post("/dashboard/recommendations/regenerate");

export const getRecommendations = (footprintId) =>
  API.post("/api/recommendations", { footprintId });

export const clearDailyData = () => API.post("/api/footprint/reset-daily");

// ========== ACHIEVEMENTS ==========
export const getUserAchievements = () => API.get("/achievements");

export const equipAchievement = (achievementId) =>
  API.post("/achievements/equip", { achievementId });

export const unequipAchievement = (achievementId) =>
  API.post("/achievements/unequip", { achievementId });

export const getAchievementNotifications = (limit = 20, unreadOnly = false) =>
  API.get(
    `/achievements/notifications?limit=${limit}&unreadOnly=${unreadOnly}`,
  );

export const markNotificationAsRead = (notificationId) =>
  API.patch(`/achievements/notifications/${notificationId}/read`);

export const checkAchievements = (triggerEvent, context = {}) =>
  API.post("/achievements/check", { triggerEvent, context });

export const getUserCertificates = () => API.get("/api/user/certificates");
export const getUserRewards = () => API.get("/api/user/rewards");
export const rewardClaim = (rewardId) =>
  API.post(`/api/user/rewards/${rewardId}/claim`);

//============= COMMUNITY =================

export const getCommunityPosts = (page = 1, limit = 10, options) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (options && options.sort && options.sort !== "recent") {
    params.append("sort", options.sort);
  }

  if (options && options.search && options.search.trim()) {
    params.append("search", options.search.trim());
  }

  return API.get(`/api/community/posts?${params.toString()}`);
};

export const getCommunityPostById = (postId) =>
  API.get(`/api/community/posts/${postId}`);

export const getUserPostsAndReposts = (userId, page = 1, limit = 10) =>
  API.get(
    `/api/community/user/posts?userId=${userId}&page=${page}&limit=${limit}`,
  );

export const getUserCommunityPosts = (page = 1, limit = 10) =>
  API.get(`/api/community/user/posts?page=${page}&limit=${limit}`);

export const getFollowingFeed = (page = 1, limit = 10) =>
  API.get(`/api/community/posts/feed/following?page=${page}&limit=${limit}`);

// FOLLOWING LIST
export const getFollowingList = (page = 1, limit = 20) =>
  API.get(`/api/community/following?page=${page}&limit=${limit}`);

export const getFollowers = (userId, page = 1, limit = 20) =>
  API.get(`/api/community/followers/${userId}?page=${page}&limit=${limit}`);

// CREATE POST
export const createCommunityPost = (formData) =>
  API.post(`/api/community/posts`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// LIKE / REPOST / SHARE
export const likePost = (postId) =>
  API.post(`/api/community/posts/${postId}/like`);

export const repostPost = (postId) =>
  API.post(`/api/community/posts/${postId}/repost`);

export const sharePost = (postId) =>
  API.post(`/api/community/posts/${postId}/share`);

// COMMENTS
export const commentOnPost = (postId, content) =>
  API.post(`/api/community/posts/${postId}/comment`, { content });

export const deleteComment = (postId, commentId) =>
  API.delete(`/api/community/posts/${postId}/comment/${commentId}`);

// DELETE POST
export const deletePost = (postId) =>
  API.delete(`/api/community/posts/${postId}`);

// FOLLOW / UNFOLLOW
export const followUser = (userId) =>
  API.post(`/api/community/user/${userId}/follow`);

export const unfollowUser = (userId) =>
  API.post(`/api/community/user/${userId}/unfollow`);

export const editPost = (postId, content, imageFile) => {
  const formData = new FormData();
  formData.append("content", content);
  if (imageFile) {
    formData.append("image", imageFile);
  }

  return API.put(`api/community/posts/${postId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

//============= LEADERBOARDS =====================

export const getLeaderboard = () => API.get("api/leaderboard");

export const getUserLeaderboard = () => API.get("api/leaderboard/user");

export const activityTrack = (data) => API.post("/api/activities", data);

export const getActivityTrack = (options = {}) =>
  API.get("/api/activities", options);
