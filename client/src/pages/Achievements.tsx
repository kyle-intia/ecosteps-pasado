import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Trophy, 
  Lock, 
  Footprints, 
  Recycle, 
  TreePine, 
  Car, 
  Zap,
  Apple,
  Users,
  Target
} from "lucide-react";

// Mock achievements data
const mockAchievements = [
  {
    id: "walk_the_talk",
    name: "Walk the Talk",
    description: "Walk 50 km in a single day",
    icon: Footprints,
    category: "Transportation",
    requirement: {
      metric: "DistanceWalked",
      value: 50,
      unit: "km",
      timeframe: "1_day"
    },
    points: 100,
    unlocked: true,
    dateEarned: "2025-08-20"
  },
  {
    id: "green_commuter",
    name: "Green Commuter",
    description: "Use public transport for 30 consecutive days",
    icon: Car,
    category: "Transportation", 
    requirement: {
      metric: "PublicTransportDays",
      value: 30,
      unit: "days",
      timeframe: "consecutive"
    },
    points: 150,
    unlocked: true,
    dateEarned: "2025-08-15"
  },
  {
    id: "solar_pioneer",
    name: "Solar Pioneer",
    description: "Install solar panels and generate 1000 kWh",
    icon: Zap,
    category: "Energy",
    requirement: {
      metric: "SolarEnergyGenerated",
      value: 1000,
      unit: "kWh",
      timeframe: "lifetime"
    },
    points: 300,
    unlocked: false
  },
  {
    id: "recycling_champion",
    name: "Recycling Champion",
    description: "Recycle 100 kg of materials in a month",
    icon: Recycle,
    category: "Waste",
    requirement: {
      metric: "MaterialsRecycled",
      value: 100,
      unit: "kg",
      timeframe: "1_month"
    },
    points: 75,
    unlocked: true,
    dateEarned: "2025-08-10"
  },
  {
    id: "tree_hugger",
    name: "Tree Hugger",
    description: "Plant 25 trees in your community",
    icon: TreePine,
    category: "Nature",
    requirement: {
      metric: "TreesPlanted",
      value: 25,
      unit: "trees",
      timeframe: "lifetime"
    },
    points: 200,
    unlocked: false
  },
  {
    id: "plant_based_month",
    name: "Plant-Based Month",
    description: "Follow a vegetarian diet for 30 days",
    icon: Apple,
    category: "Diet",
    requirement: {
      metric: "VegetarianDays",
      value: 30,
      unit: "days",
      timeframe: "consecutive"
    },
    points: 120,
    unlocked: false
  },
  {
    id: "community_leader",
    name: "Community Leader",
    description: "Help 10 friends join EcoSteps",
    icon: Users,
    category: "Community",
    requirement: {
      metric: "FriendsReferred",
      value: 10,
      unit: "people",
      timeframe: "lifetime"
    },
    points: 250,
    unlocked: false
  },
  {
    id: "carbon_neutral",
    name: "Carbon Neutral",
    description: "Offset your entire carbon footprint for a year",
    icon: Target,
    category: "Carbon",
    requirement: {
      metric: "CarbonOffset",
      value: 100,
      unit: "percent",
      timeframe: "1_year"
    },
    points: 500,
    unlocked: false
  }
];

const categoryColors = {
  Transportation: "bg-blue-500/10 text-blue-700 border-blue-200",
  Energy: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  Waste: "bg-green-500/10 text-green-700 border-green-200",
  Nature: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  Diet: "bg-orange-500/10 text-orange-700 border-orange-200",
  Community: "bg-purple-500/10 text-purple-700 border-purple-200",
  Carbon: "bg-gray-500/10 text-gray-700 border-gray-200"
};

const Achievements = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", ...new Set(mockAchievements.map(a => a.category))];
  
  const filteredAchievements = mockAchievements.filter(achievement => {
    const matchesSearch = achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         achievement.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || achievement.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const unlockedCount = mockAchievements.filter(a => a.unlocked).length;
  const totalPoints = mockAchievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn={true} />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            <Trophy className="inline-block h-10 w-10 mr-3 text-yellow-500" />
            Achievements
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Earn achievements by taking eco-friendly actions and making a positive impact
          </p>
          
          {/* Stats */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{unlockedCount}</p>
              <p className="text-sm text-muted-foreground">Unlocked</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{mockAchievements.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-success">{totalPoints}</p>
              <p className="text-sm text-muted-foreground">Points Earned</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search achievements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((achievement) => {
            const IconComponent = achievement.icon;
            const categoryColor = categoryColors[achievement.category as keyof typeof categoryColors];
            
            return (
              <Card key={achievement.id} className={`relative hover:shadow-elevated transition-smooth ${
                achievement.unlocked ? 'border-primary/20' : 'border-muted opacity-75'
              }`}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${achievement.unlocked ? 'bg-primary/10' : 'bg-muted'}`}>
                        {achievement.unlocked ? (
                          <IconComponent className="h-6 w-6 text-primary" />
                        ) : (
                          <Lock className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{achievement.name}</CardTitle>
                        <Badge variant="outline" className={`mt-1 ${categoryColor}`}>
                          {achievement.category}
                        </Badge>
                      </div>
                    </div>
                    
                    {achievement.unlocked && (
                      <Trophy className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-muted-foreground mb-4">{achievement.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Requirement:</span>
                      <span className="font-medium">
                        {achievement.requirement.value} {achievement.requirement.unit}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Points:</span>
                      <span className="font-medium text-primary">{achievement.points}</span>
                    </div>
                    
                    {achievement.unlocked && achievement.dateEarned && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Earned:</span>
                        <span className="font-medium text-success">{achievement.dateEarned}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No achievements found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Achievements;