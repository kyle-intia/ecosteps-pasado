import { useEffect, useState } from "react";
import axios from "axios";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Star, TrendingUp, Activity } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import useSessionStatus from "../hooks/useSessionStatus";
import useSignOut from "../hooks/useLogout";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { Link } from "react-router-dom";

interface LeaderboardUser {
  id: string;
  avatarUrl?: string;
  firstName: string;
  lastName: string;
  currentRank: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";
  numberOfPosts: number;
  numberOfActivities: number;
  totalScore: number;
  equippedBadges: Array<{
    id: string;
    icon: string;
    name: string;
  }>;
}

const getTierColor = (tier: string) => {
  const colors = {
    Diamond: "bg-blue-500/10 text-blue-700 border-blue-300",
    Platinum: "bg-slate-500/10 text-slate-700 border-slate-300",
    Gold: "bg-yellow-500/10 text-yellow-700 border-yellow-300",
    Silver: "bg-gray-500/10 text-gray-700 border-gray-300",
    Bronze: "bg-amber-700/10 text-amber-700 border-amber-300",
  };
  return colors[tier as keyof typeof colors] || "bg-muted";
};

const getRankBadgeColor = (rank: number) => {
  if (rank === 1) return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white";
  if (rank === 2) return "bg-gradient-to-br from-slate-300 to-slate-500 text-white";
  if (rank === 3) return "bg-gradient-to-br from-amber-600 to-amber-800 text-white";
  return "bg-muted text-muted-foreground";
};

const Leaderboards = () => {

  const { userLeaderboard, pending, error } = useLeaderboard();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isPending, isLoggedIn } = useSessionStatus();
  const { signOut } = useSignOut();

  const [selectedTier, setSelectedTier] = useState<string>("All");
  
  const tiers = ["All", "Bronze", "Silver", "Gold", "Diamond", "Platinum" ];

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/leaderboard`, {
          credentials: "include",
        });
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          const transformed = data.data.map((entry: any) => ({
            id: entry.id,
            avatarUrl: entry.user.profilePic,
            firstName: entry.user.firstName,
            lastName: entry.user.lastName,
            currentRank: entry.rank,
            tier: entry.tier,
            numberOfPosts: entry.Posts,
            numberOfActivities: entry.Activity,
            totalScore: entry.totalScore,
            equippedBadges: entry.user.equippedBadges || [],
          }));
          setUsers(transformed);
        } else {
          setUsers([]);
          console.warn("Unexpected response format", data);
        }
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const filteredUsers = users
    .filter((user) => selectedTier === "All" || user.tier === selectedTier)
    .sort((a, b) => b.totalScore - a.totalScore);

  if (loading || isPending) return <Spinner />;

  const handleSignOut = () => signOut();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleSignOut} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            EcoSteps Leaderboards
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the top eco-warriors in our community and see how your impact compares.
          </p>
        </div>

        <div className="container mx-auto p-4 md:p-6 space-y-6">

          {/* Tier Filter */}
          <div className="flex flex-wrap justify-center gap-2">
            {tiers.map((tier) => (
              <Button
                key={tier}
                variant={selectedTier === tier ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTier(tier)}
                className="min-w-[80px]"
              >
                {tier}
              </Button>
            ))}
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold text-foreground">Top Performers</span>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <Card className="max-w-4xl mx-auto p-6 text-center">
              <p className="text-muted-foreground text-lg">
                No users found in the <strong>{selectedTier}</strong> tier yet.
              </p>
            </Card>
          ) : (
            <>
              {/* Top 3 Podium */}
              {filteredUsers.length >= 1 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  {filteredUsers.slice(0, 3).map((user, index) => {
                    const actualUser = filteredUsers[index];
                  
                    return (
                      <Card 
                        key={actualUser.id} 
                        className={`relative overflow-hidden ${
                          index === 0 
                            ? 'md:order-2 border-2 border-yellow-400 shadow-lg shadow-yellow-200/50' 
                            : index === 1
                            ? 'md:order-1 border-slate-300'
                            : 'md:order-3 border-amber-600'
                        }`}
                      >
                        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 ${
                          index === 0 ? 'bg-yellow-400' :
                          index === 1 ? 'bg-slate-400' : 'bg-amber-600'
                        }`} />

                        <CardContent className="p-6 text-center space-y-4">
                          <div className="relative inline-block">
                            <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                              <AvatarImage src={actualUser.avatarUrl} alt={`${actualUser.firstName} ${actualUser.lastName}`} />
                              <AvatarFallback className="text-xl">
                                {actualUser.firstName.charAt(0)}
                                {actualUser.lastName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${getRankBadgeColor(index + 1)}`}>
                              <span className="text-lg font-bold">{index + 1}</span>
                            </div>
                          </div>
                      
                          <div>
                            <h3 className="font-bold text-lg">
                              {actualUser.firstName} {actualUser.lastName}
                            </h3>
                            <Badge variant="outline" className={`mt-2 ${getTierColor(actualUser.tier)}`}>
                              {actualUser.tier}
                            </Badge>
                          </div>
                      
                          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                            <div className="flex items-center justify-center gap-2 text-primary">
                              <Star className="h-4 w-4 fill-current" />
                              <span className="text-xs font-medium">Eco Score</span>
                            </div>
                            <div className="font-bold text-2xl mt-1">{actualUser.totalScore.toLocaleString()}</div>
                          </div>
                      
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-muted rounded-lg p-2">
                              <div className="text-muted-foreground text-xs">Posts</div>
                              <div className="font-bold text-lg">{actualUser.numberOfPosts}</div>
                            </div>
                            <div className="bg-muted rounded-lg p-2">
                              <div className="text-muted-foreground text-xs">Activities</div>
                              <div className="font-bold text-lg">{actualUser.numberOfActivities}</div>
                            </div>
                          </div>
                      
                          <div className="flex justify-center gap-1">
                            {actualUser.equippedBadges.map((badge) => (
                              <span key={badge.id} className="text-2xl" title={badge.name}>
                                {badge.icon}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Rest of the leaderboard */}
              <div className="max-w-4xl mx-auto space-y-3">
                {filteredUsers.slice(3).map((user, idx) => (
                  <Card key={user.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <span className="font-bold text-lg">{idx + 4}</span>
                        </div>
                
                        {/* Avatar & Name */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="h-12 w-12 border-2 border-background">
                            <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
                            <AvatarFallback>
                              {user.firstName.charAt(0)}
                              {user.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">
                              {user.firstName} {user.lastName}
                            </h4>
                            <Badge variant="outline" className={`text-xs ${getTierColor(user.tier)}`}>
                              {user.tier}
                            </Badge>
                          </div>
                        </div>
                
                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Star className="h-4 w-4 text-primary fill-current" />
                            <span className="font-bold">{user.totalScore.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{user.numberOfPosts}</span>
                            <span className="text-muted-foreground hidden md:inline">posts</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{user.numberOfActivities}</span>
                            <span className="text-muted-foreground hidden md:inline">activities</span>
                          </div>
                        </div>
                
                        {/* Badges */}
                        <div className="hidden md:flex gap-1">
                          {user.equippedBadges.map((badge) => (
                            <span key={badge.id} className="text-xl" title={badge.name}>
                              {badge.icon}
                            </span>
                          ))}
                        </div>
                      </div>
                        
                      {/* Mobile stats */}
                      <div className="sm:hidden flex items-center justify-around mt-3 pt-3 border-t">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Score</div>
                          <div className="font-bold">{user.totalScore.toLocaleString()}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Posts</div>
                          <div className="font-bold">{user.numberOfPosts}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Activities</div>
                          <div className="font-bold">{user.numberOfActivities}</div>
                        </div>
                        <div className="flex gap-1">
                          {user.equippedBadges.map((badge) => (
                            <span key={badge.id} className="text-lg" title={badge.name}>
                              {badge.icon}
                            </span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}


          {/* Your Rank Section */}
          <Card className="mt-8 border-2 border-yellow-200 shadow-lg shadow-yellow-100/50">
            <CardHeader>
              <CardTitle className="text-center text-foreground">Your Current Statistics</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {pending ? (
                <p>Loading...</p>
              ) : userLeaderboard ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
                    <div className="bg-card/60 border-2 border-yellow-200 shadow-lg shadow-yellow-100/50 rounded-lg py-3">
                      <p className="text-xs uppercase font-medium text-muted-foreground">Rank</p>
                      <p className="text-xl font-semibold text-foreground">#{userLeaderboard.currentRank}</p>
                    </div>
                    <div className="bg-card/60 border-2 border-yellow-200 shadow-lg shadow-yellow-100/50 rounded-lg py-3">
                      <p className="text-xs uppercase font-medium text-muted-foreground ${getTierColor(actualUser.tier)}">Tier Level</p>
                      <Badge className={`text-l font-semibold text-foreground ${getTierColor(userLeaderboard.tier)}`}>{userLeaderboard.tier}</Badge>
                    </div>
                    <div className="bg-card/60 border-2 border-yellow-200 shadow-lg shadow-yellow-100/50 rounded-lg py-3">
                      <p className="text-xs uppercase font-medium text-muted-foreground">Eco Score</p>
                      <p className="text-xl font-semibold text-primary">{userLeaderboard.totalScore}</p>
                    </div>
                    <div className="bg-card/60 border-2 border-yellow-200 shadow-lg shadow-yellow-100/50 rounded-lg py-3">
                      <p className="text-xs uppercase font-medium text-muted-foreground">Posts</p>
                      <p className="text-xl font-semibold text-foreground">{userLeaderboard.Posts}</p>
                    </div>
                    <div className="bg-card/60 border-2 border-yellow-200 shadow-lg shadow-yellow-100/50 rounded-lg py-3">
                      <p className="text-xs uppercase font-medium text-muted-foreground">Activities</p>
                      <p className="text-xl font-semibold text-foreground">{userLeaderboard.Activity}</p>
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
        </div>
      </main>
    </div>
  );
};

export default Leaderboards;
