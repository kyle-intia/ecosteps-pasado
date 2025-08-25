import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Define the options type
interface ApiOptions extends AxiosRequestConfig {
  baseURL: string;
  withCredentials: boolean;
}

// Type for the error response structure
interface ApiError {
  status: number;
  message: string;
  [key: string]: any;
}

const options: ApiOptions = {
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
};

const API: AxiosInstance = axios.create(options);

API.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: any) => {
    const { status, data }: ApiError = error.response;
    return Promise.reject({ status, ...data });
  }
);

export default API;
