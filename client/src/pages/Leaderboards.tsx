import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, Award, Star, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import  useSessionStatus from "../hooks/useSessionStatus"
import  useSignOut from "../hooks/useLogout"


// Mock data for leaderboards
const mockUsers = [
  {
    id: "1",
    username: "ecowarrior123",
    fullName: "Alex Green",
    avatarUrl: null,
    score: 2840,
    rank: 1,
    badges: ["Carbon Neutral", "Eco Champion", "Green Leader"],
    activity: 156,
    posts: 89,
  },
  {
    id: "2", 
    username: "sustainablesam",
    fullName: "Sam Rodriguez",
    avatarUrl: null,
    score: 2650,
    rank: 2,
    badges: ["Eco Champion", "Tree Planter"],
    activity: 142,
    posts: 76,
  },
  {
    id: "3",
    username: "greenliving",
    fullName: "Emma Chen",
    avatarUrl: null,
    score: 2450,
    rank: 3,
    badges: ["Carbon Neutral", "Waste Warrior"],
    activity: 128,
    posts: 63,
  },
  {
    id: "4",
    username: "planetprotector",
    fullName: "Jordan Taylor",
    avatarUrl: null,
    score: 2280,
    rank: 4,
    badges: ["Eco Champion"],
    activity: 115,
    posts: 52,
  },
  {
    id: "5",
    username: "renewablepower",
    fullName: "Casey Park",
    avatarUrl: null,
    score: 2150,
    rank: 5,
    badges: ["Green Leader", "Solar Advocate"],
    activity: 98,
    posts: 41,
  },
];

const Leaderboards = () => {
  const [sortBy, setSortBy] = useState("score");
  const [users] = useState(mockUsers);

  const { isPending, isLoggedIn } = useSessionStatus();
  const { signOut } = useSignOut()


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

  const handleSignOut = () => {
    signOut();
  };

  if (isPending) {
    return <Spinner />;
  }
  

  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleSignOut} />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            EcoStep Leaderboards
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the top eco-warriors in our community and see how your environmental impact compares.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold text-foreground">Top Performers</span>
          </div>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Total Score</SelectItem>
              <SelectItem value="activity">Activity Level</SelectItem>
              <SelectItem value="posts">Posts Count</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Leaderboard Cards */}
        <div className="space-y-4">
          {sortedUsers.map((user, index) => (
            <Card key={user.id} className="hover:shadow-elevated transition-smooth">
              <CardContent className="p-6">
                <div className="grid items-center grid-cols-[48px,48px,1fr,128px,112px,112px,minmax(160px,1fr)] gap-4">
                  {/* Rank */}
                  <div className="flex justify-center">
                    {getRankIcon(index + 1)}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.fullName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>

                  {/* User Info */}
                  <div className="min-w-0">
                    <Link 
                      to={`/profile/${user.id}`}
                      className="block hover:text-primary transition-smooth truncate"
                    >
                      <h3 className="text-lg font-semibold text-foreground">
                        {user.fullName}
                      </h3>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </Link>
                  </div>

                  {/* Score */}
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{user.score}</p>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>

                  {/* Activity */}
                  <div className="text-center">
                    <p className="text-lg font-semibold text-foreground">{user.activity}</p>
                    <p className="text-xs text-muted-foreground">Activity</p>
                  </div>

                  {/* Posts */}
                  <div className="text-center">
                    <p className="text-lg font-semibold text-foreground">{user.posts}</p>
                    <p className="text-xs text-muted-foreground">Posts</p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1">
                    {user.badges.map((badge, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        {badge}
                      </Badge>
                    ))}
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
            <div className="text-3xl font-bold text-primary mb-2">#42</div>
            <p className="text-muted-foreground mb-4">Keep up the great work to climb higher!</p>
            <Button variant="hero" asChild>
              <Link to="/track">Start Tracking Carbon</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Leaderboards;