import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Settings, 
  Calendar, 
  MessageSquare, 
  Heart, 
  Repeat2, 
  MoreHorizontal,
  Edit,
  Trash2,
  MapPin,
  Globe,
  Cake,
  Trophy,
  Footprints,
  Recycle,
  Car,
  GripVertical
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

import { useQuery } from "@tanstack/react-query";
import { getProfile } from "../lib/api";
import { useMutation } from "@tanstack/react-query";
import { logout } from "@/lib/api";
import queryClient from "../config/queryClient";


// Mock user data
const currentUser = {
  id: "current-user",
  username: "yourUsername",
  fullName: "Your Name",
  email: "your.email@example.com",
  bio: "Passionate about sustainable living and making a positive environmental impact. 🌱",
  location: "San Francisco, CA",
  website: "https://www.facebook.com/westley.intia/",
  avatarUrl: null,
  joinedDate: "March 2024",
  stats: {
    posts: 24,
    reposts: 8,
    followers: 156,
    following: 89,
    carbonSaved: "2.3 tons"
  },
  achievements: {
    unlocked: [
      {
        id: "walk_the_talk",
        name: "Walk the Talk",
        description: "Walk 50 km in a single day",
        icon: Footprints,
        dateEarned: "2025-08-20"
      },
      {
        id: "green_commuter",
        name: "Green Commuter", 
        description: "Use public transport for 30 consecutive days",
        icon: Car,
        dateEarned: "2025-08-15"
      },
      {
        id: "recycling_champion",
        name: "Recycling Champion",
        description: "Recycle 100 kg of materials in a month",
        icon: Recycle,
        dateEarned: "2025-08-10"
      }
    ],
    displayed: [
      {
        id: "walk_the_talk",
        name: "Walk the Talk",
        description: "Walk 50 km in a single day",
        icon: Footprints,
        dateEarned: "2025-08-20"
      },
      {
        id: "green_commuter",
        name: "Green Commuter",
        description: "Use public transport for 30 consecutive days", 
        icon: Car,
        dateEarned: "2025-08-15"
      },
      {
        id: "recycling_champion",
        name: "Recycling Champion",
        description: "Recycle 100 kg of materials in a month",
        icon: Recycle,
        dateEarned: "2025-08-10"
      }
    ]
  }
};


// Mock posts data
const mockPosts = [
  {
    id: "1",
    type: "post",
    content: "Just switched to solar panels for my home! The installation process was smoother than expected. Excited to reduce my carbon footprint even further. 🌞 #SolarPower #GreenEnergy",
    timestamp: "2 hours ago",
    likes: 12,
    comments: 3,
    reposts: 2,
    isRepost: false
  },
  {
    id: "2", 
    type: "repost",
    content: "Great tips for reducing plastic waste in your daily routine!",
    originalAuthor: "EcoTipsDaily",
    timestamp: "1 day ago",
    likes: 8,
    comments: 1,
    reposts: 5,
    isRepost: true
  },
  {
    id: "3",
    type: "post", 
    content: "Completed my first month of biking to work instead of driving. Saved 45kg of CO2 emissions and feeling healthier than ever! 🚴‍♂️ Who else is joining the bike-to-work challenge?",
    timestamp: "3 days ago",
    likes: 28,
    comments: 7,
    reposts: 4,
    isRepost: false
  }
];



type ProfileType = {
  profilePic: string;
  firstName: string;
  lastName: string;
  username: string;
  birthday: string;
  address: string;
  bio: string;
  createdAt: string;
};

const Profile = () => {

  const [posts] = useState(mockPosts);
  const [displayedAchievements, setDisplayedAchievements] = useState(currentUser.achievements.displayed);
  const [isEditingAchievements, setIsEditingAchievements] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  
  useEffect(() => {
  const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!loggedIn) {
      navigate("/");
      return;
    }
    setIsLoggedIn(true);
  }, [navigate]);


  const { mutate: signOut } = useMutation({
    mutationFn: logout,
    onSettled: () => {
      localStorage.clear();
      queryClient.clear(); 
      navigate("/login", { replace: true }); 
    },
  });


  const handleEditPost = (postId: string) => {
    toast({
      title: "Edit Post",
      description: "Post editing functionality coming soon!",
    });
  };

  const handleDeletePost = (postId: string) => {
    toast({
      title: "Delete Post",
      description: "Are you sure you want to delete this post?",
      variant: "destructive"
    });
  };

// Di pa sure
  const { data: profile, isLoading, error } = useQuery<ProfileType>({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  if (isLoading) return <p>Loading...</p>;

  if (error) {
    toast({
      title: "Failed to load profile",
      description: "Please try again later.",
      variant: "destructive",
    });
    return <p>Error loading profile.</p>;
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const month = d.toLocaleString('en-US', { month: 'short' }); 
    const day = String(d.getUTCDate()).padStart(2, '0');      
    const year = d.getUTCFullYear();                            
    return `${month}-${day}-${year}`;
  };

  const birthday = formatDate(profile.birthday);
  const joinedDate = formatDate(profile.createdAt);
  
  const currentUser = {
  username: profile.username,
  fullName: `${profile.firstName} ${profile.lastName}`,
  bio: profile.bio,
  location: profile.address,
  birthday: birthday,
  avatarUrl: profile.profilePic,
  joinedDate: joinedDate,
  stats: {
    posts: 24,
    reposts: 8,
    followers: 156,
    following: 89,
    carbonSaved: "2.3 tons"
  }
};

  if (!profile) return <p>No profile data found.</p>;
 // Di pasure
  const handleAchievementDragStart = (e: React.DragEvent, achievementId: string) => {
    e.dataTransfer.setData("text/plain", achievementId);
  };

  const handleAchievementDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    const draggedAchievement = currentUser.achievements.unlocked.find(a => a.id === draggedId);
    
    if (draggedAchievement && !displayedAchievements.find(a => a.id === draggedId)) {
      const newDisplayed = [...displayedAchievements];
      if (targetIndex < newDisplayed.length) {
        newDisplayed[targetIndex] = draggedAchievement;
      } else {
        newDisplayed.push(draggedAchievement);
      }
      setDisplayedAchievements(newDisplayed.slice(0, 3));
    }
  };

  const handleAchievementRemove = (achievementId: string) => {
    setDisplayedAchievements(prev => prev.filter(a => a.id !== achievementId));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
// Di pa sure

  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn={isLoggedIn} onLogout={signOut} />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center md:items-start">
                <Avatar className="h-32 w-32 mb-4">
                  <AvatarImage src={currentUser.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {currentUser.fullName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" className="w-full md:w-auto">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Photo
                </Button>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-1">
                      {currentUser.fullName}
                    </h1>
                    <p className="text-lg text-muted-foreground">@{currentUser.username}</p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link to="/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </Button>
                </div>

                <p className="text-foreground mb-4">{currentUser.bio}</p>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {currentUser.location}
                  </div>
                  <div className="flex items-center">
                    <Cake className="h-4 w-4 mr-1" />
                  
                     {currentUser.birthday}
                   
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Joined {currentUser.joinedDate}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{currentUser.stats.posts}</p>
                    <p className="text-sm text-muted-foreground">Posts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{currentUser.stats.reposts}</p>
                    <p className="text-sm text-muted-foreground">Reposts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{currentUser.stats.followers}</p>
                    <p className="text-sm text-muted-foreground">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{currentUser.stats.following}</p>
                    <p className="text-sm text-muted-foreground">Following</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success">{currentUser.stats.carbonSaved}</p>
                    <p className="text-sm text-muted-foreground">CO₂ Saved</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Featured Achievements
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/achievements">View All</Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditingAchievements(!isEditingAchievements)}
                >
                  {isEditingAchievements ? "Done" : "Edit"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isEditingAchievements ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Drag achievements from your unlocked list to display them (max 3):
                </p>
                
                {/* Display Slots */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {[0, 1, 2].map((index) => (
                    <div
                      key={index}
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 min-h-[120px] flex items-center justify-center"
                      onDrop={(e) => handleAchievementDrop(e, index)}
                      onDragOver={handleDragOver}
                    >
                      {displayedAchievements[index] ? (
                        <div className="text-center w-full">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              {React.createElement(displayedAchievements[index].icon, { 
                                className: "h-6 w-6 text-primary" 
                              })}
                              <span className="font-medium text-sm">{displayedAchievements[index].name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAchievementRemove(displayedAchievements[index].id)}
                            >
                              ×
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">{displayedAchievements[index].description}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center">
                          Drop achievement here
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Available Achievements */}
                <div>
                  <h4 className="font-medium mb-3">Your Unlocked Achievements:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentUser.achievements.unlocked.map((achievement) => (
                      <div
                        key={achievement.id}
                        draggable
                        onDragStart={(e) => handleAchievementDragStart(e, achievement.id)}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-move transition-smooth hover:shadow-md ${
                          displayedAchievements.find(a => a.id === achievement.id) 
                            ? 'opacity-50 bg-muted' 
                            : 'bg-background hover:bg-accent'
                        }`}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        {React.createElement(achievement.icon, { 
                          className: "h-5 w-5 text-primary" 
                        })}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{achievement.name}</p>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                        </div>
                        {displayedAchievements.find(a => a.id === achievement.id) && (
                          <Badge variant="secondary" className="text-xs">Displayed</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {displayedAchievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-3 p-4 bg-accent/50 rounded-lg">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {React.createElement(achievement.icon, { 
                        className: "h-6 w-6 text-primary" 
                      })}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{achievement.name}</h4>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      <p className="text-xs text-success font-medium">Earned {achievement.dateEarned}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Posts and Reposts */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="reposts">Reposts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="space-y-4 mt-6">
            {posts.filter(post => !post.isRepost).map((post) => (
              <Card key={post.id} className="hover:shadow-elevated transition-smooth">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={currentUser.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {currentUser.fullName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{currentUser.fullName}</p>
                        <p className="text-sm text-muted-foreground">@{currentUser.username} · {post.timestamp}</p>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditPost(post.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Post
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeletePost(post.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Post
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="text-foreground mb-4">{post.content}</p>

                  <div className="flex items-center space-x-6 text-muted-foreground">
                    <Button variant="ghost" size="sm" className="p-0 h-auto">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {post.comments}
                    </Button>
                    <Button variant="ghost" size="sm" className="p-0 h-auto">
                      <Repeat2 className="h-4 w-4 mr-1" />
                      {post.reposts}
                    </Button>
                    <Button variant="ghost" size="sm" className="p-0 h-auto">
                      <Heart className="h-4 w-4 mr-1" />
                      {post.likes}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="reposts" className="space-y-4 mt-6">
            {posts.filter(post => post.isRepost).map((post) => (
              <Card key={post.id} className="hover:shadow-elevated transition-smooth">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 text-muted-foreground text-sm mb-3">
                    <Repeat2 className="h-4 w-4" />
                    <span>You reposted</span>
                  </div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-muted">
                          {post.originalAuthor?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{post.originalAuthor}</p>
                        <p className="text-sm text-muted-foreground">{post.timestamp}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-foreground mb-4">{post.content}</p>

                  <div className="flex items-center space-x-6 text-muted-foreground">
                    <Button variant="ghost" size="sm" className="p-0 h-auto">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {post.comments}
                    </Button>
                    <Button variant="ghost" size="sm" className="p-0 h-auto">
                      <Repeat2 className="h-4 w-4 mr-1" />
                      {post.reposts}
                    </Button>
                    <Button variant="ghost" size="sm" className="p-0 h-auto">
                      <Heart className="h-4 w-4 mr-1" />
                      {post.likes}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;