import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Leaf, TrendingDown, Users, Award, ArrowRight, CheckCircle } from "lucide-react";
import heroImage from "@/assets/hero-eco.jpg";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);
    
    if (loggedIn) {
      const needsPreAssessment = localStorage.getItem("needsPreAssessment") === "true";
      if (needsPreAssessment) {
        navigate("/pre-assessment");
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
  };

  // Remove the automatic redirect so Home page can be accessed when logged in

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="EcoStep Carbon Tracking"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-accent/60" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center text-primary-foreground space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                Track Your Carbon <br />
                <span className="text-accent">Footprint</span>
              </h1>
              <p className="text-xl lg:text-2xl text-primary-foreground/90 max-w-3xl mx-auto">
                Join thousands of eco-warriors making a positive impact on our planet. 
                Monitor, reduce, and offset your carbon emissions with EcoStep.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="xl" asChild>
                <Link to="/register">
                  Start Your Eco Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" className="bg-card/10 border-primary-foreground/30 text-primary-foreground hover:bg-card/20" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            </div>

            <div className="flex items-center justify-center space-x-8 text-primary-foreground/90 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold">10K+</div>
                <div className="text-sm">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">2.5M</div>
                <div className="text-sm">CO₂ Saved (kg)</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">95%</div>
                <div className="text-sm">Goal Success</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything You Need to Go Green
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools to track, analyze, and reduce your environmental impact
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="shadow-card border-border hover:shadow-elevated transition-smooth">
              <CardHeader className="text-center">
                <div className="p-3 bg-gradient-primary rounded-xl w-fit mx-auto mb-4">
                  <TrendingDown className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>Carbon Tracking</CardTitle>
                <CardDescription>
                  Monitor your daily carbon emissions across transportation, energy, and food
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card border-border hover:shadow-elevated transition-smooth">
              <CardHeader className="text-center">
                <div className="p-3 bg-gradient-eco rounded-xl w-fit mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>Community</CardTitle>
                <CardDescription>
                  Connect with like-minded individuals and share eco-friendly tips
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card border-border hover:shadow-elevated transition-smooth">
              <CardHeader className="text-center">
                <div className="p-3 bg-warning rounded-xl w-fit mx-auto mb-4">
                  <Award className="h-8 w-8 text-warning-foreground" />
                </div>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>
                  Earn eco-badges and compete on leaderboards for sustainable living
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl font-bold text-foreground">
                Why Choose EcoStep?
              </h2>
              
              <div className="space-y-6">
                {[
                  "Personalized carbon footprint analysis",
                  "Real-time tracking and insights",
                  "Community challenges and rewards",
                  "Expert recommendations for reduction",
                  "Progress visualization and reports"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-success flex-shrink-0" />
                    <span className="text-lg text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <Button variant="hero" size="lg" asChild>
                <Link to="/register">
                  Join EcoStep Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary rounded-3xl transform rotate-3"></div>
              <Card className="relative shadow-elevated border-border">
                <CardHeader>
                  <CardTitle className="text-2xl">Your Impact Dashboard</CardTitle>
                  <CardDescription>Get detailed insights into your environmental footprint</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <span>Carbon Saved This Month</span>
                    <span className="text-xl font-bold text-success">-24%</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <span>Eco Score</span>
                    <span className="text-xl font-bold text-primary">847 pts</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <span>Global Ranking</span>
                    <span className="text-xl font-bold text-warning">Top 15%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-4xl lg:text-5xl font-bold">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-primary-foreground/90">
            Start your journey towards a more sustainable future today. 
            Every small step counts towards a greener planet.
          </p>
          <Button variant="outline" size="xl" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
            <Link to="/register">
              Get Started for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Leaf className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">EcoStep</span>
            </div>
            <p className="text-muted-foreground">
              © 2024 EcoStep. Making the world greener, one step at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
