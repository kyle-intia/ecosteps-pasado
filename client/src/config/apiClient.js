import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // 👈 will switch automatically
  withCredentials: true, // optional, if your backend needs cookies/sessions
});