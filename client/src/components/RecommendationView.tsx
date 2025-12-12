// client/src/components/RecommendationView.tsx
// Component to display AI-generated carbon footprint recommendations

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Lightbulb,
  Car,
  Home,
  Utensils,
  Sparkles,
  TrendingDown,
  RotateCcw,
  CheckCircle2,
  Target,
  Leaf,
  Plane
} from 'lucide-react';
import { getTodaysTracking, getDailyTrackingHistory } from '../lib/api';
import useAuth from '../hooks/useAuth';
import MangroveMap from './MangrooveMap';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: 'transport' | 'home' | 'food' | 'general';
  estimatedSavings: number;
  priority: number;
  source: 'ai_generated' | 'rule_based' | 'hybrid';
  actionable: boolean;
}

interface FootprintData {
  id: string;
  footprintId: string;
  calculatedFootprint: {
    transport: number;
    homeEnergy: number;
    food: number;
    total: number;
  };
  breakdown: {
    transport: number;
    homeEnergy: number;
    food: number;
    total: number;
  };
}

interface RecommendationViewProps {
  recommendations: Recommendation[];
  footprintData: FootprintData | null;
  onRetry: () => void;
}

const RecommendationView: React.FC<RecommendationViewProps> = ({
  recommendations,
  footprintData,
  onRetry
}) => {
  const navigate = useNavigate();
  const [isLoadingToday, setIsLoadingToday] = useState(false);
  const [todayEntry, setTodayEntry] = useState<any>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  const { user } = useAuth() as { user: { _id?: string } };

  useEffect(() => {
    const userId = user?._id;
    if (!userId) return;

    const fetchToday = async () => {
      try {
        setIsLoadingToday(true);
        const res = await getTodaysTracking();
        setTodayEntry(res?.data || null);
      } catch (_e) {
        setTodayEntry(null);
      } finally {
        setIsLoadingToday(false);
      }
    };

    const fetchHistory = async () => {
      try {
        setIsLoadingHistory(true);
        const res = await getDailyTrackingHistory(7, 0);
        setHistoryEntries(res?.data?.entries || []);
      } catch (_e) {
        setHistoryEntries([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchToday();
    fetchHistory();
  }, [user]);

  // Category icons
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'transport':
        return <Car className="h-5 w-5" />;
      case 'home':
        return <Home className="h-5 w-5" />;
      case 'food':
        return <Utensils className="h-5 w-5" />;
      default:
        return <Leaf className="h-5 w-5" />;
    }
  };

  // Category colors
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'transport':
        return 'bg-blue-500 text-white';
      case 'home':
        return 'bg-green-500 text-white';
      case 'food':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Calculate total potential savings
  const totalPotentialSavings = recommendations.reduce((sum, rec) => sum + rec.estimatedSavings, 0);
  const currentTotal = footprintData?.calculatedFootprint.total || 0;
  const potentialReduction = currentTotal > 0 ? (totalPotentialSavings / currentTotal) * 100 : 0;

  // Sort recommendations by priority
  const sortedRecommendations = [...recommendations].sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-6">
      {/* Footprint Summary */}
      {footprintData && (
        <Card className="shadow-card border-border bg-gradient-to-r from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Your Carbon Footprint Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {footprintData.calculatedFootprint.transport.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Transport</div>
                <div className="text-xs text-blue-600">kg CO₂e</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {footprintData.calculatedFootprint.homeEnergy.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Home Energy</div>
                <div className="text-xs text-green-600">kg CO₂e</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {footprintData.calculatedFootprint.food.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Food</div>
                <div className="text-xs text-orange-600">kg CO₂e</div>
              </div>
              <div className="text-center border-l border-border pl-4">
                <div className="text-3xl font-bold text-foreground">
                  {footprintData.calculatedFootprint.total.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Total Today</div>
                <div className="text-xs text-muted-foreground">kg CO₂e</div>
              </div>
            </div>

            {/* Potential Impact */}
            {totalPotentialSavings > 0 && (
              <div className="mt-4 p-4 bg-success/10 rounded-lg border border-success/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-5 w-5 text-success" />
                  <span className="font-semibold text-success">Potential Impact</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-lg font-bold text-success">
                      -{totalPotentialSavings.toFixed(1)} kg CO₂e
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Could save with these recommendations
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-success">
                      {potentialReduction.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Potential reduction from today's total
                    </div>
                  </div>
                </div>
                <Progress 
                  value={Math.min(potentialReduction, 100)} 
                  className="mt-2 h-2" 
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedRecommendations.map((recommendation) => (
          <Card 
            key={recommendation.id}
            className="shadow-card border-border hover:shadow-lg transition-shadow duration-200"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between mb-2">
                <Badge 
                  variant="secondary"
                  className={getCategoryColor(recommendation.category)}
                >
                  {recommendation.category}
                </Badge>
                <div className="flex items-center gap-1">
                  {recommendation.source === 'ai_generated' && (
                    <Sparkles className="h-4 w-4 text-purple-500" aria-label="AI Generated" />
                  )}
                  <div className="text-xs text-muted-foreground">
                    #{recommendation.priority}
                  </div>
                </div>
              </div>
              
              <CardTitle className="text-lg flex items-start gap-2 leading-tight">
                {getCategoryIcon(recommendation.category)}
                <span>{recommendation.title}</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {recommendation.description}
              </p>
              
              {/* Savings Display */}
              <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-success">Potential Savings</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-success">
                    {recommendation.estimatedSavings.toFixed(1)} kg
                  </div>
                  <div className="text-xs text-muted-foreground">CO₂e</div>
                </div>
              </div>
              
              {/* Action Button
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => {
                  // Here you could implement action tracking
                  console.log('User interested in recommendation:', recommendation.id);
                }}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                I'll Try This
              </Button> */}
              
              {/* Source indicator */}
              <div className="text-xs text-muted-foreground text-center">
                {recommendation.source === 'ai_generated' && (
                  <span className="flex items-center justify-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI-powered suggestion
                  </span>
                )}
                {recommendation.source === 'rule_based' && (
                  <span>Evidence-based recommendation</span>
                )}
                {recommendation.source === 'hybrid' && (
                  <span>AI-enhanced suggestion</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary and Actions */}
      <Card className="shadow-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-warning" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {recommendations.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Personalized recommendations
              </div>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-success mb-1">
                {totalPotentialSavings.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">
                kg CO₂e potential savings
              </div>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-accent mb-1">
                {Math.round(potentialReduction)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Potential reduction
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              These AI-powered recommendations are personalized based on your daily carbon footprint. 
              Start with the highest-priority suggestions for maximum impact. Even small changes can 
              make a significant difference over time.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              
              
              <Button 
                size="sm"
                onClick={() => {
                  // Navigate to dashboard using React Router
                  navigate('/dashboard');
                }}
              >
                <Target className="h-4 w-4 mr-2" />
                View Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* <Card className='rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition'>
        <CardHeader>
          <CardTitle>Planting Locations Map</CardTitle>
        </CardHeader>
        <CardContent>
          <MangroveMap />
        </CardContent>
      </Card> */}
    </div>
  );
};

export default RecommendationView;