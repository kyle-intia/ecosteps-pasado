import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Trophy,} from "lucide-react"
import { getDailyFootprintByCategory } from "../lib/api"
import { useEffect, useRef, useState } from "react"
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from "@/components/ui/button"

const leaderboardData = [
  { rank: 1, user: "alex.smith@email.com", footprint: 6.2, change: -15 },
  { rank: 2, user: "sarah.j@email.com", footprint: 8.5, change: -8 },
  { rank: 3, user: "mike.chen@email.com", footprint: 9.1, change: -12 },
  { rank: 4, user: "lisa.brown@email.com", footprint: 11.8, change: +2 },
  { rank: 5, user: "david.wilson@email.com", footprint: 13.2, change: -5 },
]

const FootprintSummary = () => {
  const [dailyTrends, setDailyTrends] = useState<any[]>([]);
  const [filter, setFilter] = useState<  'average' | 'all' | 'user' | 'compare'>('average');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);  // For comparing two users

  // Function to get all the days in the current month
  const getDaysInMonth = (year: number, month: number) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const dates = [];

    // Generate an array of dates (e.g., 01, 02, ..., 31)
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      dates.push(date);
    }

    return dates;
  };

  // Fetch data for each day of the current month
  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const allDays = getDaysInMonth(year, month);
        const allDailyData = [];

        for (const date of allDays) {
          const data = await getDailyFootprintByCategory(date);
          allDailyData.push({ date, ...(Array.isArray(data) && data.length > 0 ? data[0] : {}) });
        }
        setDailyTrends(allDailyData);
      } catch (error) {
        console.error("Error fetching daily footprint data:", error);
      }
    };

    fetchData();
  }, []);

  const transformData = (dailyData) => {
    return dailyData.map((entry) => {
      if (!entry || Object.keys(entry).length === 0) {
        return { date: "No data", avg: 0 };
      }

      const userFootprints = {};

      Object.keys(entry).forEach((key) => {
        if (key !== "date" && key !== "totalAvg") {
          userFootprints[key] = entry[key] ? Number(entry[key]) : 0;
        }
      });

      const avg = entry.totalAvg || 0; 

      return {
        date: entry.date,
        avg,
        ...userFootprints, 
      };
    });
  };

  const transformedData = transformData(dailyTrends);

  const userEmails = transformedData.reduce((emails, entry) => {
    Object.keys(entry).forEach((key) => {
      if (key !== "date" && key !== "avg") {
        if (!emails.includes(key)) emails.push(key); // Add email if not already in list
      }
    });
    return emails;
  }, []);


  const chartRef = useRef();
  const leaderboardRef = useRef();

  const handleExportImage = () => {
    html2canvas(chartRef.current).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = 'chart.png';
      link.click();
    });


    html2canvas(leaderboardRef.current).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = 'leaderboard.png';
      link.click();
    });
    
  };

  const handleExportPDF = () => {
    const currentDate = new Date().toLocaleDateString(); // Get the current date in the format "MM/DD/YYYY"

    html2canvas(chartRef.current, {
      scale: 2, // Increase scale for better image quality
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4'); // Portrait orientation, A4 size

      // Add title and date text
      pdf.setFontSize(16);
      pdf.text('Daily Footprint Trends', 10, 10); // Add title at the top-left
      pdf.text(`Downloaded on Date: ${currentDate}`, 10, 20); // Add current date below the title

      // Add the image below the title (adjusting position and size)
      const imageWidth = 180; // Image width for the PDF (adjust as needed)
      const imageHeight = (canvas.height * imageWidth) / canvas.width; // Maintain aspect ratio
      pdf.addImage(imgData, 'PNG', 10, 30, imageWidth, imageHeight);

      // Save the PDF
      pdf.save(`Footprint_Trends_${currentDate.replace(/\//g, '-')}.pdf`); // Replace slashes in date for filename
    });


    html2canvas(leaderboardRef.current, {
      scale: 2, // Increase scale for better image quality
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4'); // Portrait orientation, A4 size
    
      // Add title and date text
      pdf.setFontSize(16);
      pdf.text('Ecosteps Leaderboard', 10, 10); // Add title at the top-left
      pdf.text(`Downloaded on Date: ${currentDate}`, 10, 20); // Add current date below the title
      // Add the image below the title (adjusting position and size)
      const imageWidth = 180; // Image width for the PDF (adjust as needed)
      const imageHeight = (canvas.height * imageWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 30, imageWidth, imageHeight);

      // Save the PDF
      pdf.save(`Footprint_Leaderboard_${currentDate.replace(/\//g, '-')}.pdf`); // Replace slashes in date for filename
    }
    );

  };

  const CustomLegend = (props) => {
    const { payload } = props;

    return (
      <ul style={{ paddingLeft: '0px', display: 'flex', flexDirection: 'row' }}>
        {payload.map((entry, index) => (
          <li key={index} style={{ marginRight: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: entry.color,
                  borderRadius: '50%',
                  marginRight: '8px',
                }}
              />
              <span>{entry.value}</span>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Footprint Summary</h1>
          <p className="text-muted-foreground">Analyze carbon footprint trends and patterns</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="average" onValueChange={(value) => setFilter(value as 'average' | 'all' | 'user' | 'compare')}>
            <SelectTrigger className="w-72">
              <SelectValue>{filter === 'average' ? 'Carbon Emission Average "(kg C02)' : filter === 'all' ? 'All' : filter === 'user' ? 'Single User' : 'Compare Users'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="average">Carbon Emission Average "(kg C02)"</SelectItem>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="user">Single User</SelectItem>
              <SelectItem value="compare">Compare Users</SelectItem>
            </SelectContent>
          </Select>
              {filter === 'compare' && (
                <div className="flex gap-2">
                  <Select
                    value={selectedUsers[0] || ''}
                    onValueChange={(value) => setSelectedUsers([value, selectedUsers[1]])}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue>{selectedUsers[0] || 'Select User 1'}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {userEmails.map((email) => (
                        <SelectItem key={email} value={email}>
                          {email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                    
                  <Select
                    value={selectedUsers[1] || ''}
                    onValueChange={(value) => setSelectedUsers([selectedUsers[0], value])}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue>{selectedUsers[1] || 'Select User 2'}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {userEmails.map((email) => (
                        <SelectItem key={email} value={email}>
                          {email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {filter === 'user' && (
                <Select
                  value={selectedUsers[0] || ''}
                  onValueChange={(value) => setSelectedUsers([value])}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue>{selectedUsers[0] || 'Select User'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {userEmails.map((email) => (
                      <SelectItem key={email} value={email}>
                        {email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Your cards here */}
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>
        <div className="flex justify-end gap-2">
          <Button onClick={handleExportImage} variant="outline">
            Export as Image
          </Button>
          <Button onClick={handleExportPDF} variant="outline">
            Export as PDF
          </Button>
        </div>
        </div>
        {/* Trends Tab Content */}
        <TabsContent value="trends" className="space-y-4">
          <Card className="shadow-sm border-admin-border" ref={chartRef}>
            <CardHeader>
                <CardTitle className="text-lg">Daily Footprint Trends</CardTitle>
                <p className="text-sm text-muted-foreground">Compare individual users and platform average</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350} >
                  <LineChart data={transformedData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px hsl(0 0% 0% / 0.1)',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value, name) => {
                        if (typeof value === "number") {
                          return [`${value.toFixed(2)} kg CO₂`, name];
                        }
                        return [`0 kg CO₂`, name];
                      }}
                    />

                    {/* All */}
                    {filter === 'all' && userEmails.map((email, index) => (
                      <Line
                        key={email}
                        type="monotone"
                        dataKey={email}
                        stroke={`hsl(var(--chart-${index + 1}))`}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name={email}
                        connectNulls={true}
                      />
                    ))}

                    {/* Render platform average line if the filter is 'platform' */}
                    {filter === 'average' && (
                      <Line
                        type="monotone"
                        dataKey="avg"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        name="Carbon Emission Average (kg C02)"
                        connectNulls={true}
                      />
                    )}

                    {/* Render a single user's line if the filter is 'user' */}
                    {filter === 'user' && selectedUsers.length === 1 && (
                      <Line
                        type="monotone"
                        dataKey={selectedUsers[0]}
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        name={selectedUsers[0]}
                        connectNulls={true}
                      />
                    )}

                    {/* Render two users' lines if the filter is 'compare' */}
                    {filter === 'compare' && selectedUsers.length === 2 && (
                      selectedUsers.map((email, index) => (
                        <Line
                          key={email}
                          type="monotone"
                          dataKey={email}
                          stroke={`hsl(var(--chart-${index + 1}))`}
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name={email}
                          connectNulls={true}
                        />
                      ))
                    )}

                    <Legend content={<CustomLegend />} />
                  </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card className="shadow-sm border-admin-border" ref={leaderboardRef}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-chart-3" />
                Carbon Footprint Leaderboard
              </CardTitle>
              <p className="text-sm text-muted-foreground">Lowest footprint users (best performers)</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboardData.map((user) => (
                  <div key={user.rank} className="flex items-center justify-between p-3 rounded-lg border border-admin-border hover:bg-admin-hover transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        user.rank === 1 ? 'bg-chart-3 text-chart-3-foreground' :
                        user.rank === 2 ? 'bg-muted text-muted-foreground' :
                        user.rank === 3 ? 'bg-warning/20 text-warning' :
                        'bg-admin-hover text-foreground'
                      }`}>
                        {user.rank}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{user.user}</p>
                        <p className="text-xs text-muted-foreground">Daily average: {user.footprint} kg CO₂</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={user.change < 0 ? "default" : "secondary"} className="text-xs">
                        {user.change > 0 ? '+' : ''}{user.change}%
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">this month</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default FootprintSummary