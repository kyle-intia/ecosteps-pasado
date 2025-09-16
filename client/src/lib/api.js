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

export const getDailyTrackingHistory = (limit = 30, offset = 0) =>
  API.get(`/daily-tracking?limit=${limit}&offset=${offset}`);

export const getTodaysTracking = () =>
  API.get(`/daily-tracking/today`);

export const getDailyTrackingStats = (days = 7) =>
  API.get(`/daily-tracking/stats?days=${days}`);

export const deleteDailyTracking = (entryId) =>
  API.delete(`/daily-tracking/${entryId}`);

// ========== PRE-ASSESSMENT ==========
export const submitPreAssessment = (assessmentData) =>
  API.post("/preassessment/submit", assessmentData);

export const getPreAssessmentHistory = () =>
  API.get(`/preassessment`);

export const getLatestPreAssessment = () =>
  API.get(`/preassessment/latest`);

// ========== DASHBOARD ==========

export const getDashboardSummary = () =>
  API.get("/dashboard/summary");

export const getDashboardTrends = (months = 6) =>
  API.get(`/dashboard/trends?months=${months}`);