import React, { useEffect, useRef, useState } from "react";
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
  Loader2,
  Trash
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, getUserAchievements, equipAchievement, unequipAchievement, updateProfile, getUserCommunityPosts, editPost, deletePost} from "../lib/api";
import { Spinner } from "@/components/ui/spinner";
import  useSessionStatus from "../hooks/useSessionStatus"
import  useSignOut from "../hooks/useLogout"
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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

type ProfileType = {
  userId?: string;
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
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isEditingAchievements, setIsEditingAchievements] = useState(false);
  const [draggedAchievement, setDraggedAchievement] = useState<Achievement | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { isPending, isLoggedIn } = useSessionStatus();
  const { signOut } = useSignOut()
  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const month = d.toLocaleString('en-US', { month: 'short' }); 
    const day = String(d.getDate()).padStart(2, '0');     
    const year = d.getFullYear();                            
    return `${month}-${day}-${year}`;
  };

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery<ProfileType>({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  useEffect(() => {
    if (profile) {
      const birthday = formatDate(profile.birthday);
      const joinedDate = formatDate(profile.createdAt);

      setCurrentUser({
        userId: profile.userId,
        username: profile.username,
        fullName: `${profile.firstName} ${profile.lastName}`,
        bio: profile.bio,
        location: profile.address,
        birthday,
        avatarUrl: profile.profilePic,
        joinedDate,
        stats: {
          posts: 0,
          reposts: 0,
          followers: 0,
          following: 0,
          carbonSaved: "0 tons",
        }
      });
    }
  }, [profile]);

  useEffect(() => {
    const fetchUserPosts = async () => {
    
      if (!currentUser?.userId) return;
    
      try {
        const response = await getUserCommunityPosts();
      
        const formatted = response.map((post: any) => {
          const userReposted = post.repostsDetails?.some(
            (repost: any) => repost.repostedBy.userId === currentUser.userId
          );
        
          const isOriginalPost = post.author?.userId === currentUser.userId;
        
          return {
            id: post._id,
            content: post.content,
            image: post.image,
            timestamp: formatDate(post.createdAt),
            likes: post.likesCount,
            reposts: post.repostsCount,
            comments: post.comments?.length || 0,
            isOriginalPost,
            isRepost: userReposted,
            originalAuthor: {
              name: `${post.author?.firstName} ${post.author?.lastName}` || "Unknown",
              avatarUrl: post.author?.profilePic || null,
              username: post.author?.username || "",
            },
          };
        });
        setPosts(formatted);

        const postCount = formatted.filter((p) => p.isOriginalPost).length;
        const repostCount = formatted.filter((p) => p.isRepost).length;

        setCurrentUser((prevUser) => ({
            ...prevUser,
            stats: {
              ...prevUser.stats,
              posts: postCount,
              reposts: repostCount,
            },
          }));
          } catch (error) {
            console.error("Error fetching user posts:", error);
          }
        };
  
    fetchUserPosts();
  }, [currentUser]); 

  // Handle Post Editing
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

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
    
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    
      toast({
        title: "Post Deleted",
        description: "Your post has been successfully deleted.",
      });
    
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the post.",
        variant: "destructive",
      });
    }
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

  if (!profile || !currentUser) return <p>No profile data found.</p>;

  const achievements = achievementData?.achievements || [];
  const equipped = achievementData?.equipped || [];
  const stats = achievementData?.stats || {};

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const equippedAchievements = achievements.filter(a => 
    equipped.some(e => e.achievementId === a.achievementId)
  );

  const tierIcons = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎'
  };

  const handleSignOut = () => {
    signOut();
  };


  const handleEditClick = () => {
    if (!isEditing) {
      setIsEditing(true);
      fileInputRef.current?.click();
    } else {
      // Save photo
      handleSubmit();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('profilePic', selectedFile);

    try {
      const response = await updateProfile(formData);
        // Assume response.newAvatarUrl has the new URL returned by the API

        if (response.newAvatarUrl) {
          setCurrentUser(prevUser => ({
            ...prevUser,
            avatarUrl: response.newAvatarUrl,
          }));
        } else {
          setCurrentUser(prevUser => ({
            ...prevUser,
            avatarUrl: URL.createObjectURL(selectedFile),
          }));
        }

      setIsEditing(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Upload failed', error);
      // Optionally: show user feedback
    }
  };

  if (isPending) {
    return <Spinner />;
  }

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
                  <AvatarImage src={previewUrl || currentUser.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {currentUser.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                    
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                <Button variant={isEditing ? 'default' : 'outline'} className="w-full md:w-auto" onClick={handleEditClick}>
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditing ? 'Save Photo' : 'Edit Photo'}
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
            {posts.filter(post => post.isOriginalPost).map(post => (
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
                          <ConfirmDialog
                            trigger={
                              <DropdownMenuItem
                                className="gap-2 text-destructive"
                                onSelect={(e) => e.preventDefault()} // Prevents the dropdown from closing prematurely
                              >
                                <Trash className="h-4 w-4" />
                                Delete Post
                              </DropdownMenuItem>
                            }
                            title="Delete Post"
                            description="Are you sure you want to delete this post? This action cannot be undone."
                            confirmText="Delete"
                            variant="destructive"
                            onConfirm={() => handleDeletePost(post.id)}
                          />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mb-4">
                    <p className="text-foreground leading-relaxed">{post.content}</p>
                    {post.image && (
                      <img
                        src={post.image}
                        alt="Post content"
                        className="mt-3 rounded-lg max-w-full h-auto"
                      />
                    )}
                  </div>

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
                        <AvatarImage src={post.originalAuthor.avatarUrl || undefined} />
                        <AvatarFallback>
                          {post.originalAuthor.name.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{post.originalAuthor.name}</p>
                        <p className="text-sm text-muted-foreground">@{post.originalAuthor.username} · {post.timestamp}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-foreground leading-relaxed">{post.content}</p>
                    {post.image && (
                      <img
                        src={post.image}
                        alt="Post content"
                        className="mt-3 rounded-lg max-w-full h-auto"
                      />
                    )}
                  </div>
                  
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