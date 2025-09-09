import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Camera,
  Moon,
  Sun,
  Monitor
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProfile } from "../lib/api";
import { Spinner } from "@/components/ui/spinner";
import { updateProfile } from "../lib/api";
import { logout } from "@/lib/api";


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


const Settings = () => {

  const [formData, setFormData] = useState({
    fullName: "",
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    bio: "",
    address: "",
    birthday: ""
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    communityUpdates: true,
    carbonTracking: true
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: "public",
    showEmail: false,
    showLocation: true
  });

  const [theme, setTheme] = useState(
    localStorage.getItem("darkMode") === "true" ? "dark" : "light"
  );

  const [isEditing, setIsEditing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const month = d.toLocaleString('en-US', { month: 'short' }); 
    const day = String(d.getDate()).padStart(2, '0');     
    const year = d.getFullYear();                            
    return `${month}-${day}-${year}`;
  };

  const {
    mutate: updateDataProfile,
    isPending: isUpdating,
  } = useMutation({
    mutationFn: (data: typeof formData) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved successfully.",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error?.message || "Could not update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { data: profile, isLoading, error } = useQuery<ProfileType>({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: `${profile.firstName} ${profile.lastName}`,
        firstName: profile.firstName,
        lastName: profile.lastName,
        username: profile.username,
        email: localStorage.getItem("userEmail") || "",
        bio: profile.bio,
        address: profile.address,
        birthday: formatDate(profile.birthday),
      });
    }
  }, [profile]);

    
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
      if (!loggedIn) {
        navigate("/");
        return;
      }
      setIsLoggedIn(true);
  }, [navigate]);

  const handleButtonClick = () => {
    if (isEditing) {
      updateDataProfile(formData);
    } else {
      setIsEditing(true);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    } else {
      // System theme
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.removeItem("darkMode");
    }

    toast({
      title: "Theme updated",
      description: `Switched to ${newTheme} theme.`,
    });
  };

  const { mutate: signOut } = useMutation({
    mutationFn: logout,
    onSettled: () => {
      localStorage.clear();
      queryClient.clear(); 
      navigate("/login", { replace: true }); 
    },
  });

  if (isLoading) return <Spinner />;

  if (error) {
    toast({
      title: "Failed to load profile",
      description: "Please try again later.",
      variant: "destructive",
    });
    return <p>Error loading profile.</p>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn={isLoggedIn} onLogout={signOut} />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <div className="space-y-8">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Photo */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={`${profile.profilePic}`} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {formData.fullName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline">
                    <Camera className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    JPG, PNG or GIF. Max size of 5MB.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Profile Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    readOnly={!isEditing}
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="Enter your First Name"
                    className={`${!isEditing ? 'border-none focus:outline-none cursor-default bg-transparent' : 'border border-gray-300 focus:outline-blue-500 cursor-text bg-white'}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    readOnly={!isEditing}
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="Enter your Last Name"
                    className={`${!isEditing ? 'border-none focus:outline-none cursor-default bg-transparent' : 'border border-gray-300 focus:outline-blue-500 cursor-text bg-white'}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    readOnly={!isEditing}
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="Enter your username"
                    className={`${!isEditing ? 'border-none focus:outline-none cursor-default bg-transparent' : 'border border-gray-300 focus:outline-blue-500 cursor-text bg-white'}`}
                  />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  readOnly={!isEditing}
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  placeholder="Tell us about yourself"
                  className={`${!isEditing ? 'border-none focus:outline-none cursor-default bg-transparent' : 'border border-gray-300 focus:outline-blue-500 cursor-text bg-white'}`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    readOnly={!isEditing}
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Enter your Address"
                    className={`${!isEditing ? 'border-none focus:outline-none cursor-default bg-transparent' : 'border border-gray-300 focus:outline-blue-500 cursor-text bg-white'}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthday">Birthday</Label>
                  <Input
                    id="birthday"
                    readOnly={!isEditing}
                    value={formData.birthday}
                    onChange={(e) => setFormData({...formData, birthday: e.target.value})}
                    placeholder="Enter your Birthday"
                    className={`${!isEditing ? 'border-none focus:outline-none cursor-default bg-transparent' : 'border border-gray-300 focus:outline-blue-500 cursor-text bg-white'}`}
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link to="/profile">View Profile</Link>
                </Button>
                <Button onClick={handleButtonClick} disabled={isUpdating} variant={isEditing ? "hero" : "secondary"}>
                  {isEditing ? (isUpdating ? "Saving..." : "Save Changes") : "Edit Profile"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select value={theme} onValueChange={handleThemeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about your account
                  </p>
                </div>
                <Switch 
                  checked={notifications.emailNotifications}
                  onCheckedChange={(checked) => 
                    setNotifications({...notifications, emailNotifications: checked})
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications in your browser
                  </p>
                </div>
                <Switch 
                  checked={notifications.pushNotifications}
                  onCheckedChange={(checked) => 
                    setNotifications({...notifications, pushNotifications: checked})
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Community Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about new posts and interactions
                  </p>
                </div>
                <Switch 
                  checked={notifications.communityUpdates}
                  onCheckedChange={(checked) => 
                    setNotifications({...notifications, communityUpdates: checked})
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Carbon Tracking Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Reminders to update your carbon footprint
                  </p>
                </div>
                <Switch 
                  checked={notifications.carbonTracking}
                  onCheckedChange={(checked) => 
                    setNotifications({...notifications, carbonTracking: checked})
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Profile Visibility</Label>
                <Select 
                  value={privacy.profileVisibility} 
                  onValueChange={(value) => setPrivacy({...privacy, profileVisibility: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="friends">Friends Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Email Address</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your email on your public profile
                  </p>
                </div>
                <Switch 
                  checked={privacy.showEmail}
                  onCheckedChange={(checked) => 
                    setPrivacy({...privacy, showEmail: checked})
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Location</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your location on your public profile
                  </p>
                </div>
                <Switch 
                  checked={privacy.showLocation}
                  onCheckedChange={(checked) => 
                    setPrivacy({...privacy, showLocation: checked})
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sessions</Label>
                  <p className="text-sm text-muted-foreground">
                    See your previous and current sessions.
                  </p>
                </div>
                  <Button variant="default" asChild>
                    <Link to="/sessions">View Sessions</Link>
                  </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
    
  );
};

export default Settings;