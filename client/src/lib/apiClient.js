// File: client/src/lib/apiClient.js
// API client utility for handling requests to the backend
// This provides a centralized way to manage API calls

class ApiClient {
  constructor() {
    // Vite uses import.meta.env instead of process.env
    let viteUrl;
    try {
      // Accessing import.meta.env only in ESM/browser context
      // This try/catch avoids ReferenceErrors in non-browser tooling
      // eslint-disable-next-line no-undef
      viteUrl = 'http://localhost:4004/api';
    } catch (_) {}
    // Avoid using process.env in the browser; default to localhost if Vite var missing
    this.baseURL = viteUrl || 'http://localhost:4004/api';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: "include",
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Daily tracking methods
  async submitDailyTracking(trackingData) {
    return this.request('/daily-tracking/submit', {
      method: 'POST',
      body: JSON.stringify(trackingData),
    });
  }

  async getDailyTrackingHistory(userId, limit = 30, offset = 0) {
    return this.request(`/daily-tracking/${userId}?limit=${limit}&offset=${offset}`);
  }

  async getTodaysTracking(userId) {
    return this.request(`/daily-tracking/${userId}/today`);
  }

  async getDailyTrackingStats(userId, days = 7) {
    return this.request(`/daily-tracking/${userId}/stats?days=${days}`);
  }

  async deleteDailyTracking(userId, entryId) {
    return this.request(`/daily-tracking/${userId}/${entryId}`, {
      method: 'DELETE',
    });
  }

  // Pre-assessment methods (existing)
  async submitPreAssessment(assessmentData) {
    return this.request('/preassessment/submit', {
      method: 'POST',
      body: JSON.stringify(assessmentData),
    });
  }

  async getPreAssessmentHistory(userId) {
    return this.request(`/preassessment/${userId}`);
  }

  async getLatestPreAssessment(userId) {
    return this.request(`/preassessment/${userId}/latest`);
  }
}

export default new ApiClient();