import { useState } from "react";
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
  Globe
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Mock user data
const currentUser = {
  id: "current-user",
  username: "yourUsername",
  fullName: "Your Name",
  email: "your.email@example.com",
  bio: "Passionate about sustainable living and making a positive environmental impact. 🌱",
  location: "San Francisco, CA",
  website: "https://yourwebsite.com",
  avatarUrl: null,
  joinedDate: "March 2024",
  stats: {
    posts: 24,
    reposts: 8,
    followers: 156,
    following: 89,
    carbonSaved: "2.3 tons"
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

const Profile = () => {
  const [posts] = useState(mockPosts);
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn={true} />
      
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
                    <Globe className="h-4 w-4 mr-1" />
                    <a href={currentUser.website} className="text-primary hover:underline">
                      Website
                    </a>
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