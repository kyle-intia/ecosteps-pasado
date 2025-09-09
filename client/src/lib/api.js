import API from "@/config/apiClient";

export const login = async (data) => {
  console.log("Login called with", data);
  return API.post("/auth/login", data);
};

export const logout = async () => API.get("/auth/logout");

export const register = async (data) => API.post("/auth/register", data);

export const verifyEmail = async (verificationCode) => API.get(`/auth/email/verify/${verificationCode}`);

export const sendPasswordResetEmail = async (email) => API.post("/auth/password/forgot", { email });

export const resetPassword = async ({ verificationCode, password }) => API.post("/auth/password/reset", { verificationCode, password });

export const getUser = async () => API.get("/user");

export const getSessions = async () => API.get("/sessions");

export const deleteSession = async (id) => API.delete(`/sessions/${id}`);


export const createProfile = async (data) => API.post("/profile/create", data);
export const getProfile = async (data) => API.get("/profile/", data);
export const updateProfile = async (data) => API.patch("/profile/update", data);