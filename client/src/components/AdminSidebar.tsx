import { 
  BarChart3, 
  Users, 
  FileText, 
  Leaf, 
  Settings,
  LogOut,
  Award,
  Target
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Button } from "./ui/button"
import  useSignOut from "../hooks/useLogout"
import { ConfirmDialog } from "./ui/confirm-dialog"

const navigationItems = [
  { title: "Dashboard", url: "/admin", icon: BarChart3 },
  { title: "Footprint Summary", url: "/admin/footprint", icon: Leaf },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Activity Logs", url: "/admin/logs", icon: FileText },
  { title: "Badge Achievements", url: "/admin/badges", icon: Award },
  { title: "Eco Challenges", url: "/admin/eco-challenges", icon: Target },
  { title: "Settings", url: "/admin/settings", icon: Settings },
]

export function AdminSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const { signOut } = useSignOut();

  const isCollapsed = state === "collapsed"

  const handleSignOut = () => signOut();

  return (
    <Sidebar
      className={isCollapsed ? "w-40" : "w-64"}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-admin-border py-4 px-2">
        <div className="flex items-center gap-2">
          <div className="bg-eco text-eco-foreground p-2 rounded-lg shrink-0">
            <img src="/favicon.ico" alt="EcoStep Logo" className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="font-semibold text-sm text-sidebar-foreground">Ecosteps Admin</h2>
              <p className="text-xs text-muted-foreground">Dashboard</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className=" py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground">
            {!isCollapsed && "Navigation"}
          </SidebarGroupLabel> 
          
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-9">
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/admin"}
                      className={({ isActive }) => 
                        isActive 
                          ? "bg-primary text-sidebar-foreground font-semibold shadow-sm border-l-2 border-primary-foreground" 
                          : "text-secondary-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-3" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-admin-border p-2">
        <div className={`space-y-2 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          <div className="flex items-center gap-2 py-1">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src="" alt="Admin" />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                AD
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">Admin User</p>
                <p className="text-xs text-muted-foreground truncate">admin@carbon.com</p>
              </div>
            )}
          </div>

          <div className={`space-y-1 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
            <ConfirmDialog
              trigger={
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`${isCollapsed ? 'w-8 h-8 p-0' : 'w-full justify-start h-8'} text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`}
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span className="ml-2">Logout</span>}
                </Button>
              }
              title="Confirm Logout"
              description="Are you sure you want to logout? You will need to sign in again to access the admin dashboard."
              confirmText="Logout"
              variant="destructive"
              onConfirm={() => {
                handleSignOut()
              }}
            />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}