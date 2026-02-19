import { useEffect, useRef, useState } from "react";
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
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Bell,
  Shield,
  Palette,
  Camera,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProfile,
  updateProfile,
  getUserSettings,
  updateUserSettings,
} from "../lib/api";
import { Spinner } from "@/components/ui/spinner";
import useSessionStatus from "../hooks/useSessionStatus";
import useSignOut from "../hooks/useLogout";
import useAuth from "../hooks/useAuth";
import { subscribeToPush } from "@/config/pushNotifications";

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
  const { user } = useAuth() as { user: { _id?: string } };
  const userId = user?._id;

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState({
    fullName: "",
    firstName: "",
    lastName: "",
    username: "",
    bio: "",
    profilePic: "",
    address: "",
    birthday: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [notifications, setNotifications] = useState<null | {
    emailNotifications: boolean;
    pushNotifications: boolean;
    communityUpdates: boolean;
    carbonReminder: boolean;
  }>(null);

  const [privacy, setPrivacy] = useState({
    profileVisibility: "public",
    showEmail: false,
    showLocation: true,
  });

  const [theme, setTheme] = useState(
    localStorage.getItem("darkMode") === "true" ? "dark" : "light",
  );

  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { isPending, isLoggedIn } = useSessionStatus();
  const { signOut } = useSignOut();

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First Name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last Name is required";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username =
        "Username can only contain letters, numbers, and underscores";
    }

    if (formData.birthday) {
      const birthdayRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;

      if (!birthdayRegex.test(formData.birthday)) {
        newErrors.birthday = "Birthday must be in mm/dd/yyyy format";
      } else {
        const [month, day, year] = formData.birthday.split("/").map(Number);
        const date = new Date(year, month - 1, day);

        if (
          date.getFullYear() !== year ||
          date.getMonth() !== month - 1 ||
          date.getDate() !== day
        ) {
          newErrors.birthday = "Invalid date";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { mutate: updateDataProfile, isPending: isUpdating } = useMutation({
    mutationFn: async (data: typeof formData) => {
      const formDataToSend = new FormData();

      formDataToSend.append("firstName", data.firstName);
      formDataToSend.append("lastName", data.lastName);
      formDataToSend.append("username", data.username);
      formDataToSend.append("bio", data.bio);
      formDataToSend.append("address", data.address);
      formDataToSend.append("birthday", data.birthday);

      if (selectedFile) {
        formDataToSend.append("profilePic", selectedFile);
      }

      return updateProfile(formDataToSend);
    },
    onSuccess: () => {
      setSelectedFile(null);
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
        description:
          error?.message || "Could not update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery<ProfileType>({
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
        profilePic: profile.profilePic,
        bio: profile.bio,
        address: profile.address,
        birthday: formatDate(profile.birthday),
      });
    }
  }, [profile]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!userId) return;

        const settings = await getUserSettings(userId);

        setNotifications({
          emailNotifications: settings.emailNotification,
          pushNotifications: settings.pushNotification,
          communityUpdates: settings.communityUpdates,
          carbonReminder: settings.carbonReminder,
        });
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };

    fetchNotifications();
  }, [userId]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const resetFormData = () => {
    if (profile) {
      setFormData({
        fullName: `${profile.firstName} ${profile.lastName}`,
        firstName: profile.firstName,
        lastName: profile.lastName,
        username: profile.username,
        profilePic: profile.profilePic,
        bio: profile.bio,
        address: profile.address,
        birthday: profile.birthday,
      });
      setSelectedFile(null);
      setErrors({});
      setIsEditing(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only JPG, PNG and GIF are allowed.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = (e) => {
      if (e.target?.result) {
        setFormData((prev) => ({
          ...prev,
          profilePic: e.target.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleButtonClick = () => {
    if (isEditing) {
      if (!validateForm()) {
        toast({
          title: "Validation error",
          description: "Please fix the errors before saving.",
          variant: "destructive",
        });
        return;
      }
      updateDataProfile(formData);
    } else {
      setIsEditing(true);
    }
  };

  const handleToggle = async (key, value) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);

    const payloadMap = {
      emailNotifications: "emailNotification",
      pushNotifications: "pushNotification",
      communityUpdates: "communityUpdates",
      carbonReminder: "carbonReminder",
    };

    try {
      await updateUserSettings(userId, {
        [payloadMap[key]]: value,
      });
    } catch (err) {
      console.error("Failed to update setting:", err);
    }
  };

  const handlePushToggle = async (checked: boolean) => {
    setNotifications((prev) => ({
      ...prev,
      pushNotifications: checked,
    }));

    try {
      await updateUserSettings(userId, { pushNotification: checked });

      if (checked) {
        const success = await subscribeToPush(userId);
        if (!success) {
          toast({
            title: "Push setup failed",
            description: "Could not enable push notifications.",
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      console.error("Failed to update push setting:", err);
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
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
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

  if (isLoading) return <Spinner />;

  if (error) {
    toast({
      title: "Failed to load profile",
      description: "Please try again later.",
      variant: "destructive",
    });
    return <p>Error loading profile.</p>;
  }

  const handleSignOut = () => {
    signOut();
  };

  if (isPending) {
    return <Spinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleSignOut} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={formData.profilePic || profile?.profilePic}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {formData.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                    <Button variant="outline" onClick={handleClick}>
                      <Camera className="h-4 w-4 mr-2" />
                      {selectedFile ? "Photo Selected" : "Change Photo"}
                    </Button>
                    {selectedFile && (
                      <p className="text-sm text-green-600 mt-2">
                        {selectedFile.name} (
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">
                      JPG, PNG or GIF. Max size of 5MB.
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    readOnly={!isEditing}
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    placeholder="Enter your First Name"
                    className={`${errors.firstName ? "border-red-600" : ""} ${!isEditing ? "border-none focus:outline-none cursor-default bg-transparent" : "border border-gray-300 focus:outline-blue-500 cursor-text bg-white"}`}
                  />
                  {errors.firstName && (
                    <p className="text-red-600 text-sm">{errors.firstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    readOnly={!isEditing}
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    placeholder="Enter your Last Name"
                    className={`${errors.lastName ? "border-red-600" : ""} ${!isEditing ? "border-none focus:outline-none cursor-default bg-transparent" : "border border-gray-300 focus:outline-blue-500 cursor-text bg-white"}`}
                  />
                  {errors.lastName && (
                    <p className="text-red-600 text-sm">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  readOnly={!isEditing}
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="Enter your username"
                  className={`${errors.username ? "border-red-600" : ""} ${!isEditing ? "border-none focus:outline-none cursor-default bg-transparent" : "border border-gray-300 focus:outline-blue-500 cursor-text bg-white"}`}
                />
                {errors.username && (
                  <p className="text-red-600 text-sm">{errors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  readOnly={!isEditing}
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Tell us about yourself"
                  className={`${errors.bio ? "border-red-600" : ""} ${!isEditing ? "border-none focus:outline-none cursor-default bg-transparent" : "border border-gray-300 focus:outline-blue-500 cursor-text bg-white"}`}
                />
                {errors.bio && (
                  <p className="text-red-600 text-sm">{errors.bio}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    readOnly={!isEditing}
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Enter your Address"
                    className={`${errors.address ? "border-red-600" : ""} ${!isEditing ? "border-none focus:outline-none cursor-default bg-transparent" : "border border-gray-300 focus:outline-blue-500 cursor-text bg-white"}`}
                  />
                  {errors.address && (
                    <p className="text-red-600 text-sm">{errors.address}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthday">Birthday</Label>
                  <Input
                    id="birthday"
                    readOnly={!isEditing}
                    value={formData.birthday}
                    onChange={(e) =>
                      setFormData({ ...formData, birthday: e.target.value })
                    }
                    placeholder="Enter your Birthday"
                    className={`${!isEditing ? "border-none focus:outline-none cursor-default bg-transparent" : "border border-gray-300 focus:outline-blue-500 cursor-text bg-white"}`}
                  />
                  {errors.birthday && (
                    <p className="text-red-600 text-sm">{errors.birthday}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center space-x-2">
                <Button
                  variant="outline"
                  className="transition-all duration-300 ease-out"
                  asChild
                >
                  <Link to="/profile">View Profile</Link>
                </Button>

                <div className="flex space-x-2">
                  {isEditing && (
                    <Button
                      variant="ghost"
                      className="transition-all duration-300 ease-out"
                      onClick={resetFormData}
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    onClick={handleButtonClick}
                    disabled={isUpdating}
                    variant={isEditing ? "hero" : "secondary"}
                  >
                    {isEditing
                      ? isUpdating
                        ? "Saving..."
                        : "Save Changes"
                      : "Edit Profile"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

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

          {!notifications ? (
            <Spinner />
          ) : (
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
                      handleToggle("emailNotifications", checked)
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
                    onCheckedChange={handlePushToggle}
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
                      handleToggle("communityUpdates", checked)
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
                    checked={notifications.carbonReminder}
                    onCheckedChange={(checked) =>
                      handleToggle("carbonReminder", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* <div className="space-y-2">
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
              </div> */}

              {/* <div className="flex items-center justify-between">
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
              </div> */}

              {/* <div className="flex items-center justify-between">
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
              </div> */}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sessions</Label>
                  <p className="text-sm text-muted-foreground">
                    See your previous and current sessions.
                  </p>
                </div>
                <Button
                  variant="default"
                  asChild
                  className="transition-all duration-300 ease-out"
                >
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
