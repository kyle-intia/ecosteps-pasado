import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const useAuthFlag = import.meta.env.VITE_USE_AUTH === 'true';
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      // prod: only force redirect when auth is enabled
      if (useAuthFlag) {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export const getUser = async () => {
  const response = await apiClient.get('/api/community/user/me');
  return response.data;
};