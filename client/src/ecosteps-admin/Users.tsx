import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  MoreHorizontal,
  UserPlus,
  Download,
  Eye,
  UserX,
  RotateCcw,
  Mail,
  Calendar,
  Activity,
} from "lucide-react";
import {
  listUsers,
  createUser,
  updateStatus,
  changeRole,
  getDailyTrackingByUserId,
} from "../lib/api";
import { Spinner } from "@/components/ui/spinner";
import useSessionStatus from "../hooks/useSessionStatus";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const Users = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    role: "user",
    verified: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const { isPending } = useSessionStatus();

  const fetchUsers = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await listUsers({ page, limit: 10 });

      const usersArray = response.users || response.data?.users || [];
      const total = response.total || response.data?.total || 0;
      const totalPagesCount =
        response.totalPages || response.data?.totalPages || 1;

      setUsers(usersArray);
      setCurrentPage(page);
      setTotalUsers(total);
      setTotalPages(totalPagesCount);
    } catch (error) {
      console.error("Error fetching users:", error);
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

  const filteredUsers = searchQuery
    ? users.filter(
        (user) =>
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (user.id &&
            user.id.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : users;

  const handleUserAction = async (action: string, user: any) => {
    try {
      if (action === "Suspend User") {
        await updateStatus(user._id, "suspended");
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u._id === user._id ? { ...u, status: "suspended" } : u,
          ),
        );
        toast({
          title: "User Suspended",
          description: `${user.email} has been suspended`,
        });
      } else if (action === "Reactivate User") {
        await updateStatus(user._id, "active");
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u._id === user._id ? { ...u, status: "active" } : u,
          ),
        );
        toast({
          title: "User Reactivated",
          description: `${user.email} has been reactivated`,
        });
      } else if (action === "Export Logs") {
        toast({
          title: "Action Performed",
          description: `Exporting logs for ${user.email}`,
        });

        const response = await getDailyTrackingByUserId(user._id);

        const logs = Array.isArray(response) ? response : [];

        const headers = ["User", "Transport", "Food", "Home", "Total", "Date"];

        const rows = logs.map((log: any) => {
          const transportSummary =
            log.transport?.modes
              ?.map((mode: any) => `${mode.id}: ${mode.distance} km`)
              .join("; ") || "";

          const foodSummary = log.food
            ? `Breakfast: ${log.food.breakfast || "N/A"}; Lunch: ${log.food.lunch || "N/A"}; Dinner: ${log.food.dinner || "N/A"}`
            : "";

          const homeEnergySummary = log.homeEnergy
            ? `Type: ${log.homeEnergy.homeType || "N/A"}, Occupants: ${log.homeEnergy.occupants || "N/A"}`
            : "";

          return [
            user.email,
            transportSummary,
            foodSummary,
            homeEnergySummary,
            log.calculatedFootprint?.total ?? "",
            log.createdAt
              ? new Date(log.createdAt).toLocaleDateString()
              : "N/A",
          ];
        });

        const csv = [headers, ...rows]
          .map((row) =>
            row
              .map((field) => `"${String(field).replace(/"/g, '""')}"`)
              .join(","),
          )
          .join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const timestamp = new Date().toISOString().split("T")[0];
        link.href = url;
        link.download = `${user.email}_Activity_Logs_${timestamp}.csv`;
        document.body.appendChild(link); // for Firefox support
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("User action error:", error);
      toast({
        title: "Error",
        description: `Failed to ${action.toLowerCase()} for ${user.email}`,
        variant: "destructive",
      });
    }
  };

  const handleViewProfile = (user) => {
    setSelectedUser(user);
  };

  const handleAddUser = async () => {
    if (!newUser.email || newUser.password.length < 6) {
      return toast({
        title: "Validation Error",
        description:
          "Please enter a valid email and password (min 6 characters).",
        variant: "destructive",
      });
    }

    try {
      const response = await createUser(newUser);

      const newUserDataToAdd =
        response?.user ||
        response?.data?.user ||
        response?.data ||
        response?.users?.[0] ||
        response ||
        null;

      if (newUserDataToAdd) {
        setUsers((prevUsers) => [...prevUsers, newUserDataToAdd]);
        toast({
          title: "User Added",
          description: `User ${newUser.email} has been successfully added.`,
        });
        setNewUser({ email: "", password: "", role: "user", verified: true });
        setIsAddUserOpen(false);
      }
    } catch (error) {
      console.error("Add user error:", error);
      toast({
        title: "Error",
        description: "Failed to add user",
        variant: "destructive",
      });
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "active":
        return "default";
      case "suspended":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getRoleVariant = (role) => {
    switch (role) {
      case "user":
        return "default";
      case "admin":
        return "destructive";
      default:
        return "secondary";
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

  const exportToCSV = () => {
    const headers = [
      "UserId",
      "Email",
      "Joined Date",
      "Last Active",
      "Total Logs",
      "Role",
      "Date",
    ];
    const rows = filteredUsers.map((log) => [
      log.id || log._id || "N/A",
      log.email,
      log.lastActive ? getDaysAgo(log.lastActive) : "N/A",
      log.totalLogs || 0,
      log.status,
      log.role,
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
    link.download = `User_Accounts_${timestamp}.csv`;
    link.click();
  };

  const Pagination = () => {
    const startItem = (currentPage - 1) * 10 + 1;
    const endItem = Math.min(currentPage * 10, totalUsers);

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50 rounded-md">
        <div className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {totalUsers} users
          {searchQuery && ` (${filteredUsers.length} matching)`}
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground">
              Manage your platform users and their activity
            </p>
          </div>
        </div>
        <Card className="shadow-sm border-admin-border">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isPending) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage your platform users and their activity
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2" onClick={() => setIsAddUserOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-admin-border">
        <CardHeader>
          <CardTitle className="text-lg">Users</CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Badge variant="outline">
              {searchQuery ? filteredUsers.length : totalUsers} users
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && users.length > 0 ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">
                Updating...
              </span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchQuery ? "No users match your search" : "No users found"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Joined Date
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Last Active
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Total Logs
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Status
                      </TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="sticky right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-[50px]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user._id} className="hover:bg-admin-hover">
                        <TableCell className="font-medium">
                          {user._id?.slice(-6) || "N/A"}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.email}</div>
                            <div className="text-xs text-muted-foreground sm:hidden">
                              {user.status} • {user.totalLogs || 0} logs
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {user.createdAt
                            ? new Date(user.createdAt)
                                .toISOString()
                                .split("T")[0]
                            : "N/A"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {getDaysAgo(user.lastActive)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {user.totalLogs || 0}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant={getStatusVariant(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleVariant(user.role)}>
                            {user.role}
                          </Badge>
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
                                onClick={() => handleViewProfile(user)}
                              >
                                <Eye className="h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2"
                                disabled={user.totalLogs === 0}
                                onClick={() =>
                                  handleUserAction("Export Logs", user)
                                }
                              >
                                <Download className="h-4 w-4" />
                                Export Logs
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status === "active" ? (
                                <ConfirmDialog
                                  trigger={
                                    <DropdownMenuItem
                                      className="gap-2 text-destructive"
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      <UserX className="h-4 w-4" />
                                      Suspend User
                                    </DropdownMenuItem>
                                  }
                                  title="Confirm Suspend User"
                                  description={`Are you sure you want to suspend ${user.email}? The user will lose access to the platform until reactivated.`}
                                  confirmText="Suspend"
                                  variant="destructive"
                                  onConfirm={() =>
                                    handleUserAction("Suspend User", user)
                                  }
                                />
                              ) : (
                                <ConfirmDialog
                                  trigger={
                                    <DropdownMenuItem
                                      className="gap-2 text-eco"
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                      Reactivate User
                                    </DropdownMenuItem>
                                  }
                                  title="Confirm Reactivate User"
                                  description={`Are you sure you want to reactivate ${user.email}? The user will regain access to the platform.`}
                                  confirmText="Reactivate"
                                  onConfirm={() =>
                                    handleUserAction("Reactivate User", user)
                                  }
                                />
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Pagination />
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-admin-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-eco">
              {users.filter((u) => u.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalUsers > 0
                ? Math.round(
                    (users.filter((u) => u.status === "active").length /
                      totalUsers) *
                      100,
                  )
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-admin-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Logs per User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {users.length > 0
                ? Math.round(
                    users.reduce(
                      (sum, user) => sum + (user.totalLogs || 0),
                      0,
                    ) / users.length,
                  )
                : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total:{" "}
              {users.reduce((sum, user) => sum + (user.totalLogs || 0), 0)} logs
              (current page)
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-admin-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {totalPages} pages
            </p>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              User Profile
            </DialogTitle>
            <DialogDescription>
              Detailed information about {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">User ID</Label>
                  <div className="p-2 bg-muted rounded-md text-sm">
                    {selectedUser.id || selectedUser._id?.slice(-6) || "N/A"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="p-2 rounded-md text-sm">
                    <Badge variant="default">
                      {selectedUser.status || "active"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <div className="p-2 bg-muted rounded-md text-sm">
                  {selectedUser.email}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Join Date
                  </Label>
                  <div className="p-2 bg-muted rounded-md text-sm">
                    {selectedUser.createdAt
                      ? new Date(selectedUser.createdAt)
                          .toISOString()
                          .split("T")[0]
                      : "N/A"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Last Active
                  </Label>
                  <div className="p-2 bg-muted rounded-md text-sm">
                    {getDaysAgo(selectedUser.lastActive)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Activity Summary</Label>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Logs Submitted
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {selectedUser.totalLogs || 0}
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-eco transition-all duration-300"
                      style={{
                        width: `${Math.min(((selectedUser.totalLogs || 0) / 30) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Progress towards monthly goal (30 logs)
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    handleUserAction("Export All Logs", selectedUser)
                  }
                  className="flex-1 gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export All Logs
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New User
            </DialogTitle>
            <DialogDescription>
              Create a new user account for the platform
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email Address *</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                placeholder="user@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Password *</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                placeholder="password"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Role</Label>
              <Select
                value={newUser.role}
                onValueChange={(value) =>
                  setNewUser({ ...newUser, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddUser}
                className="flex-1 gap-2"
                disabled={!newUser.email}
              >
                <UserPlus className="h-4 w-4" />
                Add User
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAddUserOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
