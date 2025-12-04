// src/components/SettingsDropdown.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Settings,
  Moon,
  Sun,
  UserCircle,
  LogOut,
  Bell,
  Heart,
  Repeat2,
  UserPlus,
  MessageCircle,
  Share2,
  Trophy,
  Award,
  Sparkles,
  Gift,
  ContactRoundIcon,
  Contact,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { getAllNotification, markAsReadNotification } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useSocket } from "@/hooks/useSocket";
import { unstable_batchedUpdates } from "react-dom";

interface SettingsDropdownProps {
  onLogout: () => void;
}

export const SettingsDropdown = ({ onLogout }: SettingsDropdownProps) => {
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem("darkMode") === "true");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth() as { user: { _id?: string } };

  const currentUserId = user?._id?.toString();

  // Fetch & format notifications
  useEffect(() => {
    if (!user?._id) return;

    const fetchNotifications = async () => {
      try {
        const response = await getAllNotification();

        const filtered = response
          .filter((n: any) => n.userId.toString() === user._id.toString())
          .map((n: any) => ({
            id: n._id.toString(),
            message: n.message,
            type: n.type,
            createdAt: n.createdAt,
            isRead: n.isRead || false,
            link: n.link || null,
            action: n.data?.action || extractActionFromMessage(n.message),
          }))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setNotifications(filtered);
        setUnreadCount(filtered.filter(n => !n.isRead).length);
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    };

    fetchNotifications();
  }, [user?._id]);

  // Extract action from message if backend doesn't send `data.action`
  const extractActionFromMessage = (msg: string): string => {
    if (msg.includes("liked")) return "like";
    if (msg.includes("reposted")) return "repost";
    if (msg.includes("shared")) return "share";
    if (msg.includes("commented")) return "comment";
    if (msg.includes("following")) return "follow";
    if (msg.includes("achievement") || msg.includes("badge")) return "achievement";
    return "notification";
  };

  // Icon + color per action
  const getNotificationIcon = (action: string) => {
    switch (action) {
      case "like":
        return <Heart className="h-4.5 w-4.5 text-red-500 fill-red-500" />;
      case "repost":
        return <Repeat2 className="h-4.5 w-4.5 text-emerald-500" />;
      case "share":
        return <Share2 className="h-4.5 w-4.5 text-blue-500" />;
      case "comment":
        return <MessageCircle className="h-4.5 w-4.5 text-purple-500" />;
      case "follow":
        return <UserPlus className="h-4.5 w-4.5 text-indigo-500" />;
      case "achievement":
        return <Trophy className="h-4.5 w-4.5 text-yellow-500 fill-yellow-500" />;
      case "certificate":
        return <Award className="h-4.5 w-4.5 text-amber-600 fill-amber-600" />;
      case "reward":
        return <Gift className="h-4.5 w-4.5 text-pink-500 fill-pink-500" />;
      case "reward_claimed":
        return <Sparkles className="h-4.5 w-4.5 text-purple-600 fill-purple-600" />;
      default:
        return <Bell className="h-4.5 w-4.5 text-primary" />;
    }
  };

  // Handle click: mark read + navigate
  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      try {
        await markAsReadNotification(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(prev - 1, 0));
      } catch (err) { /* silent */ }
    }

    if (notif.link) {
      setNotificationOpen(false);
      navigate(notif.link);
      window.scrollTo(0, 0);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
    document.documentElement.classList.toggle("dark", newMode);

    toast({
      title: newMode ? "Dark Mode" : "Light Mode",
      description: `Theme switched to ${newMode ? "dark" : "light"}`,
    });
  };

useSocket((rawNotification) => {

    const incomingUserId = rawNotification.userId?.toString();

    if (!currentUserId || !incomingUserId || incomingUserId !== currentUserId) {
      return;
    }

    const incomingId = rawNotification._id?.toString();
    if (!incomingId) return;

    // Prevent duplicates
    if (notifications.some(n => n.id === incomingId)) return;

    const formatted = {
      id: incomingId,
      message: rawNotification.message || "New notification",
      type: rawNotification.type || "community",
      createdAt: rawNotification.createdAt || new Date().toISOString(),
      isRead: false,
      link: rawNotification.link || null,
      action: rawNotification.data?.action || extractActionFromMessage(rawNotification.message),
    };

  unstable_batchedUpdates(() => {
    setNotifications(prev => [formatted, ...prev]);
    setUnreadCount(prev => prev + 1);
  });

  const message = rawNotification.type.replace(/\b\w/g, c => c.toUpperCase());

  toast({
    title: "New Notification",
    description: message,
    duration: 3000,
    variant: "success",
  });
});

  const markAllAsRead = async () => {
    try {
      // Mark all unread notifications as read
      await Promise.all(
        notifications.filter(notif => !notif.isRead).map(async (notif) => {
          await markAsReadNotification(notif.id);
          setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
        })
      );
      // Update unread count to zero
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-3">
        {/* Top Row: Profile + Bell */}
        <div className="flex items-center justify-between mb-2">
          <DropdownMenuItem asChild className="flex-1">
            <Link to="/profile" className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>

          <Dialog open={notificationOpen} onOpenChange={setNotificationOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                  {unreadCount}
                </Badge>
              )}
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg max-h-[80vh] p-0 gap-0">
              <DialogHeader className="p-5 pb-3 border-b">
                <DialogTitle className="text-xl flex items-center justify-between">
                  Notifications
                  {unreadCount > 0 && <Badge variant="secondary">{unreadCount} new</Badge>}
                </DialogTitle>
              </DialogHeader>

              <div className="max-h-[60vh] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-40" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={cn(
                          "p-4 hover:bg-accent/70 transition-colors cursor-pointer flex gap-3",
                          !n.isRead && "bg-primary/5"
                        )}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {getNotificationIcon(n.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">{n.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {!n.isRead && (
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter className="mx-5 px-5 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all as read
                </Button>
              </DialogFooter>
            </DialogContent>

          </Dialog>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to="/settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={toggleDarkMode} className="flex items-center gap-2">
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {isDarkMode ? "Light Mode" : "Dark Mode"}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to="/contact-us" className="flex items-center gap-2">
            <Contact className="h-4 w-4" />
            Contact Us
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onLogout} className="text-red-600 dark:text-red-400">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};