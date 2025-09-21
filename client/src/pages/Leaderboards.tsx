import { useState, useEffect } from "react";
import axios from "axios";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, Award, Star, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

interface User {
  _id: string; // id to _id to match MongoDB
  username: string;
  fullName: string;
  avatarUrl: string | null;
  score: number;
  badges: string[];
  activity: number;
  posts: number;
}

const Leaderboards = () => {
  const [sortBy, setSortBy] = useState("overall");
  const [users, setUsers] = useState<User[]>([]);
  const [userRank, setUserRank] = useState<{ rank: number | null; score: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to determine user tier
  const getUserTier = (score: number) => {
    if (score >= 8000 && score <= 10000) return { tier: 'Gold', icon: '🥇', color: 'text-yellow-500' };
    if (score >= 5000 && score <= 7999) return { tier: 'Silver', icon: '🥈', color: 'text-gray-400' };
    if (score >= 2000 && score <= 4999) return { tier: 'Bronze', icon: '🥉', color: 'text-orange-600' };
    return { tier: 'Unranked', icon: '', color: 'text-gray-500' };
  };

  useEffect(() => {
    const fetchLeaderboardAndRank = async () => {
      try {
        setLoading(true);
        
        // Build API URL with tier parameter
        const tierParam = sortBy !== 'overall' ? `?tier=${sortBy}` : '';
        const leaderboardResponse = await axios.get(`http://localhost:5000/api/leaderboard${tierParam}`);
        setUsers(leaderboardResponse.data);

        // Fetch current user rank
        const currentUserId = "66e9d7850431285a9a59587d"; // Replace with the actual logged-in user's ID
        const rankResponse = await axios.get(`http://localhost:5000/api/leaderboard/rank/${currentUserId}`);
        setUserRank(rankResponse.data);

      } catch (error) {
        console.error("Error fetching data:", error);
        // if the user rank might not be found
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setUserRank(null); // user not found or no score
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardAndRank();
  }, [sortBy]); // Add sortBy to dependency array

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
          <p className="text-lg text-muted-foreground">Loading leaderboards...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar isLoggedIn={true} />
      
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
          {sortedUsers.map((user, index) => (
            <Card key={user._id} className="hover:shadow-elevated transition-all duration-300 ease-out">
              <CardContent className="p-6">
                <div className="grid grid-cols-12 items-center gap-4">
                  {/* Left section - Rank, Avatar, User Info */}
                  <div className="col-span-6 flex items-center space-x-4 min-w-0">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-12 flex justify-center">
                      {getRankIcon(index + 1)}
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

                  {/* Center section - Stats (Fixed position) */}
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
          ))}
        </div>

        {/* Your Rank Section */}
        <Card className="mt-8 bg-gradient-subtle border-primary/20">
          <CardHeader>
            <CardTitle className="text-center text-foreground">Your Current Rank</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {userRank && userRank.rank ? (
              <>
                <div className="text-3xl font-bold text-primary mb-2">#{userRank.rank}</div>
                <p className="text-muted-foreground mb-4">
                  You have a score of {userRank.score}. Keep up the great work to climb higher!
                </p>
                <Button variant="hero" asChild>
                  <Link
                    className="transition-all duration-300 ease-out" 
                    to="/track">
                      Track More
                  </Link>
                </Button>
              </>
            ) : 
            (
              <>
                <p className="text-muted-foreground mb-4">
                  Your rank will be available after you track your carbon footprint.
                </p>
                <Button asChild>
                  <Link 
                    className="transition-all duration-300 ease-out" 
                    to="/track">
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