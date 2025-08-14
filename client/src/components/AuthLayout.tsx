import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf } from "lucide-react";
import heroImage from "@/assets/hero-eco.jpg";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
}

export const AuthLayout = ({ children, title, description }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-subtle">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-center space-x-2">
            <div className="p-3 bg-gradient-primary rounded-xl shadow-glow">
              <Leaf className="h-8 w-8 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">EcoStep</span>
          </div>

          {/* Form Card */}
          <Card className="shadow-elevated border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-foreground">{title}</CardTitle>
              <CardDescription className="text-muted-foreground">{description}</CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Hero Image */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img
          src={heroImage}
          alt="EcoStep Carbon Tracking"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center text-primary-foreground space-y-6">
            <h1 className="text-4xl font-bold leading-tight">
              Track Your Carbon <br />
              <span className="text-accent">Footprint</span>
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-md">
              Join thousands of eco-warriors making a positive impact on our planet, one step at a time.
            </p>
            <div className="flex items-center justify-center space-x-8 text-primary-foreground/80">
              <div className="text-center">
                <div className="text-2xl font-bold">10K+</div>
                <div className="text-sm">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">2.5M</div>
                <div className="text-sm">CO₂ Saved (kg)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">95%</div>
                <div className="text-sm">Goal Success</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};