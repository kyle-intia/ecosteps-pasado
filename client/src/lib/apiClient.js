class ApiClient {
  constructor() {
    let viteUrl;
    try {
      viteUrl = `$${import.meta.env.VITE_API_URL.replace(/\/+$/, "")}/api`;
    } catch (_) {}
    this.baseURL =
      viteUrl || `${import.meta.env.VITE_API_URL.replace(/\/+$/, "")}/api`;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        "Content-Type": "application/json",
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

  async submitDailyTracking(trackingData) {
    return this.request("/daily-tracking/submit", {
      method: "POST",
      body: JSON.stringify(trackingData),
    });
  }

  async getDailyTrackingHistory(limit = 30, offset = 0) {
    return this.request(`/daily-tracking?limit=${limit}&offset=${offset}`);
  }

  async getTodaysTracking() {
    return this.request(`/daily-tracking/today`);
  }

  async getDailyTrackingStats(days = 7) {
    return this.request(`/daily-tracking/stats?days=${days}`);
  }

  async deleteDailyTracking(entryId) {
    return this.request(`/daily-tracking/${entryId}`, {
      method: "DELETE",
    });
  }

  async submitPreAssessment(assessmentData) {
    return this.request("/preassessment/submit", {
      method: "POST",
      body: JSON.stringify(assessmentData),
    });
  }

  async getPreAssessmentHistory() {
    return this.request(`/preassessment`);
  }

  async getLatestPreAssessment() {
    return this.request(`/preassessment/latest`);
  }
}

export default new ApiClient();
