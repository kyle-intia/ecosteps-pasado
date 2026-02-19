import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Activity,
  Leaf,
  Brain,
  TrendingUp,
  TrendingDown,
  Eye,
  Car,
  UtensilsCrossed,
  Home,
  CheckCircle,
  CloudRain,
  Zap,
} from "lucide-react";
import {
  getUserGrowthStats,
  getActivityGrowthStats,
  getAvgFootprintGrowthStats,
  getMonthlyFootprintByCategory,
  listDailyTrackings,
  listUsers,
  getOverallAssessmentResults,
} from "../lib/api";
import { Spinner } from "@/components/ui/spinner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type EmissionCategory = {
  name: string;
  value: number;
  color: string;
};

type CategoryCountsResponse = {
  transportCount: number;
  foodCount: number;
  homeEnergyCount: number;
};

interface Emissions {
  avgReductionKg: number;
  avgReductionPercent: number;
}

interface Overall {
  improvedCount: number;
  improvedPercent: number;
}

interface AssessmentData {
  totalUsers: number;
  awareness: { avgChange: number };
  behavior: { avgChange: number };
  emissions: Emissions;
  overall: Overall;
}

const AdminDashboard = () => {
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [kpiData, setKpiData] = useState([
    {
      title: "Total Users",
      value: "—",
      change: "—",
      trend: "up",
      icon: Users,
    },
  ]);

  const [data, setData] = useState<AssessmentData | null>(null);
  const [loadingAssessment, setLoadingAssessment] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleActivityClick = (activity: any) => {
    setSelectedActivity(activity);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "transport":
        return Car;
      case "food":
        return UtensilsCrossed;
      case "home":
        return Home;
      default:
        return Brain;
    }
  };

  const getDaysAgo = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    const now = new Date();

    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      if (diffHours === 0) {
        if (diffMinutes === 0) return "Just now";
        if (diffMinutes === 1) return "1 minute ago";
        return `${diffMinutes} minutes ago`;
      }
      if (diffHours === 1) return "1 hour ago";
      return `${diffHours} hours ago`;
    }

    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getOverallAssessmentResults();
        if (response.success) {
          setData(response.data);
        } else {
          setError("Failed to load data");
        }
      } catch (err) {
        setError("An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchKpis = async () => {
      try {
        setLoading(true);

        const [userRes, activityRes, footprintRes] = await Promise.all([
          getUserGrowthStats(),
          getActivityGrowthStats(),
          getAvgFootprintGrowthStats(),
        ]);

        const {
          totalUser: totalUser,
          currentTotal: userCurrent,
          percentageIncrease: userPercent,
          previousTotal: userPrevious,
        } = userRes;
        const {
          currentTotal: activityCurrent,
          percentageIncrease: activityPercent,
        } = activityRes;
        const { currentAvg, percentageIncrease: footprintPercent } =
          footprintRes;

        setKpiData([
          {
            title: "Total Users",
            value: totalUser,
            change: `${userPercent >= 0 ? "+" : "-"}${Math.abs(userPercent)}%`,
            trend: userPercent >= 0 ? "up" : "down",
            icon: Users,
          },
          {
            title: "Activity Logs",
            value: activityCurrent.toLocaleString(),
            change: `${activityPercent >= 0 ? "+" : "-"}${Math.abs(activityPercent)}%`,
            trend: activityPercent >= 0 ? "up" : "down",
            icon: Activity,
          },
          {
            title: "Avg Footprint",
            value: `${currentAvg.toFixed(2)} kg CO2e`,
            change: `${footprintPercent >= 0 ? "+" : "-"}${Math.abs(footprintPercent)}%`,
            trend: footprintPercent >= 0 ? "up" : "down",
            icon: Leaf,
          },
        ]);
      } catch (error) {
        console.error("Failed to fetch KPI data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchKpis();
  }, []);

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();

        const months = Array.from({ length: 12 }, (_, i) => {
          const date = new Date(currentYear, i, 1);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        });

        console.log(months);

        const promises = months.map((m) => getMonthlyFootprintByCategory(m));
        const results = await Promise.all(promises);

        const formattedData = results.map((res, index) => ({
          date: months[index],
          transport: res?.transport ?? 0,
          food: res?.food ?? 0,
          home: res?.homeEnergy ?? 0,
        }));
        console.log(formattedData);
        setChartData(formattedData);
      } catch (error) {
        console.error("Failed to fetch chart data:", error);
        toast({ title: "Error", description: "Failed to load chart data." });
      }
    };

    fetchChartData();
  }, []);

  const [emissionData, setEmissionData] = useState<EmissionCategory[]>([]);

  useEffect(() => {
    const calculateBreakdown = () => {
      const totalTransport = chartData.reduce(
        (sum, entry) => sum + entry.transport,
        0,
      );
      const totalFood = chartData.reduce((sum, entry) => sum + entry.food, 0);
      const totalHome = chartData.reduce((sum, entry) => sum + entry.home, 0);
      const totalEmissions = totalTransport + totalFood + totalHome;
      if (totalEmissions === 0) {
        setEmissionData([]);
        return;
      }
      const breakdown = [
        {
          name: "Transport",
          value: parseFloat(
            ((totalTransport / totalEmissions) * 100).toFixed(1),
          ),
          color: "hsl(var(--chart-1))",
        },
        {
          name: "Food",
          value: parseFloat(((totalFood / totalEmissions) * 100).toFixed(1)),
          color: "hsl(var(--chart-2))",
        },
        {
          name: "Home Energy",
          value: parseFloat(((totalHome / totalEmissions) * 100).toFixed(1)),
          color: "hsl(var(--chart-3))",
        },
      ];
      setEmissionData(breakdown);
    };
    calculateBreakdown();
  }, [chartData]);

  const [activityData, setActivityData] = useState<any[]>([]);

  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        const res = await listDailyTrackings({
          limit: 5,
          sortBy: "createdAt",
          order: "desc",
        });
        setActivityData(res.data || []);
      } catch (error) {
        console.error("Failed to fetch activity data:", error);
        toast({
          title: "Error",
          description: "Failed to load recent activity.",
        });
      }
    };

    fetchActivityData();
  }, []);

  const barChartRef = useRef();
  const emissionChartRef = useRef();

  const handleExportImage = () => {
    const chart1 = html2canvas(barChartRef.current);
    const chart2 = html2canvas(emissionChartRef.current);

    Promise.all([chart1, chart2]).then(([canvas1, canvas2]) => {
      const combinedCanvas = document.createElement("canvas");
      const ctx = combinedCanvas.getContext("2d");

      const combinedWidth = canvas1.width + canvas2.width + 20;
      const combinedHeight = Math.max(canvas1.height, canvas2.height);

      combinedCanvas.width = combinedWidth;
      combinedCanvas.height = combinedHeight;

      ctx.drawImage(canvas1, 0, 0);

      ctx.drawImage(canvas2, canvas1.width + 10, 0);

      const combinedImgData = combinedCanvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = combinedImgData;
      link.download = "combined_chart.png";
      link.click();
    });
  };

  const handleExportPDF = () => {
    const currentDate = new Date().toLocaleDateString();

    const chart1 = html2canvas(barChartRef.current, { scale: 2 });
    const chart2 = html2canvas(emissionChartRef.current, { scale: 2 });

    Promise.all([chart1, chart2]).then(([canvas1, canvas2]) => {
      const pdf = new jsPDF("p", "mm", "a4");

      pdf.setFontSize(16);
      pdf.text("Carbon Footprint Trend: Monthly", 10, 10);
      pdf.text(`Exported on Date: ${currentDate}`, 10, 20);

      const combinedCanvas = document.createElement("canvas");
      const ctx = combinedCanvas.getContext("2d");

      const combinedWidth = canvas1.width + canvas2.width + 20;
      const combinedHeight = Math.max(canvas1.height, canvas2.height);

      combinedCanvas.width = combinedWidth;
      combinedCanvas.height = combinedHeight;

      ctx.drawImage(canvas1, 0, 0);

      ctx.drawImage(canvas2, canvas1.width + 10, 0);

      const combinedImgData = combinedCanvas.toDataURL("image/png");

      const imageWidth = 180;
      const imageHeight =
        (combinedCanvas.height * imageWidth) / combinedCanvas.width;
      pdf.addImage(combinedImgData, "PNG", 10, 30, imageWidth, imageHeight);

      pdf.save(`Footprint_Trends_${currentDate.replace(/\//g, "-")}.pdf`);
    });
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            Monitor your carbon footprint tracking platform
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button onClick={handleExportImage} variant="outline">
          Export as Image
        </Button>
        <Button onClick={handleExportPDF} variant="outline">
          Export as PDF
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title} className="shadow-sm border-admin-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <kpi.icon className="h-4 w-4" />
                {kpi.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div
                  className={`flex items-center gap-1 text-sm ${
                    kpi.trend === "up" ? "text-eco" : "text-primary"
                  }`}
                >
                  {kpi.trend === "up" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {kpi.change}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carbon Footprint Trend */}
        <Card className="shadow-sm border-admin-border" ref={barChartRef}>
          <CardHeader>
            <CardTitle className="text-lg">Carbon Footprint Trend</CardTitle>
            <p className="text-sm text-muted-foreground">
              Monthly emissions by category
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px hsl(0 0% 0% / 0.1)",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar
                  dataKey="transport"
                  fill="hsl(var(--chart-1))"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="food"
                  fill="hsl(var(--chart-2))"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="home"
                  fill="hsl(var(--chart-3))"
                  radius={[4, 4, 0, 0]}
                />

                <Legend
                  verticalAlign="top"
                  align="center"
                  iconSize={10}
                  iconType="square"
                  wrapperStyle={{ paddingTop: 10 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Emissions Breakdown */}
        <Card className="shadow-sm border-admin-border" ref={emissionChartRef}>
          <CardHeader>
            <CardTitle className="text-lg">Emissions Breakdown</CardTitle>
            <p className="text-sm text-muted-foreground">
              Distribution by category
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={emissionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {emissionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px hsl(0 0% 0% / 0.1)",
                  }}
                  formatter={(value, name) => [`${value}%`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex flex-wrap gap-4 justify-center">
              {emissionData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {entry.name}
                  </span>
                  <span className="text-sm font-medium">{entry.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-admin-border" ref={barChartRef}>
          <CardHeader>
            <CardTitle className="text-lg">
              Overall Assessment Results
            </CardTitle>
            <p className="text-sm text-muted-foreground">Performance metrics</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Total Users */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <BarChart className="text-gray-500" />
                  <span className="text-gray-600 font-medium">
                    Total Users:
                  </span>
                </div>
                <span className="text-gray-900">{data?.totalUsers}</span>
              </div>

              {/* Awareness Avg. Change */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="text-green-500" size={18} />
                  <span className="text-gray-600 font-medium">
                    Awareness Avg. Change:
                  </span>
                </div>
                <span className="text-gray-900">
                  {data?.awareness?.avgChange.toFixed(2)}
                </span>
              </div>

              {/* Behavior Avg. Change */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Activity className="text-yellow-500" size={18} />
                  <span className="text-gray-600 font-medium">
                    Behavior Avg. Change:
                  </span>
                </div>
                <span className="text-gray-900">
                  {data?.behavior?.avgChange.toFixed(2)}
                </span>
              </div>

              {/* Emissions Avg. Reduction (kg) */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <CloudRain className="text-blue-500" size={18} />
                  <span className="text-gray-600 font-medium">
                    Emissions Avg. Reduction (kg):
                  </span>
                </div>
                <span className="text-gray-900">
                  {data?.emissions?.avgReductionKg.toFixed(2)} kg
                </span>
              </div>

              {/* Emissions Avg. Reduction (%) */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <CloudRain className="text-blue-500" size={18} />
                  <span className="text-gray-600 font-medium">
                    Emissions Avg. Reduction (%):
                  </span>
                </div>
                <span className="text-gray-900">
                  {data?.emissions?.avgReductionPercent.toFixed(2)}%
                </span>
              </div>

              {/* Overall Improvement */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-green-500" size={18} />
                  <span className="text-gray-600 font-medium">
                    Overall Improvement:
                  </span>
                </div>
                <span className="text-gray-900">
                  {data?.overall?.improvedCount} / {data?.totalUsers} (
                  {data?.overall?.improvedPercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emissions Breakdown */}
        <Card>
          <CardContent>
            {/* Bar Chart for Awareness and Behavior */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Awareness & Behavior Average Change
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { name: "Awareness", value: data?.awareness?.avgChange },
                    { name: "Behavior", value: data?.behavior?.avgChange },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart for Emissions Reduction */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Emissions Reduction
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      name: "Reduction (kg)",
                      value: data?.emissions?.avgReductionKg,
                    },
                    {
                      name: "Reduction (%)",
                      value: data?.emissions?.avgReductionPercent,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-sm border-admin-border">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <p className="text-sm text-muted-foreground">
            Latest user submissions
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activityData.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-admin-border last:border-0 cursor-pointer hover:bg-admin-hover rounded-sm px-2 transition-colors"
                onClick={() => handleActivityClick(activity)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      activity.type === "transport"
                        ? "bg-chart-1"
                        : activity.type === "food"
                          ? "bg-chart-2"
                          : activity.type === "home"
                            ? "bg-chart-3"
                            : "bg-chart-4"
                    }`}
                  />
                  <div>
                    <p className="font-medium text-sm">{activity.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Logged Daily Trackings
                    </p>
                    <p>
                      <span className="text-xs text-muted-foreground">
                        CO₂e:{" "}
                      </span>
                      <span className="text-xs font-medium">
                        {activity.total.toFixed(2)} kg
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {getDaysAgo(activity.createdAt)}
                  </span>
                  <Eye className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Detail Dialog */}
      <Dialog
        open={!!selectedActivity}
        onOpenChange={(open) => !open && setSelectedActivity(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Activity Details
            </DialogTitle>
            <DialogDescription>
              Recent user activity information
            </DialogDescription>
          </DialogHeader>

          {selectedActivity && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">User</p>
                  <p className="text-sm text-muted-foreground ml-2">
                    {selectedActivity.email}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Total:</p>
                  <p className="text-sm font-medium ml-2">
                    {selectedActivity.total.toFixed(2)} kg CO₂e
                  </p>
                  <p className="text-sm text-muted-foreground ml-4">
                    Transport: {selectedActivity.transport}
                  </p>
                  <p className="text-sm text-muted-foreground ml-4">
                    Food: {selectedActivity.food}
                  </p>
                  <p className="text-sm text-muted-foreground ml-4">
                    Home Energy: {selectedActivity.homeEnergy}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Time</p>
                  <p className="text-sm text-muted-foreground ml-2">
                    {new Date(selectedActivity.createdAt)
                      .toISOString()
                      .slice(0, 10)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
