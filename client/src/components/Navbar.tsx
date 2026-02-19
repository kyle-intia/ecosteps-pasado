import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  Home,
  BarChart3,
  Users,
  Trophy,
  LayoutDashboard,
  Send,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { SettingsDropdown } from "./SettingsDropdown";

interface NavbarProps {
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

export const Navbar = ({ isLoggedIn = false, onLogout }: NavbarProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigationItems = [
    { name: "Home", href: "/home", icon: Home },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Live Tracking", href: "/track-distance", icon: Send },
    { name: "Track Carbon", href: "/track", icon: BarChart3 },
    { name: "Community", href: "/community", icon: Users },
    { name: "Leaderboards", href: "/leaderboards", icon: Trophy },
  ];

  const isActivePath = (path: string) => {
    if (path === "/track-distance" && location.pathname === "/track-history") {
      return true;
    }
    return location.pathname === path;
  };

  return (
    <nav className="bg-card shadow-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            {/* <div className="p-2 bg-gradient-primary rounded-lg shadow-glow group-hover:shadow-elevated transition-smooth">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div> */}
            <img
              src="/ecosteps.svg"
              alt="EcoSteps Logo"
              className="h-9 w-9 rounded"
            />
            <span className="text-xl font-bold text-foreground">EcoSteps</span>
          </Link>

          {/* Desktop Navigation */}
          {isLoggedIn && (
            <div className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ease-out",
                      isActivePath(item.href)
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted ",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isLoggedIn ? (
              <SettingsDropdown onLogout={onLogout} />
            ) : (
              <>
                <Button
                  variant="ghost"
                  asChild
                  className="transition-transform duration-200 ease-in-out hover:scale-105"
                >
                  <Link to="/login">Login</Link>
                </Button>
                <Button
                  variant="hero"
                  asChild
                  className="transition-transform duration-200 ease-in-out hover:scale-105"
                >
                  <Link to="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-muted rounded-lg mt-2">
              {isLoggedIn && (
                <>
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={cn(
                          "flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-smooth",
                          isActivePath(item.href)
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent",
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                  <div className="border-t border-border pt-3 mt-3">
                    <div className="px-3">
                      <SettingsDropdown
                        onLogout={() => {
                          onLogout?.();
                          setIsMobileMenuOpen(false);
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
              {!isLoggedIn && (
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    asChild
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button
                    variant="hero"
                    className="w-full"
                    asChild
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link to="/register">Get Started</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
