import { useEffect, useState } from "react";
import axios from "axios";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, Award, Star, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import  useSessionStatus from "../hooks/useSessionStatus"
import  useSignOut from "../hooks/useLogout"
import useAuth from "../hooks/useAuth";

interface LeaderboardEntryResponse {
  _id?: string;
  user?: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  score: number;
  badges: string[];
  activity: number;
  posts: number;
  tier?: string;
  rank?: number;
}

interface User extends LeaderboardEntryResponse {
  _id: string;
}

interface UserRank {
  rank: number | null;
  score: number;
  user?: User;
}

const Leaderboards = () => {
  const { user } = useAuth() as { user: { id?: string; _id?: string } | null };
  const userId = user?.id ?? user?._id ?? null;
  
  const [sortBy, setSortBy] = useState("overall");
  const [users, setUsers] = useState<User[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [loading, setLoading] = useState(true);
  const { isPending, isLoggedIn } = useSessionStatus();
  const { signOut } = useSignOut()


  // user tier
  const getUserTier = (score: number) => {
    if (score >= 8000 && score <= 10000) return { tier: 'Gold', icon: '🥇', color: 'text-yellow-500' };
    if (score >= 5000 && score <= 7999) return { tier: 'Silver', icon: '🥈', color: 'text-gray-400' };
    if (score >= 2000 && score <= 4999) return { tier: 'Bronze', icon: '🥉', color: 'text-orange-600' };
    return { tier: 'Unranked', icon: '', color: 'text-gray-500' };
  };

  const normalizeEntry = (entry: LeaderboardEntryResponse, rankOverride?: number): User => ({
    _id: entry._id ?? (typeof entry.user === "string" ? entry.user : ""),
    username: entry.username,
    fullName: entry.fullName,
    avatarUrl: entry.avatarUrl ?? null,
    score: entry.score,
    badges: entry.badges ?? [],
    activity: entry.activity ?? 0,
    posts: entry.posts ?? 0,
    tier: entry.tier,
    rank: rankOverride ?? entry.rank,
  });

  const mergeLeaderboardUsers = (currentUsers: User[], rankUser: User) => {
    const exists = currentUsers.some((entry) => entry._id === rankUser._id);
    if (exists) {
      return currentUsers.map((entry) =>
        entry._id === rankUser._id ? { ...entry, ...rankUser } : entry
      );
    }
    return [...currentUsers, rankUser];
  };

  const isScoreWithinTier = (score: number, tier: string) => {
    switch (tier) {
      case 'gold':
        return score >= 8000 && score <= 10000;
      case 'silver':
        return score >= 5000 && score <= 7999;
      case 'bronze':
        return score >= 2000 && score <= 4999;
      default:
        return true;
    }
  };

  useEffect(() => {
    const fetchLeaderboardAndRank = async () => {
      try {
        setLoading(true);

        // Build API URL with tier parameter
        const tierParam = sortBy !== 'overall' ? `?tier=${sortBy}` : '';
        const leaderboardResponse = await axios.get<LeaderboardEntryResponse[]>(`${import.meta.env.VITE_API_URL}/api/leaderboard${tierParam}`);

        let updatedUsers = leaderboardResponse.data
          .filter((entry) => entry._id || typeof entry.user === "string")
          .map((entry) => normalizeEntry(entry))
          .filter((entry) => isScoreWithinTier(entry.score, sortBy));

        const canFetchRank = !isPending && isLoggedIn && userId;

        if (canFetchRank) {
          const rankResponse = await axios.get<UserRank>(`${import.meta.env.VITE_API_URL}/api/leaderboard/rank/${userId}`);
          const rankData = rankResponse.data;

          if (rankData?.user && (rankData.user._id || typeof rankData.user.user === "string")) {
            const normalizedRankUser = normalizeEntry(rankData.user, rankData.rank ?? undefined);
            if (sortBy === 'overall') {
              const existsInList = updatedUsers.some((entry) => entry._id === normalizedRankUser._id);
              if (existsInList) {
                updatedUsers = mergeLeaderboardUsers(updatedUsers, normalizedRankUser);
              }
            } else if (isScoreWithinTier(normalizedRankUser.score, sortBy)) {
              updatedUsers = mergeLeaderboardUsers(updatedUsers, normalizedRankUser);
            }
            setUserRank({ ...rankData, user: normalizedRankUser });
          } else {
            setUserRank(rankData);
          }
        } else if (!isPending) {
          setUserRank(null);
        }

        if (sortBy !== 'overall') {
          updatedUsers = [...updatedUsers]
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
        }

        setUsers(updatedUsers);

      } catch (error) {
        console.error("Error fetching data:", error);
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setUserRank(null); // user not found or no score
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardAndRank();
  }, [sortBy, isPending, isLoggedIn, userId]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-500" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    switch (sortBy) {
      case "activity":
        return b.activity - a.activity;
      case "posts":
        return b.posts - a.posts;
      default:
        return b.score - a.score;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-lg text-muted-foreground">Loading leaderboards...</p>
        </div>
      </div>
    );
  }
  
  
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar isLoggedIn={isLoggedIn} />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            EcoSteps Leaderboards
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the top eco-warriors in our community and see how your environmental impact compares.
          </p>
        </div>

        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold text-foreground">Top Performers</span>
          </div>
        {/* Filter Controls */}  
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">Tier:
              <SelectValue placeholder="Filter by tier..." />
            </SelectTrigger>
            <SelectContent> 
              <SelectItem value="overall">Overall Ranking</SelectItem>
              <SelectItem value="gold">🥇 Gold (8,000-10,000)</SelectItem>
              <SelectItem value="silver">🥈 Silver (5,000-7,999)</SelectItem>
              <SelectItem value="bronze">🥉 Bronze (2,000-4,999)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Leaderboard Cards */}
        <div className="space-y-4">
          
          {sortedUsers.map((user, index) => {
            const displayRank = user.rank ?? index + 1;
            return (
              <Card key={user._id} className="hover:shadow-elevated transition-all duration-300 ease-out">
                <CardContent className="p-6">
                  <div className="grid grid-cols-12 items-center gap-4">
                    {/* Left section - Rank, Avatar, User Info */}
                    <div className="col-span-6 flex items-center space-x-4 min-w-0">
                      {/* Rank */}
                      <div className="flex-shrink-0 w-12 flex justify-center">
                        {getRankIcon(index + 1)} {/*displayRank*/}
                      </div>

                      {/* Avatar */}
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage src={user.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user.fullName ? user.fullName.split(' ').map(n => n[0]).join('') : 'U'}
                        </AvatarFallback>
                      </Avatar>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/profile/${user._id}`}
                          className="block hover:text-primary transition-smooth"
                        >
                          <h3 className="text-lg font-semibold text-foreground truncate">
                            {user.fullName}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                        </Link>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="col-span-4 flex items-center justify-center">
                      <div className="flex items-center space-x-8">
                        <div className="text-center w-16">
                          <p className="text-2xl font-bold text-primary">{user.score}</p>
                          <p className="text-xs text-muted-foreground">Score</p>
                        </div>
                        <div className="text-center w-16">
                          <p className="text-lg font-semibold text-foreground">{user.activity}</p>
                          <p className="text-xs text-muted-foreground">Activity</p>
                        </div>
                        <div className="text-center w-16">
                          <p className="text-lg font-semibold text-foreground">{user.posts}</p>
                          <p className="text-xs text-muted-foreground">Posts</p>
                        </div>
                      </div>
                    </div>

                    {/* Right section - Badges */}
                    <div className="col-span-2 flex justify-end">
                      <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                        {user.badges.map((badge, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Your Rank Section */}
        <Card className="mt-8 bg-gradient-subtle border-primary/20">
          <CardHeader>
            <CardTitle className="text-center text-foreground">Your Current Statistics</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {userRank && userRank.rank !== null ? (
              <>
                {/* <div className="flex flex-col items-center gap-2 mb-3">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">Global Rank</span>
                  <div className="text-3xl font-bold text-primary">#{userRank.rank}</div>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">Tier Level</span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    {getUserTier(userRank.score).icon} {getUserTier(userRank.score).tier} Tier
                  </span>
                </div> */}

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
                  <div className="bg-card/60 border rounded-lg py-3">
                    <p className="text-xs uppercase font-medium text-muted-foreground">Global Rank</p>
                    <p className="text-xl font-semibold text-foreground">#{userRank.rank}</p>
                  </div>
                  <div className="bg-card/60 border rounded-lg py-3">
                    <p className="text-xs uppercase font-medium text-muted-foreground">Tier Level</p>
                    <p className="text-l font-semibold text-foreground">
                      {getUserTier(userRank.score).icon} {getUserTier(userRank.score).tier} Tier
                    </p>
                  </div>
                  <div className="bg-card/60 border rounded-lg py-3">
                    <p className="text-xs uppercase font-medium text-muted-foreground">Eco Score</p>
                    <p className="text-xl font-semibold text-primary">{userRank.score}</p>
                  </div>
                  <div className="bg-card/60 border rounded-lg py-3">
                    <p className="text-xs uppercase font-medium text-muted-foreground">Activity</p>
                    <p className="text-xl font-semibold text-foreground">{userRank.user?.activity ?? 0}</p>
                  </div>
                  <div className="bg-card/60 border rounded-lg py-3">
                    <p className="text-xs uppercase font-medium text-muted-foreground">Posts</p>
                    <p className="text-xl font-semibold text-foreground">{userRank.user?.posts ?? 0}</p>
                  </div>
                </div>

                <Button variant="hero" asChild>
                  <Link
                    className="transition-all duration-300 ease-out"
                    to="/track"
                  >
                    Track More
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">
                  Your rank will be available after you track your carbon footprint.
                </p>
                <Button asChild>
                  <Link
                    className="transition-all duration-300 ease-out"
                    to="/track"
                  >
                    Start Tracking Carbon Footprint
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Leaderboards;