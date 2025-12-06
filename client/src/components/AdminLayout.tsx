import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/AdminSidebar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Bell } from "lucide-react"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Outlet } from "react-router-dom";
import { getAllNotification, markAsReadNotification } from "../lib/api"


export function AdminLayout() {
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { toast } = useToast()

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
          type: n.type,
          role: n.user.role
        }));

        setNotifications(formatted);
        setUnreadCount(formatted.filter((n) => n.unread && n.type !== "daily-tracking-reminder" && n.type !== "community" && n.type !== "reward" && n.type !== "certificate" && n.type !== "achievement" && n.role !== "admin").length);
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

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(
      (n) => n.unread && n.type !== "daily-tracking-reminder" && n.role !== "admin"
    );

    try {
      // Send all requests in parallel
      await Promise.all(
        unreadNotifications.map((n) => markAsReadNotification(n.id))
      );

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.unread && n.type !== "daily-tracking-reminder" && n.role !== "admin"
            ? { ...n, unread: false }
            : n
        )
      );
      setUnreadCount(0);

      toast({
        title: "Success",
        description: "All unread notifications marked as read.",
      });
    } catch (err) {
      console.error("Failed to mark all as read", err);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read.",
        variant: "destructive",
      });
    }
  };


  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-admin-surface">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-50 bg-admin-panel border-b border-admin-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-admin-hover" />
                <h1 className="text-lg font-semibold">Carbon Footprint Admin</h1>
              </div>

              <div className="flex items-center gap-2">
                <Dialog open={notificationOpen} onOpenChange={setNotificationOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="relative">
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
                      <DialogTitle className="flex items-center justify-between mx-4">
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
                          .filter((notification) => notification.type !== "achievement" && notification.type !== "certificate" && notification.type !== "reward" && notification.type !== "community" && notification.type !== "daily-tracking-reminder" && notification.role !== "admin")
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
                    <DialogFooter>
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
            </div>
          </header>

          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}