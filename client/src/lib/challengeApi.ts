const API_BASE = "/api/challenges";

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: "transport" | "home" | "food";
  savingsValue: number | "calculated";
  completed: boolean;
  completedAt?: string;
}

export interface ChallengeData {
  date: string;
  challenges: Challenge[];
  completedCount: number;
  allCompleted: boolean;
  isRecalculated: boolean;
}

export interface RecalculationResult {
  recalculated: boolean;
  originalFootprint?: {
    transport: number;
    homeEnergy: number;
    food: number;
    total: number;
  };
  newFootprint?: {
    transport: number;
    homeEnergy: number;
    food: number;
    total: number;
  };
  savings?: number;
  appliedChallenges?: number;
}

export interface ChallengeCompletionResult {
  challengeId: string;
  completed: boolean;
  completedCount: number;
  allCompleted: boolean;
  recalculation: RecalculationResult;
  message: string;
}

export interface ChallengeStats {
  period: string;
  totalChallenges: number;
  completedChallenges: number;
  completionRate: number;
  perfectDays: number;
  activeDays: number;
}

export interface ChallengeHistoryEntry {
  id: string;
  date: string;
  challenges: Array<{
    id: string;
    title: string;
    category: string;
    completed: boolean;
    completedAt?: string;
  }>;
  completedCount: number;
  allCompleted: boolean;
  isRecalculated: boolean;
  createdAt: string;
}

export const getTodaysChallenges = async (): Promise<ChallengeData> => {
  const response = await fetch(`${API_BASE}/today`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch today's challenges: ${response.statusText}`,
    );
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch challenges");
  }

  return result.data;
};

export const completeChallenge = async (
  challengeId: string,
): Promise<ChallengeCompletionResult> => {
  const response = await fetch(`${API_BASE}/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ challengeId }),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Challenge not found");
    }
    if (response.status === 400) {
      const error = await response.json();
      throw new Error(error.error || "Challenge already completed");
    }
    throw new Error(`Failed to complete challenge: ${response.statusText}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to complete challenge");
  }

  return result.data;
};

export const getChallengeHistory = async (
  limit = 30,
  offset = 0,
): Promise<{
  count: number;
  history: ChallengeHistoryEntry[];
}> => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await fetch(`${API_BASE}/history?${params}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch challenge history: ${response.statusText}`,
    );
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch challenge history");
  }

  return result.data;
};

export const getChallengeStats = async (days = 7): Promise<ChallengeStats> => {
  const params = new URLSearchParams({
    days: days.toString(),
  });

  const response = await fetch(`${API_BASE}/stats?${params}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch challenge stats: ${response.statusText}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch challenge stats");
  }

  return result.data;
};

export const getChallengeLibrary = async () => {
  const response = await fetch(`${API_BASE}/library`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch challenge library: ${response.statusText}`,
    );
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch challenge library");
  }

  return result.data;
};

export const challengeQueryKeys = {
  all: ["challenges"] as const,
  today: () => [...challengeQueryKeys.all, "today"] as const,
  history: (limit?: number, offset?: number) =>
    [...challengeQueryKeys.all, "history", { limit, offset }] as const,
  stats: (days?: number) =>
    [...challengeQueryKeys.all, "stats", { days }] as const,
  library: () => [...challengeQueryKeys.all, "library"] as const,
};

export default {
  getTodaysChallenges,
  completeChallenge,
  getChallengeHistory,
  getChallengeStats,
  getChallengeLibrary,
  challengeQueryKeys,
};
