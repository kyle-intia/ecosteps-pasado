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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings, Moon, Sun, User, LogOut, UserCircle, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Badge } from "./ui/badge";
import { getAllNotification, markAsReadNotification } from "../lib/api"
import useAuth from "../hooks/useAuth"; 


interface SettingsDropdownProps {
  onLogout: () => void;
}

export const SettingsDropdown = ({ onLogout }: SettingsDropdownProps) => {
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );
  
  const { toast } = useToast();

  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useAuth() as { user: { _id?: string } };
  
  useEffect(() => {
    const fetchAllNotifications = async () => {
      try {
        const response = await getAllNotification();  

        const formatted = response.map((n: any) => ({
          id: n._id,
          userId: n.userId,
          title: "Notification",
          message: n.message,
          createdAt: n.createdAt,
          time: new Date(n.createdAt).toLocaleString(),
          unread: !n.isRead,
          type: n.type

        }));

        setNotifications(formatted);
        setUnreadCount(formatted.filter((n) => n.unread && n.userId === user?._id && n.type === "daily-tracking-reminder" ).length);
      } catch (err: any) {
        console.error("Failed to fetch all notifications", err?.response ?? err);
      }
    };

    fetchAllNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await markAsReadNotification(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
      )
      setUnreadCount((prev) => Math.max(prev - 1, 0))

      toast({
        title: "Notification",
        description: "Marked as read",
      })
    } catch (err) {
      console.error("Failed to mark notification as read", err)
    }
  }

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode.toString());
    
    // Apply dark mode to document
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    toast({
      title: `${newDarkMode ? "Dark" : "Light"} mode enabled`,
      description: `Switched to ${newDarkMode ? "dark" : "light"} theme.`,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="grid grid-cols-10 w-full">
        <DropdownMenuItem asChild className="col-span-7 ">
          <Link to="/profile">
            <UserCircle className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>

        <Dialog open={notificationOpen} onOpenChange={setNotificationOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="relative m-2 col-span-3">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary">{unreadCount} unread</Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notifications</p>
              ) : (
                notifications
                  .filter((notification) => notification.type === "daily-tracking-reminder" && notification.userId === user?._id)
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((notification) =>(
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors ${
                      notification.unread ? "bg-accent/20 border-primary/20" : "bg-background"
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                      </div>
                      {notification.unread && (
                        <div className="w-2 h-2 bg-primary rounded-full ml-2 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
        </div>
        
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={toggleDarkMode}>
          {isDarkMode ? (
            <>
              <Sun className="mr-2 h-4 w-4" />
              Light Mode
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4" />
              Dark Mode
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};