import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Car,
  UtensilsCrossed,
  Home,
  Save,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import useSessionStatus from "../hooks/useSessionStatus";

import {
  listDailyTrackings,
  updateDailyTracking,
  deleteDailyTrackingAdmin,
} from "../lib/api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const ActivityLogs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [activityData, setActivityData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();
  const { isPending } = useSessionStatus();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch Data
  const fetchUsers = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await listDailyTrackings({ page, limit: 20 });
      const dataArray = response.data || response.data?.data || [];
      const total = response.total || response.data?.total || 0;
      const totalPagesCount =
        response.totalPages || response.data?.totalPages || 1;

      setActivityData(dataArray);
      setCurrentPage(page);
      setTotalUsers(total);
      setTotalPages(totalPagesCount);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const filteredLogs = activityData.filter((log) => {
    const matchesSearch =
      (log.createdAt?.toLowerCase() || "").includes(
        searchQuery.toLowerCase(),
      ) || (log.email?.toLowerCase() || "").includes(searchQuery.toLowerCase());

    let matchesDate = true;
    if (dateRange !== "all") {
      const logDate = new Date(log.createdAt);
      const now = new Date();

      switch (dateRange) {
        case "today":
          matchesDate = logDate.toDateString() === now.toDateString();
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = logDate >= weekAgo;
          break;
        case "month":
          const monthAgo = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            now.getDate(),
          );
          matchesDate = logDate >= monthAgo;
          break;
      }
    }

    return matchesSearch && matchesDate;
  });

  const todayLogs = filteredLogs.filter(
    (log) =>
      new Date(log.createdAt).toDateString() === new Date().toDateString(),
  );

  const handleViewDetails = (log: any) => {
    setSelectedLog(log);
    setIsEditing(false);
  };

  const handleEditLog = (log: any) => {
    setSelectedLog(log);
    setEditData({ ...log });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const total = parseFloat(
        (
          parseFloat(editData.transport) +
          parseFloat(editData.food) +
          parseFloat(editData.homeEnergy)
        ).toFixed(1),
      );

      const payload = {
        transport: editData.transport,
        food: editData.food,
        homeEnergy: editData.homeEnergy,
        total,
      };

      await updateDailyTracking(editData._id, payload);

      setActivityData((prev) =>
        prev.map((log) =>
          log._id === editData._id ? { ...log, ...payload } : log,
        ),
      );

      toast({
        title: "Log Updated",
        description: `Log ${editData._id} has been successfully updated.`,
      });

      setIsEditing(false);
      setSelectedLog(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update log",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLog = async (log) => {
    setIsDeleting(true);
    try {
      await deleteDailyTrackingAdmin(log._id);

      setActivityData((prev) => prev.filter((item) => item._id !== log._id));

      toast({
        title: "Log Deleted",
        description: `Log ${log._id} has been deleted.`,
      });

      setSelectedLog(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete log",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getHighestCategoryAvg = (logs: any[]) => {
    if (logs.length === 0) return { category: "N/A", avg: 0 };

    const totalTransport = logs.reduce(
      (sum, log) => sum + (log.transport || 0),
      0,
    );
    const totalFood = logs.reduce((sum, log) => sum + (log.food || 0), 0);
    const totalHome = logs.reduce((sum, log) => sum + (log.homeEnergy || 0), 0);

    const avgTransport = totalTransport / logs.length;
    const avgFood = totalFood / logs.length;
    const avgHome = totalHome / logs.length;

    const avgs = [
      { category: "Transport", avg: avgTransport },
      { category: "Food", avg: avgFood },
      { category: "Home Energy", avg: avgHome },
    ];

    return avgs.reduce(
      (max, current) => (current.avg > max.avg ? current : max),
      avgs[0],
    );
  };

  const exportToCSV = () => {
    const headers = ["User", "Transport", "Food", "Home", "Total", "Date"];
    const rows = filteredLogs.map((log) => [
      log.email,
      log.transport,
      log.food,
      log.homeEnergy,
      log.total,
      log.createdAt
        ? new Date(log.createdAt).toISOString().split("T")[0]
        : "N/A",
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const timestamp = new Date().toISOString().split("T")[0];

    link.href = url;
    link.download = `Activity_Logs_${timestamp}.csv`;
    link.click();
  };

  const Pagination = () => {
    const startItem = (currentPage - 1) * 10 + 1;
    const endItem = Math.min(currentPage * 10, totalUsers);

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50 rounded-md">
        <div className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {totalUsers} users
          {searchQuery && ` (${filteredLogs.length} matching)`}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUsers(currentPage - 1)}
            disabled={currentPage === 1 || isLoading || !!searchQuery}
            className="h-8 w-20"
          >
            Previous
          </Button>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUsers(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading || !!searchQuery}
            className="h-8 w-20"
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading || isPending) {
    return <Spinner />;
  }

  const highestCategory = getHighestCategoryAvg(filteredLogs);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daily Activity Logs</h1>
          <p className="text-muted-foreground">
            Monitor and manage user footprint submissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm border-admin-border">
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user or log ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <Filter className="h-4 w-4" />
            All Logs ({filteredLogs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card className="shadow-sm border-admin-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Activity Logs
                <Badge variant="outline">{filteredLogs.length} logs</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Transport CO₂
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Food CO₂
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Home CO₂
                      </TableHead>
                      <TableHead>Total CO₂</TableHead>
                      <TableHead className="sticky right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-[50px]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => {
                      return (
                        <TableRow
                          key={log._id}
                          className="hover:bg-admin-hover"
                        >
                          <TableCell className="font-medium">
                            {log.createdAt
                              ? new Date(log.createdAt)
                                  .toISOString()
                                  .split("T")[0]
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{log.email}</div>
                              <div className="text-xs text-muted-foreground sm:hidden">
                                {log.total} kg
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {log.transport} kg
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {log.food} kg
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {log.homeEnergy} kg
                          </TableCell>
                          <TableCell className="font-semibold">
                            {log.total} kg
                          </TableCell>
                          <TableCell className="sticky right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  className="gap-2"
                                  onClick={() => handleViewDetails(log)}
                                >
                                  <Eye className="h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="gap-2"
                                  onClick={() => handleEditLog(log)}
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit Log
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />

                                <ConfirmDialog
                                  trigger={
                                    <DropdownMenuItem
                                      className="gap-2 text-destructive"
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Delete Log
                                    </DropdownMenuItem>
                                  }
                                  title="Confirm Delete"
                                  description={`Are you sure you want to delete ${log.email}'s activity log? This action cannot be undone.`}
                                  confirmText="Delete"
                                  variant="destructive"
                                  onConfirm={() => handleDeleteLog(log)}
                                />
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <Pagination />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-admin-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Daily Footprint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {(
                filteredLogs.reduce((sum, log) => sum + log.total, 0) /
                filteredLogs.length
              ).toFixed(1)}{" "}
              kg
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              CO₂ equivalent per day
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-admin-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Highest Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">
              {highestCategory.category}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {highestCategory.avg.toFixed(1)} kg avg
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-admin-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Logs Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-eco">
              {todayLogs.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Submitted on {new Date().toDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Log Details/Edit Dialog */}
      <Dialog
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEditing ? (
                <Edit className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
              {isEditing ? "Edit Activity Log" : "Activity Log Details"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modify the emission values for this log entry"
                : `Detailed view of log ${selectedLog?.id}`}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Log ID</Label>
                  <div className="p-2 bg-muted rounded-md text-sm">
                    {selectedLog._id}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date</Label>
                  <div className="p-2 bg-muted rounded-md text-sm">
                    {selectedLog.createdAt
                      ? new Date(selectedLog.createdAt)
                          .toISOString()
                          .split("T")[0]
                      : "N/A"}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">User</Label>
                <div className="p-2 bg-muted rounded-md text-sm">
                  {selectedLog.email}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Transport CO₂ (kg)
                  </Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.1"
                      value={editData.transport}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          transport: parseFloat(e.target.value),
                        })
                      }
                    />
                  ) : (
                    <div className="p-2 bg-muted rounded-md text-sm">
                      {selectedLog.transport}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <UtensilsCrossed className="h-4 w-4" />
                    Food CO₂ (kg)
                  </Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.1"
                      value={editData.food}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          food: parseFloat(e.target.value),
                        })
                      }
                    />
                  ) : (
                    <div className="p-2 bg-muted rounded-md text-sm">
                      {selectedLog.food}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Home CO₂ (kg)
                  </Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.1"
                      value={editData.homeEnergy}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          homeEnergy: parseFloat(e.target.value),
                        })
                      }
                    />
                  ) : (
                    <div className="p-2 bg-muted rounded-md text-sm">
                      {selectedLog.homeEnergy}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Total CO₂ Emissions
                </Label>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {isEditing
                      ? (
                          editData.transport +
                          editData.food +
                          editData.homeEnergy
                        ).toFixed(1)
                      : selectedLog.total}{" "}
                    kg
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Daily carbon footprint
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button onClick={handleSaveEdit} className="flex-1 gap-2">
                      <Save className="h-4 w-4" />
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => handleEditLog(selectedLog)}
                      className="flex-1 gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Log
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedLog(null)}
                      className="flex-1"
                    >
                      Close
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActivityLogs;
