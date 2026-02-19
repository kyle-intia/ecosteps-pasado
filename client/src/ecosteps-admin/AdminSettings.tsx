import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Settings as SettingsIcon,
  Database,
  Brain,
  Palette,
  Users,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit,
} from "lucide-react";
import {
  listUsers,
  createEmissionFactor,
  getAllEmissionFactors,
  getEmissionFactorById,
  updateEmissionFactor,
  deleteEmissionFactor,
  getMaintenanceMode,
  toggleMaintenance,
  getPushNotificationMode,
  togglePushNotification,
} from "../lib/api";

const AdminSettings = () => {
  const [emissionFactors, setEmissionFactors] = useState([]);
  const [aiModel, setAiModel] = useState("gpt-4");
  const [enableFlightLogging, setEnableFlightLogging] = useState(false);
  const [pushNotificationMode, setPushNotificationMode] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [editingFactor, setEditingFactor] = useState<any>(null);
  const [isAddingFactor, setIsAddingFactor] = useState(false);
  const [newFactor, setNewFactor] = useState({
    category: "",
    type: "",
    unit: "",
    value: "",
    source: "",
  });
  const { toast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchFactors = async () => {
      try {
        const factors = await getAllEmissionFactors();
        setEmissionFactors(factors);
      } catch (error) {
        console.error("Failed to fetch emission factors", error);
        toast({
          title: "Error",
          description: "Failed to fetch emission factors",
          variant: "destructive",
        });
      }
    };
    fetchFactors();
  }, []);

  const handleEditFactor = async (factor, index) => {
    try {
      const detailedFactor = await getEmissionFactorById(factor._id);
      setEditingFactor(detailedFactor);
    } catch (error) {
      console.error("Failed to fetch factor details", error);
      toast({
        title: "Error",
        description: "Failed to fetch factor details",
        variant: "destructive",
      });
    }
  };

  const handleSaveFactor = async () => {
    if (!editingFactor) return;
    try {
      const updated = await updateEmissionFactor(
        editingFactor._id,
        editingFactor,
      );
      setEmissionFactors((prev) =>
        prev.map((f) => (f._id === updated._id ? updated : f)),
      );
      setEditingFactor(null);
      toast({
        title: "Success",
        description: "Emission factor updated successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to update factor", error);
      toast({
        title: "Error",
        description: "Failed to update factor",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFactor = async (factor) => {
    if (
      !confirm(
        `Are you sure you want to delete the factor for ${factor.category}?`,
      )
    )
      return;
    try {
      await deleteEmissionFactor(factor._id);
      setEmissionFactors((prev) => prev.filter((f) => f._id !== factor._id));
      toast({
        title: "Deleted",
        description: "Emission factor deleted successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to delete factor", error);
      toast({
        title: "Error",
        description: "Failed to delete factor",
        variant: "destructive",
      });
    }
  };

  const handleAddFactor = async () => {
    if (!newFactor.category || !newFactor.unit || !newFactor.value) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    try {
      const created = await createEmissionFactor(newFactor);
      setEmissionFactors((prev) => [...prev, created]);
      setNewFactor({ category: "", type: "", unit: "", value: "", source: "" });
      setIsAddingFactor(false);
      toast({
        title: "Success",
        description: "New emission factor added successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to add new factor", error);
      toast({
        title: "Error",
        description: "Failed to add new factor",
        variant: "destructive",
      });
    }
  };

  const fetchUsers = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await listUsers({ page, limit: 10 });

      const usersArray = response.users || response.data?.users || [];
      const total = response.total || response.data?.total || 0;
      const totalPagesCount =
        response.totalPages || response.data?.totalPages || 1;
      const adminUsers = usersArray.filter((user) => user.role === "admin");

      setUsers(adminUsers);
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

  useEffect(() => {
    async function fetchMaintenanceStatus() {
      try {
        const response = await getMaintenanceMode();
        setMaintenanceMode(response.maintenanceMode);
      } catch (error) {
        console.error("Failed to fetch maintenance status:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMaintenanceStatus();
  }, []);

  useEffect(() => {
    async function fetchPushNotificationStatus() {
      try {
        const response = await getPushNotificationMode();
        setPushNotificationMode(response.pushNotificationMode);
      } catch (error) {
        console.error("Failed to fetch push notification status:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPushNotificationStatus();
  }, []);

  const handleMaintenanceToggle = async (checked) => {
    setMaintenanceMode(checked);
    try {
      await toggleMaintenance({ maintenanceMode: checked });
    } catch (error) {
      console.error("Failed to toggle maintenance mode:", error);
    }
  };

  const handlePushToggle = async (checked) => {
    setPushNotificationMode(checked);
    try {
      await togglePushNotification({ pushNotificationMode: checked });
    } catch (error) {
      console.error("Failed to toggle maintenance mode:", error);
    }
  };

  if (loading) return <p>Loading maintenance status...</p>;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure platform settings and administrative options
          </p>
        </div>
      </div>

      <Tabs defaultValue="app" className="space-y-4">
        <TabsList>
          <TabsTrigger value="app" className="gap-2">
            <Database className="h-4 w-4" />
            App Settings
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Brain className="h-4 w-4" />
            AI Configuration
          </TabsTrigger>
          <TabsTrigger value="admins" className="gap-2">
            <Users className="h-4 w-4" />
            Admin Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="app" className="space-y-4">
          <Card className="shadow-sm border-admin-border">
            <CardHeader>
              <CardTitle className="text-lg">Emission Factors</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure CO₂ emission calculation factors
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>CO₂ Factor (kg)</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emissionFactors.map((factor, index) => (
                    <TableRow
                      key={factor._id || index}
                      className="hover:bg-admin-hover"
                    >
                      <TableCell className="font-medium">
                        {factor.category}
                      </TableCell>
                      <TableCell>{factor.type}</TableCell>
                      <TableCell>{factor.unit}</TableCell>
                      <TableCell>{factor.value}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{factor.source}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleEditFactor(factor, index)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteFactor(factor)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="default"
                  className="gap-2"
                  onClick={() => setIsAddingFactor(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Factor
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-admin-border">
            <CardHeader>
              <CardTitle className="text-lg">System Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                General platform configuration
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="support-email">Support Email</Label>
                    <Input
                      id="support-email"
                      type="email"
                      defaultValue="support@ecosteps.online"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Maintenance Mode</Label>
                      <p className="text-xs text-muted-foreground">
                        Temporarily disable user access
                      </p>
                    </div>
                    <Switch
                      checked={maintenanceMode}
                      onCheckedChange={handleMaintenanceToggle}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-xs text-muted-foreground">
                        Send notifications to users
                      </p>
                    </div>
                    <Switch
                      checked={pushNotificationMode}
                      onCheckedChange={handlePushToggle}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card className="shadow-sm border-admin-border opacity-60">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                AI Model Configuration
                <Badge variant="secondary" className="text-xs">
                  Coming Soon
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure AI recommendation settings
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ai-model">AI Model</Label>
                    <Select value={aiModel} onValueChange={setAiModel} disabled>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4">
                          GPT-4 (Recommended)
                        </SelectItem>
                        <SelectItem value="gpt-3.5">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="claude">Claude 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature</Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      defaultValue="0.7"
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Lower = more focused, Higher = more creative
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-tokens">Max Tokens</Label>
                    <Input
                      id="max-tokens"
                      type="number"
                      defaultValue="150"
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="system-prompt">System Prompt</Label>
                    <Textarea
                      id="system-prompt"
                      className="min-h-[120px]"
                      defaultValue="You are a helpful AI assistant specialized in providing carbon footprint reduction recommendations. Focus on practical, actionable advice that users can easily implement in their daily lives."
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recommendation-frequency">
                      Recommendation Frequency
                    </Label>
                    <Select defaultValue="weekly" disabled>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="space-y-4">
          <Card className="shadow-sm border-admin-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Admin Users
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage administrative access and permissions
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="w-[100px]">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((admin) => (
                    <TableRow key={admin._id} className="hover:bg-admin-hover">
                      <TableCell className="font-medium">
                        {admin._id?.slice(-6) || "N/A"}
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            admin.role === "admin" ? "destructive" : "default"
                          }
                        >
                          {admin.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{getDaysAgo(admin.lastActive)}</TableCell>
                      <TableCell>
                        {admin.createdAt
                          ? new Date(admin.createdAt)
                              .toISOString()
                              .split("T")[0]
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Factor Dialog */}
      <Dialog
        open={!!editingFactor}
        onOpenChange={(open) => !open && setEditingFactor(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Emission Factor
            </DialogTitle>
            <DialogDescription>
              Modify the CO₂ emission factor for {editingFactor?.category}
            </DialogDescription>
          </DialogHeader>

          {editingFactor && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={editingFactor.category}
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Input
                  value={editingFactor.type}
                  onChange={(e) =>
                    setEditingFactor({ ...editingFactor, type: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Unit</Label>
                <Select
                  value={editingFactor.unit}
                  onValueChange={(value) =>
                    setEditingFactor({ ...editingFactor, unit: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg CO₂e per km">
                      kg CO₂e per km
                    </SelectItem>
                    <SelectItem value="annual kg CO₂e">
                      annual kg CO₂e
                    </SelectItem>
                    <SelectItem value="percentage increase">
                      percentage increase
                    </SelectItem>
                    <SelectItem value="kg CO₂e per meal">
                      kg CO₂e per meal
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>CO₂ Factor (kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingFactor.value}
                  onChange={(e) =>
                    setEditingFactor({
                      ...editingFactor,
                      value: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Input
                  value={editingFactor.source}
                  onChange={(e) =>
                    setEditingFactor({
                      ...editingFactor,
                      source: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveFactor} className="flex-1">
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingFactor(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Factor Dialog */}
      <Dialog open={isAddingFactor} onOpenChange={setIsAddingFactor}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Emission Factor
            </DialogTitle>
            <DialogDescription>
              Create a new CO₂ emission calculation factor
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Input
                value={newFactor.category}
                onChange={(e) =>
                  setNewFactor({ ...newFactor, category: e.target.value })
                }
                placeholder="e.g., transport, flights, electricity"
              />
            </div>
            <div className="space-y-2">
              <Label>Type *</Label>
              <Input
                value={newFactor.type}
                onChange={(e) =>
                  setNewFactor({ ...newFactor, type: e.target.value })
                }
                placeholder="e.g., Motorcycle, Fish, Solar"
              />
            </div>
            <div className="space-y-2">
              <Label>Unit *</Label>
              <Select
                value={newFactor.unit}
                onValueChange={(value) =>
                  setNewFactor({ ...newFactor, unit: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg CO₂e per km">kg CO₂e per km</SelectItem>
                  <SelectItem value="annual kg CO₂e<">
                    annual kg CO₂e
                  </SelectItem>
                  <SelectItem value="percentage increase">
                    percentage increase
                  </SelectItem>
                  <SelectItem value="kg CO₂e per meal">
                    kg CO₂e per meal
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>CO₂ Factor (kg) *</Label>
              <Input
                type="number"
                step="0.01"
                value={newFactor.value}
                onChange={(e) =>
                  setNewFactor({ ...newFactor, value: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Input
                value={newFactor.source}
                onChange={(e) =>
                  setNewFactor({ ...newFactor, source: e.target.value })
                }
                placeholder="e.g., DEFRA 2024, EPA 2024"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddFactor} className="flex-1">
                Add Factor
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAddingFactor(false)}
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

export default AdminSettings;
