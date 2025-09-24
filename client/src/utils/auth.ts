// Authentication utilities for JWT handling
// To use this, install jwt-decode: npm install jwt-decode
// import { jwtDecode } from 'jwt-decode';

interface JWTPayload {
  userId?: string;
  sub?: string;
  id?: string;
  email?: string;
  exp?: number;
  iat?: number;
}

export const getCurrentUserId = (navigate?: (path: string) => void): string => {
  // Check if authentication is enabled
  const useAuth = import.meta.env.VITE_USE_AUTH === 'true';
  
  if (!useAuth) {
    // Development: use default user ID from env or fallback
    return import.meta.env.VITE_DEFAULT_USER_ID || "6744176ad35a5b47b4fb21fe";
  }
  
  // Production: JWT Authentication
  const token = localStorage.getItem('authToken');
  
  if (token) {
    try {
      // Option 1: Using jwt-decode library (recommended)
      // const decoded: JWTPayload = jwtDecode(token);
      
      // Option 2: Manual JWT decode (basic implementation)
      const payload: JWTPayload = JSON.parse(atob(token.split('.')[1]));
      
      // Check if token is expired
      if (payload.exp && payload.exp < Date.now() / 1000) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        console.warn("Token expired");
        if (navigate) navigate("/");
        return "anonymous";
      }
      
      // Return user ID from JWT payload
      return payload.userId || payload.sub || payload.id || "anonymous";
      
    } catch (error) {
      console.error("Invalid token:", error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      if (navigate) navigate("/");
      return "anonymous";
    }
  }
  
  // Fallback to localStorage values (for transition period)
  const storedUserId = localStorage.getItem("userId");
  const userEmail = localStorage.getItem("userEmail");
  
  if (storedUserId) return storedUserId;
  if (userEmail) return userEmail;
  
  // If no user found, redirect to login
  console.warn("No authenticated user found");
  if (navigate) navigate("/");
  return "anonymous";
};

export const getCurrentUserInfo = () => {
  const useAuth = import.meta.env.VITE_USE_AUTH === 'true';
  
  if (!useAuth) {
    // Development mode
    const userName = localStorage.getItem("userName") || "Anonymous User";
    return {
      id: getCurrentUserId(),
      name: userName,
      username: "@" + userName.toLowerCase().replace(/\s+/g, "_"),
      avatar: "/placeholder.svg"
    };
  }
  
  // Production: Get from JWT token or localStorage
  const token = localStorage.getItem('authToken');
  
  if (token) {
    try {
      const payload: JWTPayload = JSON.parse(atob(token.split('.')[1]));
      
      // Get user info from token or localStorage
      const userName = localStorage.getItem("userName") || payload.email?.split('@')[0] || "Anonymous User";
      
      return {
        id: getCurrentUserId(),
        name: userName,
        username: "@" + userName.toLowerCase().replace(/\s+/g, "_"),
        avatar: localStorage.getItem("userAvatar") || "/placeholder.svg"
      };
    } catch (error) {
      console.error("Error decoding token for user info:", error);
    }
  }
  
  // Fallback
  const userName = localStorage.getItem("userName") || "Anonymous User";
  return {
    id: getCurrentUserId(),
    name: userName,
    username: "@" + userName.toLowerCase().replace(/\s+/g, "_"),
    avatar: "/placeholder.svg"
  };
};

export const isAuthenticated = (): boolean => {
  const useAuth = import.meta.env.VITE_USE_AUTH === 'true';
  
  if (!useAuth) {
    // Development mode: always authenticated
    return true;
  }
  
  const token = localStorage.getItem('authToken');
  
  if (!token) return false;
  
  try {
    const payload: JWTPayload = JSON.parse(atob(token.split('.')[1]));
    
    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      localStorage.removeItem('authToken');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Invalid token:", error);
    localStorage.removeItem('authToken');
    return false;
  }
};

export const logout = (navigate: (path: string) => void) => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  localStorage.removeItem('userAvatar');
  localStorage.removeItem('isLoggedIn');
  navigate("/");
};