// client/src/pages/Profile.tsx - Replace your existing Profile.tsx

import React, { useEffect, useState } from "react";
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
  Cake,
  Trophy,
  GripVertical,
  CheckCircle,
  X,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, getUserAchievements, equipAchievement, unequipAchievement } from "../lib/api";
import { Spinner } from "@/components/ui/spinner";
import useSessionStatus from "../hooks/useSessionStatus";
import useSignOut from "../hooks/useLogout";

type Achievement = {
  achievementId: string;
  name: string;
  description: string;
  category: string;
  tier: string;
  icon: string;
  targetValue: number;
  triggerEvent: string;
  unlockCondition: string;
  profilePriority: number;
  notificationPriority: string;
  isActive: boolean;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  isEquipped: boolean;
};

type AchievementData = {
  achievements: Achievement[];
  equipped: { achievementId: string }[];
  stats: { totalCO2Saved?: number };
};

// Mock posts data
const mockPosts = [
  {
    id: "1",
    type: "post",
    content: "Just switched to solar panels for my home! The installation process was smoother than expected. Excited to reduce my carbon footprint even further.",
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
    content: "Completed my first month of biking to work instead of driving. Saved 45kg of CO2 emissions and feeling healthier than ever! Who else is joining the bike-to-work challenge?",
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
  const [isEditingAchievements, setIsEditingAchievements] = useState(false);
  const [draggedAchievement, setDraggedAchievement] = useState<Achievement | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { isPending, isLoggedIn } = useSessionStatus();
  const { signOut } = useSignOut();

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery<ProfileType>({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  const { data: achievementData, isLoading: achievementsLoading } = useQuery<AchievementData>({
    queryKey: ["achievements"],
    queryFn: getUserAchievements,
    staleTime: 1000 * 60 * 5
  });

  const equipMutation = useMutation<any, Error, string>({
    mutationFn: equipAchievement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
      toast({
        title: "Achievement Equipped!",
        description: "This achievement is now displayed on your profile.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to equip achievement",
        variant: "destructive"
      });
    }
  });

  const unequipMutation = useMutation<any, Error, string>({
    mutationFn: unequipAchievement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
      toast({
        title: "Achievement Unequipped",
        description: "This achievement is no longer displayed on your profile.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unequip achievement",
        variant: "destructive"
      });
    }
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const month = d.toLocaleString("en-US", { month: "short" });
    const day = String(d.getUTCDate()).padStart(2, "0");
    const year = d.getUTCFullYear();
    return `${month}-${day}-${year}`;
  };

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
      variant: "destructive",
    });
  };

  const handleSignOut = () => {
    signOut();
  };

  // Drag-and-Drop Logic
  const handleAchievementDragStart = (e: React.DragEvent, achievement: Achievement) => {
    e.dataTransfer.effectAllowed = "move";
    setDraggedAchievement(achievement);
  };

  const handleAchievementDragEnd = () => {
    setDraggedAchievement(null);
  };

  const handleAchievementDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedAchievement) {
      equipMutation.mutate(draggedAchievement.achievementId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleEquip = (achievementId: string) => {
    const equipped = achievementData?.equipped || [];
    if (equipped.length >= 3) {
      toast({
        title: "Maximum Equipped",
        description: "You can only equip 3 achievements at a time. Unequip one first.",
        variant: "destructive"
      });
      return;
    }
    equipMutation.mutate(achievementId);
  };

  const handleUnequip = (achievementId: string) => {
    unequipMutation.mutate(achievementId);
  };

  if (isPending || profileLoading || achievementsLoading) {
    return <Spinner />;
  }
  if (profileError) {
    toast({
      title: "Failed to load profile",
      description: "Please try again later.",
      variant: "destructive",
    });
    return <p>Error loading profile.</p>;
  }

  if (!profile) return <p>No profile data found.</p>;

  const birthday = formatDate(profile.birthday);
  const joinedDate = formatDate(profile.createdAt);

  const achievements = achievementData?.achievements || [];
  const equipped = achievementData?.equipped || [];
  const stats = achievementData?.stats || {};

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const equippedAchievements = achievements.filter(a => 
    equipped.some(e => e.achievementId === a.achievementId)
  );

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
      carbonSaved: `${(stats.totalCO2Saved || 0).toFixed(1)} kg`,
    },
  };

  const tierIcons = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎'
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleSignOut} />
      
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
                Featured Achievements ({equipped.length}/3)
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
                  {[0, 1, 2].map((index) => {
                    const slotAchievement = equippedAchievements[index];
                    return (
                      <div
                        key={index}
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 min-h-[120px] flex items-center justify-center bg-accent/20"
                        onDrop={handleAchievementDrop}
                        onDragOver={handleDragOver}
                      >
                        {slotAchievement ? (
                          <div className="text-center w-full">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-2xl">{slotAchievement.icon}</span>
                                <span className="font-medium text-sm truncate">{slotAchievement.name}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleUnequip(slotAchievement.achievementId)}
                                disabled={unequipMutation.isPending}
                              >
                                {unequipMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">{slotAchievement.description}</p>
                            <Badge variant="secondary" className="mt-2 text-xs">
                              {tierIcons[slotAchievement.tier]} {slotAchievement.tier}
                            </Badge>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center">
                            Drop achievement here
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Available Achievements */}
                <div>
                  <h4 className="font-medium mb-3">Your Unlocked Achievements ({unlockedAchievements.length}):</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                    {unlockedAchievements.map((achievement) => {
                      const isEquipped = equipped.some(e => e.achievementId === achievement.achievementId);
                      return (
                        <div
                          key={achievement.achievementId}
                          draggable={!isEquipped}
                          onDragStart={(e) => !isEquipped && handleAchievementDragStart(e, achievement)}
                          onDragEnd={handleAchievementDragEnd}
                          className={`flex items-center gap-3 p-3 border rounded-lg transition-all ${
                            isEquipped
                              ? 'opacity-50 bg-muted cursor-not-allowed' 
                              : 'bg-background hover:bg-accent cursor-move hover:shadow-md'
                          }`}
                        >
                          {!isEquipped && <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                          <span className="text-2xl flex-shrink-0">{achievement.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{achievement.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {tierIcons[achievement.tier]} {achievement.tier}
                              </Badge>
                              {isEquipped && (
                                <Badge variant="secondary" className="text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Equipped
                                </Badge>
                              )}
                            </div>
                          </div>
                          {!isEquipped && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEquip(achievement.achievementId)}
                              disabled={equipMutation.isPending}
                              className="flex-shrink-0"
                            >
                              {equipMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Equip"
                              )}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {unlockedAchievements.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Complete challenges and track your carbon footprint to unlock achievements!
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                {equippedAchievements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {equippedAchievements.map((achievement) => (
                      <div key={achievement.achievementId} className="flex items-center gap-3 p-4 bg-accent/50 rounded-lg">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <span className="text-3xl">{achievement.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{achievement.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">{achievement.description}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {tierIcons[achievement.tier]}
                            </Badge>
                            <p className="text-xs text-success font-medium">
                              {achievement.unlockedAt && `Earned ${formatDate(achievement.unlockedAt)}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">
                      You haven't equipped any achievements yet.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditingAchievements(true)}
                      disabled={unlockedAchievements.length === 0}
                    >
                      {unlockedAchievements.length > 0 ? "Equip Achievements" : "Unlock Achievements First"}
                    </Button>
                  </div>
                )}
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