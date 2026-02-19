import React, { useCallback, useEffect, useRef, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Calendar,
  Edit,
  MapPin,
  Cake,
  Trophy,
  GripVertical,
  CheckCircle,
  X,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserPostsAndReposts,
  likePost,
  sharePost,
  repostPost,
  getProfile,
  getUserAchievements,
  equipAchievement,
  unequipAchievement,
  updateProfile,
  getUserCommunityPosts,
  editPost,
  deletePost,
  commentOnPost,
  deleteComment,
} from "../lib/api";
import { Spinner } from "@/components/ui/spinner";
import useSessionStatus from "../hooks/useSessionStatus";
import useSignOut from "../hooks/useLogout";
import UserTrackHistory from "@/components/TrackHistory";
import PostCard from "@/components/PostCard";
import useAuth from "../hooks/useAuth";

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

const LIMIT = 6;

const Profile = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isEditingAchievements, setIsEditingAchievements] = useState(false);
  const [draggedAchievement, setDraggedAchievement] =
    useState<Achievement | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { isPending, isLoggedIn } = useSessionStatus();
  const { signOut } = useSignOut();
  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const { user } = useAuth() as { user: { _id?: string } };
  const userId = user?._id;

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
    const month = d.toLocaleString("en-US", { month: "short" });
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}-${day}-${year}`;
  };

  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery<ProfileType>({
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
      });
    }
  }, [profile]);

  const [reposts, setReposts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");

  const fetchPosts = useCallback(
    async (tab: "posts" | "reposts", pageNum = 1, append = false) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const data = await getUserPostsAndReposts(userId, pageNum, LIMIT);

        const normalized = (Array.isArray(data) ? data : data.posts || []).map(
          (p: any) => ({
            ...p,
            isFollowing: false,
            likesCount: p.likesCount ?? p.likes?.length ?? 0,
            repostsCount: p.repostsCount ?? p.reposts?.length ?? 0,
            sharesCount: p.sharesCount ?? p.shares?.length ?? 0,
          }),
        );

        if (tab === "posts") {
          setPosts((prev) => (append ? [...prev, ...normalized] : normalized));
        } else {
          setReposts((prev) =>
            append ? [...prev, ...normalized] : normalized,
          );
        }

        setHasMore(normalized.length >= LIMIT);
        setPage(pageNum);
      } catch (err: any) {
        toast({
          title: "Failed to load posts",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [userId, toast],
  );

  useEffect(() => {
    fetchPosts(activeTab as "posts" | "reposts", 1, false);
  }, [activeTab, fetchPosts]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchPosts(activeTab as "posts" | "reposts", page + 1, true);
    }
  };

  const currentFeed = activeTab === "posts" ? posts : reposts;

  const myPosts = currentFeed.filter((post) => post.author._id === userId);
  const myReposts = currentFeed.filter(
    (post) =>
      post.isReposted &&
      post.repostsDetails?.some((r) => r.repostedBy._id === userId),
  );

  const { data: achievementData, isLoading: achievementsLoading } =
    useQuery<AchievementData>({
      queryKey: ["achievements"],
      queryFn: getUserAchievements,
      staleTime: 1000 * 60 * 5,
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
        variant: "destructive",
      });
    },
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
        variant: "destructive",
      });
    },
  });

  const handleAchievementDragStart = (
    e: React.DragEvent,
    achievement: Achievement,
  ) => {
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
        description:
          "You can only equip 3 achievements at a time. Unequip one first.",
        variant: "destructive",
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

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const equippedAchievements = achievements.filter((a) =>
    equipped.some((e) => e.achievementId === a.achievementId),
  );

  const tierIcons = {
    bronze: "🥉",
    silver: "🥈",
    gold: "🥇",
    platinum: "💎",
  };

  const handleSignOut = () => {
    signOut();
  };

  const handleEditClick = () => {
    if (!isEditing) {
      setIsEditing(true);
      fileInputRef.current?.click();
    } else {
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

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("profilePic", selectedFile);

      const response = await updateProfile(formData);

      if (response.newAvatarUrl) {
        setCurrentUser((prevUser) => ({
          ...prevUser,
          avatarUrl: response.newAvatarUrl,
        }));
      } else {
        setCurrentUser((prevUser) => ({
          ...prevUser,
          avatarUrl: URL.createObjectURL(selectedFile),
        }));
      }

      setIsEditing(false);
      setSelectedFile(null);
    } catch (error) {
      console.error("Upload error:", error);

      const message =
        (error && typeof error === "object" && error.error) ||
        "Could not upload your picture. Try again later.";

      toast({
        title: "Upload failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  if (isPending) {
    return <Spinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleSignOut} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center md:items-start">
                <Avatar className="h-32 w-32 mb-4">
                  <AvatarImage
                    src={previewUrl || currentUser.avatarUrl || undefined}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {currentUser.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-col gap-2 w-full md:w-auto">
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    className="transition-all duration-300 ease-out"
                    onClick={handleEditClick}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Edit className="h-4 w-4 mr-2" />
                    )}
                    {isUploading
                      ? "Saving..."
                      : isEditing
                        ? "Save Photo"
                        : "Edit Photo"}
                  </Button>

                  {isEditing && (
                    <Button
                      variant="destructive"
                      onClick={handleCancel}
                      disabled={isUploading}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-1">
                      {currentUser.fullName}
                    </h1>
                    <p className="text-lg text-muted-foreground">
                      @{currentUser.username}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    asChild
                    className="transition-all duration-300 ease-out"
                  >
                    <Link to="/settings">
                      <Settings className="h-4 w-4 mr-2 " />
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

                <div className="flex flex-wrap gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {myPosts.length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Posts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {myReposts.length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Reposts</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Featured Achievements ({equipped.length}/3)
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="transition-all duration-300 ease-out"
                  asChild
                >
                  <Link to="/achievements">View All</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="transition-all duration-300 ease-out"
                  onClick={() =>
                    setIsEditingAchievements(!isEditingAchievements)
                  }
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
                  Drag achievements from your unlocked list to display them (max
                  3):
                </p>

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
                                <span className="text-2xl">
                                  {slotAchievement.icon}
                                </span>
                                <span className="font-medium text-sm truncate">
                                  {slotAchievement.name}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 transition-all duration-300 ease-out"
                                onClick={() =>
                                  handleUnequip(slotAchievement.achievementId)
                                }
                                disabled={unequipMutation.isPending}
                              >
                                {unequipMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {slotAchievement.description}
                            </p>
                            <Badge variant="secondary" className="mt-2 text-xs">
                              {tierIcons[slotAchievement.tier]}{" "}
                              {slotAchievement.tier}
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

                <div>
                  <h4 className="font-medium mb-3">
                    Your Unlocked Achievements ({unlockedAchievements.length}):
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                    {unlockedAchievements.map((achievement) => {
                      const isEquipped = equipped.some(
                        (e) => e.achievementId === achievement.achievementId,
                      );
                      return (
                        <div
                          key={achievement.achievementId}
                          draggable={!isEquipped}
                          onDragStart={(e) =>
                            !isEquipped &&
                            handleAchievementDragStart(e, achievement)
                          }
                          onDragEnd={handleAchievementDragEnd}
                          className={`flex items-center gap-3 p-3 border rounded-lg transition-all ${
                            isEquipped
                              ? "opacity-50 bg-muted cursor-not-allowed"
                              : "bg-background hover:bg-accent cursor-move hover:shadow-md"
                          }`}
                        >
                          {!isEquipped && (
                            <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className="text-2xl flex-shrink-0">
                            {achievement.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {achievement.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {achievement.description}
                            </p>
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
                              onClick={() =>
                                handleEquip(achievement.achievementId)
                              }
                              disabled={equipMutation.isPending}
                              className="flex-shrink-0 transition-all duration-300 ease-out"
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
                      Complete challenges and track your carbon footprint to
                      unlock achievements!
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                {equippedAchievements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {equippedAchievements.map((achievement) => (
                      <div
                        key={achievement.achievementId}
                        className="flex items-center gap-3 p-4 bg-accent/50 rounded-lg"
                      >
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <span className="text-3xl">{achievement.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {achievement.name}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {achievement.description}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {tierIcons[achievement.tier]}
                            </Badge>
                            <p className="text-xs text-success font-medium">
                              {achievement.unlockedAt &&
                                `Earned ${formatDate(achievement.unlockedAt)}`}
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
                      className="transition-all duration-300 ease-out"
                    >
                      {unlockedAchievements.length > 0
                        ? "Equip Achievements"
                        : "Unlock Achievements First"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="reposts">Reposts</TabsTrigger>
            <TabsTrigger value="history">Track History</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-6 mt-6">
            {loading && (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              </div>
            )}
            {!loading && myPosts.length === 0 && (
              <p className="text-center text-muted-foreground py-12">
                No posts yet
              </p>
            )}
            {myPosts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUserId={userId}
                isFollowing={false}
                onLike={async (id) => {
                  const updated = await likePost(id);
                  updated &&
                    setPosts((prev) =>
                      prev.map((p) => (p._id === id ? updated : p)),
                    );
                  updated &&
                    setReposts((prev) =>
                      prev.map((p) => (p._id === id ? updated : p)),
                    );
                }}
                onRepost={async (id) => {
                  const updated = await repostPost(id);
                  updated &&
                    setPosts((prev) =>
                      prev.map((p) => (p._id === id ? updated : p)),
                    );
                  updated &&
                    setReposts((prev) =>
                      prev.map((p) => (p._id === id ? updated : p)),
                    );
                }}
                onShare={async (id) => {
                  const updated = await sharePost(id);
                  updated &&
                    setPosts((prev) =>
                      prev.map((p) => (p._id === id ? updated : p)),
                    );
                }}
                onComment={async (id, content) => {
                  const updated = await commentOnPost(id, content);
                  updated &&
                    setPosts((prev) =>
                      prev.map((p) => (p._id === id ? updated : p)),
                    );
                }}
                onDeletePost={async (id) => {
                  await deletePost(id);
                  setPosts((prev) => prev.filter((p) => p._id !== id));
                  setReposts((prev) => prev.filter((p) => p._id !== id));
                  toast({ title: "Post deleted" });
                }}
                onDeleteComment={async (postId, commentId) => {
                  await deleteComment(postId, commentId);
                }}
                onToggleFollow={undefined}
                onUpdatePost={(updated) => {
                  setPosts((prev) =>
                    prev.map((p) => (p._id === updated._id ? updated : p)),
                  );
                  setReposts((prev) =>
                    prev.map((p) => (p._id === updated._id ? updated : p)),
                  );
                }}
              />
            ))}

            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="text-sm text-primary hover:underline"
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reposts" className="space-y-6 mt-6">
            {loading && (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              </div>
            )}
            {!loading && myReposts.length === 0 && (
              <p className="text-center text-muted-foreground py-12">
                No reposts yet
              </p>
            )}
            {myReposts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUserId={userId}
                isFollowing={false}
                onLike={async (id) => {
                  const updated = await likePost(id);
                  updated &&
                    setReposts((prev) =>
                      prev.map((p) => (p._id === id ? updated : p)),
                    );
                }}
                onRepost={async (id) => {
                  const updated = await repostPost(id);
                  updated &&
                    setReposts((prev) =>
                      prev.map((p) => (p._id === id ? updated : p)),
                    );
                }}
                onShare={async (id) => {
                  const updated = await sharePost(id);
                  updated &&
                    setReposts((prev) =>
                      prev.map((p) => (p._id === id ? updated : p)),
                    );
                }}
                onComment={async (id, content) => {
                  const updated = await commentOnPost(id, content);
                  updated &&
                    setReposts((prev) =>
                      prev.map((p) => (p._id === id ? updated : p)),
                    );
                }}
                onDeletePost={async () => {}} // can't delete others' posts
                onDeleteComment={async () => {}}
                onToggleFollow={undefined}
                onUpdatePost={(updated) => {
                  setReposts((prev) =>
                    prev.map((p) => (p._id === updated._id ? updated : p)),
                  );
                }}
              />
            ))}

            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="text-sm text-primary hover:underline"
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-6">
            <UserTrackHistory />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
