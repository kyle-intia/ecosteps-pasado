import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Navbar } from "@/components/Navbar";
import { 
        Heart, 
        MessageCircle, 
        Repeat2, 
        Camera, 
        Users, 
        Leaf, 
        X, 
        Send, 
        Edit,
        MoreVertical, 
        Trash2 
      } from "lucide-react";
import { 
        DropdownMenu, 
        DropdownMenuContent, 
        DropdownMenuItem, 
        DropdownMenuTrigger
      } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import useAuth from "@/hooks/useAuth";
import axios from "axios";

interface User {
  id: string;
  name: string;
  email: string;
  score?: number;
  badges?: string[];
  activity?: number;
  posts?: number;
}

interface Post {
  _id: string;
  author: {
    userId: string;
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  reposts: number;
  createdAt: string;
  likedBy: string[];
  repostedBy: string[];
}

interface Comment {
  _id: string;
  postId: string;
  author: {
    userId: string;
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
}

const Community = () => {
  console.log("Community component loading...");
  console.log("API URL:", import.meta.env.VITE_API_URL);
  console.log("VITE_USE_AUTH:", import.meta.env.VITE_USE_AUTH);
  console.log("localStorage isLoggedIn:", localStorage.getItem("isLoggedIn"));
  console.log("localStorage userName:", localStorage.getItem("userName"));
  
  const { user, isLoading, error } = useAuth() as { 
    user: User | null, 
    isLoading: boolean, 
    error: any 
  };
  
  console.log("useAuth result:", { user, isLoading, error });
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({});
  const [commentContent, setCommentContent] = useState<{ [postId: string]: string }>({});
  const [showComments, setShowComments] = useState<{ [postId: string]: boolean }>({});
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simple function - gets ID from database in production, fallback in development
  const getCurrentUserId = () => {
    const useAuthFlag = import.meta.env.VITE_USE_AUTH === 'true';
    
    if (!useAuthFlag) {
      // Dev/default user id
      return import.meta.env.VITE_DEFAULT_USER_ID || "6744176ad35a5b47b4fb21fe";
    } else {
      // Prod/database via useAuth
      if (user?.id) {
        return user.id;
      }
      return null;
    }
  };

  // get current user info
  const getCurrentUserInfo = () => {
    const useAuthFlag = import.meta.env.VITE_USE_AUTH === 'true';
    
    if (!useAuthFlag) {
      // dev: localStorage data
      const userName = localStorage.getItem("userName") || "Test User";
      return {
        id: getCurrentUserId(),
        name: userName,
        username: "@" + userName.toLowerCase().replace(/\s+/g, "_"),
        avatar: "/placeholder.svg"
      };
    } else {
      // prod: database
      if (!user) {
        return null;
      }
      
      return {
        id: user.id,
        name: user.name,
        username: "@" + user.name.toLowerCase().replace(/\s+/g, "_"),
        avatar: "/placeholder.svg"
      };
    }
  };

  useEffect(() => {
    console.log("🔥 Community useEffect triggered");
    console.log("useAuth values:", { user, isLoading, error });
    console.log("Environment VITE_USE_AUTH:", import.meta.env.VITE_USE_AUTH);
    console.log("localStorage isLoggedIn:", localStorage.getItem("isLoggedIn"));
    
    // Check if authentication is enabled
    const useAuthFlag = import.meta.env.VITE_USE_AUTH === 'true';
    console.log("useAuthFlag:", useAuthFlag);
    
    if (!useAuthFlag) {
      // Dev: check localStorage for basic auth
      const loggedIn = localStorage.getItem("isLoggedIn") === "true";
      console.log("Development mode - loggedIn:", loggedIn);
      
      if (!loggedIn) {
        console.log("❌ Not logged in, redirecting to home");
        // temporarily set to true
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userName", "Test User");
        console.log("🔧 Set temporary login for debugging");
        setIsLoggedIn(true);
        fetchPosts();
        return;
      }
      console.log("✅ Logged in, setting up community page");
      setIsLoggedIn(true);
      fetchPosts();
    } else {
      // Prod: JWT authentication
      console.log("Production mode - useAuth check");
      if (error || (!isLoading && !user)) {
        console.error("Authentication error:", error);
        console.log("Redirecting due to auth failure");
        navigate("/");
        return;
      }
      
      if (user) {
        console.log("User found, setting up community page");
        setIsLoggedIn(true);
        fetchPosts();
      }
    }
  }, [navigate]); // Temporarily remove user, isLoading, error dependencies

  const fetchPosts = async () => {
    console.log("📡 Fetching posts from:", `${import.meta.env.VITE_API_URL}/api/community/posts`);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/community/posts`);
      console.log("✅ Posts fetched successfully:", response.data);
      setPosts(response.data);
    } catch (error) {
      console.error('❌ Error fetching posts:', error);
      
      // mock data if server is not running
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        console.log("🔧 Server not running, using mock data for development");
        const mockPosts = [
          {
            _id: "mock-1",
            author: {
              userId: "mock-user",
              name: "Test User",
              username: "@test_user",
              avatar: "/placeholder.svg"
            },
            content: "This is a test post for development!",
            likes: 5,
            comments: 2,
            reposts: 1,
            createdAt: new Date().toISOString(),
            likedBy: [],
            repostedBy: []
          }
        ];
        setPosts(mockPosts);
        toast({
          title: "Development Mode",
          description: "Using mock data - backend server not running.",
          variant: "default"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load posts. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (1024 * 1024 bytes)
      const maxSize = 1024 * 1024; // 1MB
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Please select an image less than 1MB.",
          variant: "destructive"
        });
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePost = async () => {
    const userInfo = getCurrentUserInfo();
    if (!userInfo) {
      toast({
        title: "Authentication required",
        description: "Please log in to post.",
        variant: "destructive"
      });
      return;
    }

    if (!postContent.trim()) {
      toast({
        title: "Empty post",
        description: "Please write something before posting!",
        variant: "destructive"
      });
      return;
    }

    try {
      const postData = {
        content: postContent,
        image: selectedImage,
        authorId: userInfo.id,
        authorName: userInfo.name,
        authorUsername: userInfo.username,
        authorAvatar: userInfo.avatar
      };

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/community/posts`, postData);
      
      // Add new post to the beginning of the posts array
      setPosts([response.data, ...posts]);
      setPostContent("");
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: "Post shared!",
        description: "Your eco journey has been shared with the community."
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to share your post. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleLike = async (postId: string) => {
    const userId = getCurrentUserId();
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please log in to like posts.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/community/posts/${postId}/like`, {
        userId
      });

      // Update the post in the local state
      setPosts(posts.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              likes: response.data.likes,
              likedBy: response.data.isLiked 
                ? [...post.likedBy, userId]
                : post.likedBy.filter(id => id !== userId)
            }
          : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
      toast({
        title: "Error",
        description: "Failed to like post. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRepost = async (postId: string) => {
    const userId = getCurrentUserId();
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please log in to repost.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/community/posts/${postId}/repost`, {
        userId
      });

      const post = posts.find(p => p._id === postId);
      const wasReposted = post?.repostedBy.includes(userId);

      // Update the post in the local state
      setPosts(posts.map(p => 
        p._id === postId 
          ? { 
              ...p, 
              reposts: response.data.reposts,
              repostedBy: response.data.isReposted 
                ? [...p.repostedBy, userId]
                : p.repostedBy.filter(id => id !== userId)
            }
          : p
      ));
      
      if (!wasReposted) {
        toast({
          title: "Reposted!",
          description: `You've shared ${post?.author.name}'s eco-journey with your followers.`
        });
      }
    } catch (error) {
      console.error('Error reposting:', error);
      toast({
        title: "Error",
        description: "Failed to repost. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMilliseconds = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  // get comments
  const fetchComments = async (postId: string) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/community/posts/${postId}/comments`);
      setComments(prev => ({ ...prev, [postId]: response.data }));
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleComments = async (postId: string) => {
    const isCurrentlyShown = showComments[postId];
    setShowComments(prev => ({ ...prev, [postId]: !isCurrentlyShown }));
    
    if (!isCurrentlyShown && !comments[postId]) {
      await fetchComments(postId);
    }
  };

  const handleAddComment = async (postId: string) => {
    const content = commentContent[postId]?.trim();
    if (!content) {
      toast({
        title: "Empty comment",
        description: "Please write something before commenting!",
        variant: "destructive"
      });
      return;
    }

    const userInfo = getCurrentUserInfo();
    if (!userInfo) {
      toast({
        title: "Authentication required",
        description: "Please log in to comment.",
        variant: "destructive"
      });
      return;
    }

    try {
      const commentData = {
        content,
        authorId: userInfo.id,
        authorName: userInfo.name,
        authorUsername: userInfo.username,
        authorAvatar: userInfo.avatar
      };

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/community/posts/${postId}/comments`, commentData);
      
      // Add new comment to local state
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), response.data]
      }));
      
      // Update post comment count
      setPosts(posts.map(post => 
        post._id === postId 
          ? { ...post, comments: post.comments + 1 }
          : post
      ));
      
      // Clear comment input
      setCommentContent(prev => ({ ...prev, [postId]: "" }));
      
      toast({
        title: "Comment added!",
        description: "Your comment has been posted."
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditComment = async (commentId: string, postId: string) => {
    if (!editCommentContent.trim()) {
      toast({
        title: "Empty comment",
        description: "Please write something before saving!",
        variant: "destructive"
      });
      return;
    }

    const userId = getCurrentUserId();
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please log in to edit comments.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/community/comments/${commentId}`, {
        content: editCommentContent,
        userId
      });
      
      // Update comment in local state
      setComments(prev => ({
        ...prev,
        [postId]: prev[postId].map(comment => 
          comment._id === commentId ? response.data : comment
        )
      }));
      
      setEditingComment(null);
      setEditCommentContent("");
      
      toast({
        title: "Comment updated!",
        description: "Your comment has been edited."
      });
    } catch (error) {
      console.error('Error editing comment:', error);
      toast({
        title: "Error",
        description: "Failed to edit comment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    const userId = getCurrentUserId();
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please log in to delete comments.",
        variant: "destructive"
      });
      return;
    }

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/community/comments/${commentId}`, {
        data: { userId }
      });
      
      // Remove comment from local state
      setComments(prev => ({
        ...prev,
        [postId]: prev[postId].filter(comment => comment._id !== commentId)
      }));
      
      // Update post comment count
      setPosts(posts.map(post => 
        post._id === postId 
          ? { ...post, comments: Math.max(0, post.comments - 1) }
          : post
      ));
      
      toast({
        title: "Comment deleted!",
        description: "Your comment has been removed."
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const startEditComment = (commentId: string, currentContent: string) => {
    setEditingComment(commentId);
    setEditCommentContent(currentContent);
  };
//==================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading community posts...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            EcoSteps Community
          </h1>
          <p className="text-muted-foreground">
            Share your eco-friendly journey and inspire others to make a positive impact
          </p>
        </div>

        {/* Post Section / create */}
        <Card className="shadow-card border-border mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-success" />
              Share Your Eco Journey
            </CardTitle>
            <CardDescription>
              What eco-friendly action did you take today?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="What eco-friendly action did you take today?"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            
            {/* Image Preview */}
            {selectedImage && (
              <div className="relative">
                <img 
                  src={selectedImage} 
                  alt="Upload preview" 
                  className="max-w-full h-48 object-cover rounded-lg border"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-black/50 hover:text-muted-foreground transition-all duration-300 ease-out text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-muted-foreground transition-all duration-300 ease-out"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Add Photo
                </Button>
              </div>
              
              <Button 
                onClick={handlePost} 
                disabled={!postContent.trim()} 
                className="transition-all duration-300 ease-out"
              >
                + Share Post
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <Card className="shadow-card border-border">
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No posts yet</h3>
                <p className="text-muted-foreground">
                  Be the first to share your eco-friendly journey with the community!
                </p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => {
              const currentUserId = getCurrentUserId();
              const isLiked = currentUserId ? post.likedBy.includes(currentUserId) : false;
              const isReposted = currentUserId ? post.repostedBy.includes(currentUserId) : false;
              
              return (
                <Card key={post._id} className="shadow-card border-border hover:shadow-elevated transition-all duration-300 ease-out">
                  <CardContent className="p-6">
                    {/* Post Header */}
                    <div className="flex items-center space-x-3 mb-4">
                      <Avatar>
                        <AvatarImage src={post.author.avatar} alt={post.author.name} />
                        <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-foreground">{post.author.name}</h4>
                          <span className="text-sm text-muted-foreground">{post.author.username}</span>
                          <span className="text-sm text-muted-foreground">·</span>
                          <span className="text-sm text-muted-foreground">{formatTimestamp(post.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
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

                    {/* Post Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(post._id)}
                        className={`flex items-center space-x-2 transition-all duration-300 ease-out ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
                      > {/* Heart */}
                        <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                        <span>{post.likes}</span>
                      </Button>
                      {/* Comment */}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleComments(post._id)}
                        className={`flex items-center space-x-2 transition-all duration-300 ease-out ${
                          showComments[post._id] ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      >
                        <MessageCircle className={`h-4 w-4 transition-transform duration-300 ${
                          showComments[post._id] ? 'rotate-12 scale-110' : 'rotate-0 scale-100'
                        }`} />
                        <span>{post.comments}</span>
                      </Button>
                      {/* Repost */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRepost(post._id)}
                        className={`flex items-center space-x-2 transition-all duration-300 ease-out ${isReposted ? 'text-green-500' : 'text-muted-foreground'}`}
                      >
                        <Repeat2 className="h-4 w-4" />
                        <span>{post.reposts}</span>
                      </Button>
                    </div>

                    {/* Comments Section */}
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        showComments[post._id] 
                          ? 'max-h-[2000px] opacity-100' 
                          : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="mt-4 pt-4 border-t border-border">
                        {/* Comment Input */}
                        <div className="flex space-x-3 mb-4">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder.svg" alt="You" />
                            <AvatarFallback>{(localStorage.getItem("userName") || "U").charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 flex space-x-2">
                            <Textarea
                              placeholder="Write a comment..."
                              value={commentContent[post._id] || ""}
                              onChange={(e) => setCommentContent(prev => ({ ...prev, [post._id]: e.target.value }))}
                              className="min-h-[60px] resize-none text-sm"
                            />
                            <Button 
                              size="sm"
                              onClick={() => handleAddComment(post._id)}
                              disabled={!commentContent[post._id]?.trim()}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-3">
                          {comments[post._id]?.map((comment) => {
                            const currentUserId = getCurrentUserId();
                            const isOwnComment = currentUserId ? comment.author.userId === currentUserId : false;
                            
                            return (
                              <div key={comment._id} className="flex space-x-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
                                  <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="bg-muted rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center space-x-2">
                                        <span className="font-semibold text-sm">{comment.author.name}</span>
                                        <span className="text-xs text-muted-foreground">{comment.author.username}</span>
                                        <span className="text-xs text-muted-foreground">·</span>
                                        <span className="text-xs text-muted-foreground">
                                          {formatTimestamp(comment.createdAt)}
                                          {comment.isEdited && " (edited)"}
                                        </span>
                                      </div>
                                      {isOwnComment && (
                                        // <div className="flex space-x-1">
                                        //   <Button
                                        //     variant="ghost"
                                        //     size="sm"
                                        //     onClick={() => startEditComment(comment._id, comment.content)}
                                        //     className="h-6 w-6 p-0"
                                        //   >
                                        //     <Edit className="h-3 w-3" />
                                        //   </Button>
                                        //   <Button
                                        //     variant="ghost"
                                        //     size="sm"
                                        //     onClick={() => handleDeleteComment(comment._id, post._id)}
                                        //     className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                        //   >
                                        //     <Trash2 className="h-3 w-3" />
                                        //   </Button>
                                        // </div>
                                        <div className="flex space-x-1">
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button 
                                                variant="ghost" 
                                                size="icon"
                                                className='flex items-center space-x-2 transition-all duration-300 ease-out '> {/* hover:bg-transparent hover:text-green-500*/}
                                                
                                                <MoreVertical className="h-4 w-4 " />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                              <DropdownMenuItem onClick={() => startEditComment(comment._id, comment.content)}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit Comment
                                              </DropdownMenuItem>
                                              <DropdownMenuItem 
                                               onClick={() => handleDeleteComment(comment._id, post._id)}
                                                className="text-destructive focus:text-destructive"
                                              >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete Comment
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {editingComment === comment._id ? (
                                      <div className="flex space-x-2 mt-2">
                                        <Textarea
                                          value={editCommentContent}
                                          onChange={(e) => setEditCommentContent(e.target.value)}
                                          className="min-h-[60px] resize-none text-sm"
                                        />
                                        <div className="flex flex-col space-y-1">
                                          <Button 
                                            size="sm"
                                            onClick={() => handleEditComment(comment._id, post._id)}
                                            disabled={!editCommentContent.trim()}
                                          >
                                            Save
                                          </Button>
                                          <Button 
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setEditingComment(null);
                                              setEditCommentContent("");
                                            }}
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-foreground">{comment.content}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          
                          {comments[post._id]?.length === 0 && (
                            <p className="text-center text-muted-foreground text-sm py-4">
                              No comments yet. Be the first to comment!
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default Community;