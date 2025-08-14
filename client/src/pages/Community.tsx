import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Navbar } from "@/components/Navbar";
import { Heart, MessageCircle, Repeat2, Share, Camera, Users, Leaf } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  reposts: number;
  timestamp: string;
  isLiked: boolean;
  isReposted: boolean;
}

const Community = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!loggedIn) {
      navigate("/");
      return;
    }
    setIsLoggedIn(true);
    
    // Initialize with some sample posts
    const samplePosts: Post[] = [
      {
        id: "1",
        author: {
          name: "Sarah Green",
          username: "@sarah_eco",
          avatar: "/placeholder.svg"
        },
        content: "Just switched to a plant-based diet this week! Already feeling more energized and knowing I'm reducing my carbon footprint by 0.8 tons per year feels amazing. 🌱 #PlantBased #EcoLiving",
        likes: 24,
        comments: 8,
        reposts: 3,
        timestamp: "2 hours ago",
        isLiked: false,
        isReposted: false
      },
      {
        id: "2",
        author: {
          name: "Mike Chen",
          username: "@mike_sustain",
          avatar: "/placeholder.svg"
        },
        content: "Cycled to work all week instead of driving! 50km total distance and saved about 12kg of CO₂. Small changes, big impact! 🚴‍♂️",
        likes: 31,
        comments: 12,
        reposts: 7,
        timestamp: "4 hours ago",
        isLiked: true,
        isReposted: false
      },
      {
        id: "3",
        author: {
          name: "Eco Warriors",
          username: "@ecowarriors",
          avatar: "/placeholder.svg"
        },
        content: "Did you know that reducing food waste by just 25% can cut your household carbon footprint by 1-2%? Every bit counts! Start meal planning today 📝✨",
        likes: 56,
        comments: 15,
        reposts: 23,
        timestamp: "6 hours ago",
        isLiked: false,
        isReposted: true
      }
    ];
    
    setPosts(samplePosts);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handlePost = () => {
    if (!postContent.trim()) {
      toast({
        title: "Empty post",
        description: "Please write something before posting!",
        variant: "destructive"
      });
      return;
    }

    const newPost: Post = {
      id: Date.now().toString(),
      author: {
        name: localStorage.getItem("userName") || "You",
        username: "@" + (localStorage.getItem("userName") || "you").toLowerCase().replace(" ", "_"),
        avatar: "/placeholder.svg"
      },
      content: postContent,
      likes: 0,
      comments: 0,
      reposts: 0,
      timestamp: "now",
      isLiked: false,
      isReposted: false
    };

    setPosts([newPost, ...posts]);
    setPostContent("");
    
    toast({
      title: "Post shared!",
      description: "Your eco journey has been shared with the community."
    });
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
        : post
    ));
  };

  const handleRepost = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isReposted: !post.isReposted,
            reposts: post.isReposted ? post.reposts - 1 : post.reposts + 1
          }
        : post
    ));
    
    const post = posts.find(p => p.id === postId);
    if (post && !post.isReposted) {
      toast({
        title: "Reposted!",
        description: "You've shared this eco-tip with your followers."
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            EcoStep Community
          </h1>
          <p className="text-muted-foreground">
            Share your eco-friendly journey and inspire others to make a positive impact
          </p>
        </div>

        {/* Create Post Card */}
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
            
            <div className="flex justify-between items-center">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Camera className="h-4 w-4 mr-2" />
                Add Photo
              </Button>
              
              <Button onClick={handlePost} disabled={!postContent.trim()}>
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
            posts.map((post) => (
              <Card key={post.id} className="shadow-card border-border hover:shadow-elevated transition-smooth">
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
                        <span className="text-sm text-muted-foreground">{post.timestamp}</span>
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
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-2 ${post.isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
                    >
                      <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                      <span>{post.likes}</span>
                    </Button>

                    <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-muted-foreground">
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.comments}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRepost(post.id)}
                      className={`flex items-center space-x-2 ${post.isReposted ? 'text-green-500' : 'text-muted-foreground'}`}
                    >
                      <Repeat2 className="h-4 w-4" />
                      <span>{post.reposts}</span>
                    </Button>

                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <Share className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Community;