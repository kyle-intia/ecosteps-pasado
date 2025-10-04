import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Award, Plus, Download, Search, Filter, Pencil, Trash2 } from "lucide-react"
import * as LucideIcons from "lucide-react";
import { Textarea } from "@/components/ui/textarea"
import IconPicker from "@/components/iconPicker";
import { createAchievements, getAchievements, getAchievementsId, updateAchievements, deleteAchievements } from "../lib/api"

interface Achievement {
  _id?: string
  achievementId: string
  name: string
  description: string
  category: string
  tier: string
  icon: string
  targetValue: number
  triggerEvent: string
  unlockCondition: string
  profilePriority: number
  notificationPriority: string
}


const categories = ["daily", "transport", "food", "home", "challenge"]
const triggerEvents = ["DAILY_TRACKING_COMPLETE", "CHALLENGE_COMPLETE"]
const tiers = ["bronze", "silver", "gold", "platinum"]
const conditionMetrics = ["stats.totalTrackingDays", "stats.currentStreak", "stats.perfectChallengeWeeks", "stats.totalChallengesCompleted", "stats.homeChallengesCompleted", "stats.foodChallengesCompleted"]
const conditionOperators = [">=", "==", ">"]

export default function BadgeAchievements() {
  const { toast } = useToast()
  const [achievements, setAchievements] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [tierFilter, setTierFilter] = useState("all")
  const [isAddingAchievements, setIsAddingAchievements] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<Achievement>({
    achievementId: "",
    name: "",
    description: "",
    category: "",
    tier: "",
    icon: "",
    targetValue: 0,
    triggerEvent: "",
    unlockCondition: "",
    profilePriority: 0,
    notificationPriority: ""
  })

  const resetForm = () => {
    setFormData({
      achievementId: "",
      name: "",
      description: "",
      category: "",
      tier: "",
      icon: "",
      targetValue: 0,
      triggerEvent: "",
      unlockCondition: "",
      profilePriority: 0,
      notificationPriority: "",
    });
    setConditionMetric("");
    setConditionOperator("");
    setConditionValue("");
  };

  const [conditionMetric, setConditionMetric] = useState("")
  const [conditionOperator, setConditionOperator] = useState("")
  const [conditionValue, setConditionValue] = useState("")

  useEffect(() => {
    const fetchAchievements= async () => {
      try {
        const achievements = await getAchievements()
        setAchievements(achievements)
      } catch (error) {
        console.error("Failed to fetch emission factors", error)
        toast({
          title: "Error",
          description: "Failed to fetch emission factors",
          variant: "destructive",
        })
      }
    }
    fetchAchievements()
  }, [])

  const handleInputChange = (field: keyof Achievement, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddAchievement = async () => {
    if (!formData.achievementId || !formData.name || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
  
    try {
      const unlockCondition = conditionMetric && conditionOperator && conditionValue
        ? `${conditionMetric} ${conditionOperator} ${conditionValue}`
        : formData.unlockCondition;
  
      const created = await createAchievements({
        ...formData,
        unlockCondition
      });
  
      setAchievements((prev) => [...prev, created]);
  
      resetForm()
      setIsAddingAchievements(false);

      toast({
        title: "Success",
        description: "New Badge Achievement added successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to add new Badge Achievement ", error);
      toast({
        title: "Error",
        description: "Failed to add new Badge Achievement",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (achievement: Achievement) => {
    setEditingId(achievement._id)
    setFormData(achievement)
    
    // Parse unlock condition back to parts if possible
    const conditionMatch = achievement.unlockCondition.match(/^(\w+)\s*([<>=!]+)\s*(.+)$/)
    if (conditionMatch) {
      setConditionMetric(conditionMatch[1])
      setConditionOperator(conditionMatch[2])
      setConditionValue(conditionMatch[3])
    }
    setIsEditDialogOpen(true)
  }
  
  const handleUpdateAchievement = async () => {
      if (!formData._id || !formData.name || !formData.category) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }
      setIsLoading(true);
      try {
        const unlockCondition =
          conditionMetric && conditionOperator && conditionValue
            ? `${conditionMetric} ${conditionOperator} ${conditionValue}`
            : formData.unlockCondition;
    
        const updated = await updateAchievements(formData._id, {
          ...formData,
          unlockCondition,
        });
    
        setAchievements((prev) =>
          prev.map((a) => (a._id === formData._id ? updated : a))
        );
    
        toast({
          title: "Success",
          description: `Achievement "${formData.name}" has been updated`,
        });
  
        window.location.reload();
    
        setIsEditDialogOpen(false);
        setEditingId(null);
        resetForm();
      } catch (error) {
        console.error("Failed to update achievement", error);
        toast({
          title: "Error",
          description: "Failed to update achievement",
          variant: "destructive",
        });
    } finally {
      setIsLoading(false);
    }
  };
  
  
  const handleDelete = async (id: string) => {
    try {
      await deleteAchievements(id);
      setAchievements((prev) =>
        prev.filter((a) => a._id !== id)
      );
      toast({
        title: "Success",
        description: "Achievement has been deleted",
      });
    } catch (error) {
      console.error("Failed to delete achievement", error);
      toast({
        title: "Error",
        description: "Failed to delete achievement",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };
  

  const handleExport = () => {
    const headers = [
      "Achievement ID",
      "Name",
      "Description",
      "Category",
      "Tier",
      "Icon",
      "Target Value",
      "Trigger Event",
      "Unlock Condition",
      "Profile Priority",
      "Notification Priority"
    ]
    
    const csvRows = [
      headers.join(","),
      ...filteredAchievements.map(achievement => [
        achievement.achievementId,
        `"${achievement.name}"`,
        `"${achievement.description}"`,
        achievement.category,
        achievement.tier,
        achievement.icon,
        achievement.targetValue,
        achievement.triggerEvent,
        `"${achievement.unlockCondition}"`,
        achievement.profilePriority,
        achievement.notificationPriority
      ].join(","))
    ]
    
    const csvContent = csvRows.join("\n")
    const dataBlob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'badge-achievements.csv'
    link.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: "Export Successful",
      description: `Exported ${filteredAchievements.length} achievements to CSV`,
    })
  }

  const filteredAchievements = achievements.filter(achievement => {
    // Ensure name and category are strings before calling .toLowerCase()
    const matchesSearch = 
      (achievement.name && typeof achievement.name === 'string' ? achievement.name.toLowerCase() : '')
        .includes(searchQuery.toLowerCase()) ||
      (achievement.category && typeof achievement.category === 'string' ? achievement.category.toLowerCase() : '')
        .includes(searchQuery.toLowerCase());
  
    const matchesCategory = categoryFilter === "all" || achievement.category === categoryFilter;
    const matchesTier = tierFilter === "all" || achievement.tier === tierFilter;
  
    return matchesSearch && matchesCategory && matchesTier;
  });
  

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Bronze": return "bg-orange-500/10 text-orange-600 border-orange-500/20"
      case "Silver": return "bg-slate-500/10 text-slate-600 border-slate-500/20"
      case "Gold": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
      case "Platinum": return "bg-purple-500/10 text-purple-600 border-purple-500/20"
      default: return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Award className="h-8 w-8 text-primary" />
            Badge Achievements
          </h1>
          <p className="text-muted-foreground">Manage and configure user achievement badges</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Dialog open={isAddingAchievements} onOpenChange={(open) => { setIsAddingAchievements(open); if (!open) resetForm();  }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Achievement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Achievement</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="achievementId">Achievement ID *</Label>
                    <Input
                      id="achievementId"
                      value={formData.achievementId}
                      onChange={(e) => handleInputChange("achievementId", e.target.value)}
                      placeholder="ACH001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="icon">Icon</Label>
                    <IconPicker
                      value={formData.icon}
                      onChange={(value) => handleInputChange("icon", value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Achievement name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Achievement description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tier">Tier</Label>
                    <Select value={formData.tier} onValueChange={(value) => handleInputChange("tier", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiers.map(tier => (
                          <SelectItem key={tier} value={tier}>{tier}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="triggerEvent">Trigger Event</Label>
                  <Select value={formData.triggerEvent} onValueChange={(value) => handleInputChange("triggerEvent", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trigger event" />
                    </SelectTrigger>
                    <SelectContent>
                      {triggerEvents.map(event => (
                        <SelectItem key={event} value={event}>{event}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Unlock Condition</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Select value={conditionMetric} onValueChange={setConditionMetric}>
                      <SelectTrigger>
                        <SelectValue placeholder="Metric" />
                      </SelectTrigger>
                      <SelectContent>
                        {conditionMetrics.map(metric => (
                          <SelectItem key={metric} value={metric}>{metric}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={conditionOperator} onValueChange={setConditionOperator}>
                      <SelectTrigger>
                        <SelectValue placeholder="Operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {conditionOperators.map(op => (
                          <SelectItem key={op} value={op}>{op}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={conditionValue}
                      onChange={(e) => setConditionValue(e.target.value)}
                      placeholder="Value"
                    />
                  </div>
                  {conditionMetric && conditionOperator && conditionValue && (
                    <p className="text-sm text-muted-foreground">
                      Preview: <code className="bg-muted px-2 py-1 rounded">{conditionMetric} {conditionOperator} {conditionValue}</code>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetValue">Target Value</Label>
                    <Input
                      id="targetValue"
                      type="number"
                      value={formData.targetValue}
                      onChange={(e) => handleInputChange("targetValue", Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profilePriority">Profile Priority</Label>
                    <Input
                      id="profilePriority"
                      type="number"
                      value={formData.profilePriority}
                      onChange={(e) => handleInputChange("profilePriority", Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notificationPriority">Notification Priority</Label>
                    <Select value={formData.notificationPriority} onValueChange={(value) => handleInputChange("notificationPriority", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setIsAddingAchievements(false); resetForm(); }} >
                  Cancel
                </Button>
                <Button onClick={handleAddAchievement}>Create Achievement</Button>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) resetForm(); }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Achievement</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-achievementId">Achievement ID *</Label>
                    <Input
                      id="edit-achievementId"
                      value={formData.achievementId}
                      onChange={(e) => handleInputChange("achievementId", e.target.value)}
                      placeholder="ACH001"
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-icon">Icon</Label>
                    <Label htmlFor="icon">Icon</Label>
                    <IconPicker
                      value={formData.icon}
                      onChange={(value) => handleInputChange("icon", value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Achievement name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Achievement description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-tier">Tier</Label>
                    <Select value={formData.tier} onValueChange={(value) => handleInputChange("tier", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiers.map(tier => (
                          <SelectItem key={tier} value={tier}>{tier}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-triggerEvent">Trigger Event</Label>
                  <Select value={formData.triggerEvent} onValueChange={(value) => handleInputChange("triggerEvent", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trigger event" />
                    </SelectTrigger>
                    <SelectContent>
                      {triggerEvents.map(event => (
                        <SelectItem key={event} value={event}>{event}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Unlock Condition</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Select value={conditionMetric} onValueChange={setConditionMetric}>
                      <SelectTrigger>
                        <SelectValue placeholder="Metric" />
                      </SelectTrigger>
                      <SelectContent>
                        {conditionMetrics.map(metric => (
                          <SelectItem key={metric} value={metric}>{metric}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={conditionOperator} onValueChange={setConditionOperator}>
                      <SelectTrigger>
                        <SelectValue placeholder="Operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {conditionOperators.map(op => (
                          <SelectItem key={op} value={op}>{op}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={conditionValue}
                      onChange={(e) => setConditionValue(e.target.value)}
                      placeholder="Value"
                    />
                  </div>
                  {conditionMetric && conditionOperator && conditionValue && (
                    <p className="text-sm text-muted-foreground">
                      Preview: <code className="bg-muted px-2 py-1 rounded">{conditionMetric} {conditionOperator} {conditionValue}</code>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-targetValue">Target Value</Label>
                    <Input
                      id="edit-targetValue"
                      type="number"
                      value={formData.targetValue}
                      onChange={(e) => handleInputChange("targetValue", Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-profilePriority">Profile Priority</Label>
                    <Input
                      id="edit-profilePriority"
                      type="number"
                      value={formData.profilePriority}
                      onChange={(e) => handleInputChange("profilePriority", Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-notificationPriority">Notification Priority</Label>
                    <Select value={formData.notificationPriority} onValueChange={(value) => handleInputChange("notificationPriority", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button  variant="outline" onClick={() => {setIsEditDialogOpen(false); resetForm(); }} >
                  Cancel
                </Button>
                <Button onClick={handleUpdateAchievement}>Update Achievement</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or category..."
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryFilter">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tierFilter">Tier</Label>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All tiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  {tiers.map(tier => (
                    <SelectItem key={tier} value={tier}>{tier}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Achievements ({filteredAchievements.length})</CardTitle>
            {(searchQuery || categoryFilter !== "all" || tierFilter !== "all") && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setCategoryFilter("all")
                  setTierFilter("all")
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Icon</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden lg:table-cell">Tier</TableHead>
                  <TableHead className="hidden lg:table-cell">Target</TableHead>
                  <TableHead className="hidden xl:table-cell">Trigger Event</TableHead>
                  <TableHead className="hidden xl:table-cell">Priority</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAchievements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No achievements found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAchievements.map((achievement) => (
                    <TableRow key={achievement._id}>
                      <TableCell>
                        {achievement.icon ? (
                          <>
                            {/** Dynamically render Lucide icon */}
                            {LucideIcons[achievement.icon as keyof typeof LucideIcons] ? (
                              (() => {
                                const IconComp =
                                  LucideIcons[achievement.icon as keyof typeof LucideIcons] as React.ComponentType<any>;
                                return <IconComp className="w-5 h-5 inline-block mr-2" />;
                              })()
                            ) : null}
                            {achievement.icon}
                          </>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{achievement.name}</p>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{achievement.category}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge className={getTierColor(achievement.tier)}>{achievement.tier}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{achievement.targetValue}</TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <code className="text-xs bg-muted px-2 py-1 rounded">{achievement.triggerEvent}</code>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="flex items-center gap-1">
                          <span className="text-sm">P: {achievement.profilePriority}</span>
                          <span className="text-muted-foreground">•</span>
                          <Badge variant="secondary" className="text-xs">
                            {achievement.notificationPriority}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(achievement)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(achievement._id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Achievement</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete this achievement? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
