import API from "../config/apiClient";

// ========== AUTH ==========
export const login = (data) => API.post("/auth/login", data);
export const logout = () => API.get("/auth/logout");
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

export const getDailyTrackingHistory = (userId, limit = 30, offset = 0) =>
  API.get(`/daily-tracking/${userId}?limit=${limit}&offset=${offset}`);

export const getTodaysTracking = (userId) =>
  API.get(`/daily-tracking/${userId}/today`);

export const getDailyTrackingStats = (userId, days = 7) =>
  API.get(`/daily-tracking/${userId}/stats?days=${days}`);

export const deleteDailyTracking = (userId, entryId) =>
  API.delete(`/daily-tracking/${userId}/${entryId}`);

// ========== PRE-ASSESSMENT ==========
export const submitPreAssessment = (assessmentData) =>
  API.post("/preassessment/submit", assessmentData);

export const getPreAssessmentHistory = (userId) =>
  API.get(`/preassessment/${userId}`);

export const getLatestPreAssessment = (userId) =>
  API.get(`/preassessment/${userId}/latest`);
