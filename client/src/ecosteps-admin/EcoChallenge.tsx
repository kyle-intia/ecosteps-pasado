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
import { Target, Plus, Download, Search, Filter, Pencil, Trash2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { createChallenge, getChallenge, updateChallenge, deleteChallenge} from "../lib/api"

interface EcoChallenge {
  _id?: string
  id: string
  title: string
  description: string
  category: string
  calculationType: string
  savingsValue: string
  targetQuestion: string
  overrideValue: string
}

const categories = ["transport", "food", "home"]
const calculationTypes = ["override", "fixed_credit"]

export default function EcoChallenges() {
  const { toast } = useToast()
  const [challenges, setChallenges] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isAddingChallenges, setIsAddingChallenges] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<EcoChallenge>({
    id: "",
    title: "",
    description: "",
    category: "",
    calculationType: "",
    savingsValue: "",
    targetQuestion: "",
    overrideValue: ""
  })

  const resetForm = () => {
    setFormData({
       id: "",
       title: "",
       description: "",
       category: "",
       calculationType: "",
       savingsValue: "",
       targetQuestion: "",
       overrideValue: ""
    });
  };

  useEffect(() => {
    const fetchChallenges= async () => {
      try {
        const achievements = await getChallenge()
        setChallenges(achievements)
      } catch (error) {
        console.error("Failed to fetch emission factors", error)
        toast({
          title: "Error",
          description: "Failed to fetch emission factors",
          variant: "destructive",
        })
      }
    }
    fetchChallenges()
  }, [])

  const handleInputChange = (field: keyof EcoChallenge, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddChallenge = async () => {
    if (!formData.id || !formData.title || !formData.category || !formData.calculationType) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }
    try {
      const created = await createChallenge({
        ...formData
      });
  
      setChallenges((prev) => [...prev, created]);
  
      toast({
        title: "Success",
        description: "New Eco Challenge added successfully",
        variant: "default",
      });

      resetForm()
      setIsAddingChallenges(false);
    } catch (error) {
      console.error("Failed to add new Eco Challenge ", error);
      toast({
        title: "Error",
        description: "Failed to add new Eco Challenge",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (challenge: EcoChallenge) => {
    setEditingId(challenge.id)
    setFormData(challenge)
    setIsEditDialogOpen(true)
  }

  const handleUpdateChallenge = async () => {
    if (!formData.id || !formData.title || !formData.category || !formData.calculationType) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }
      try {
        const updated = await updateChallenge(formData._id, {
          ...formData
        });
    
        setChallenges((prev) =>
          prev.map((a) => (a._id === formData._id ? updated : a))
        );
    
        toast({
          title: "Success",
          description: `Eco Challenge "${formData.title}" has been updated`,
        });

        resetForm();
        setIsEditDialogOpen(false);
        setEditingId(null);
      } catch (error) {
        console.error("Failed to update achievement", error);
        toast({
          title: "Error",
          description: "Failed to update achievement",
          variant: "destructive",
        });
    } 
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteChallenge(id);
      setChallenges((prev) =>
        prev.filter((a) => a._id !== id)
      );
      toast({
        title: "Success",
        description: "Eco Challenge has been deleted",
      });
    } catch (error) {
      console.error("Failed to delete Eco Challenge", error);
      toast({
        title: "Error",
        description: "Failed to delete Eco Challenge",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const handleExport = () => {
    const headers = [
      "ID",
      "Title",
      "Description",
      "Category",
      "Calculation Type",
      "Savings Value",
      "Target Question",
      "Override Value"
    ]
    
    const csvRows = [
      headers.join(","),
      ...filteredChallenges.map(challenge => [
        challenge.id,
        `"${challenge.title}"`,
        `"${challenge.description}"`,
        challenge.category,
        challenge.calculationType,
        challenge.savingsValue,
        challenge.targetQuestion,
        challenge.overrideValue
      ].join(","))
    ]
    
    const csvContent = csvRows.join("\n")
    const dataBlob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'eco-challenges.csv'
    link.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: "Export Successful",
      description: `Exported ${filteredChallenges.length} challenges to CSV`,
    })
  }

  const filteredChallenges = challenges.filter(challenge => {
    const matchesSearch = 
      challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      challenge.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || challenge.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "transport": return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "food": return "bg-green-500/10 text-green-600 border-green-500/20"
      case "home": return "bg-orange-500/10 text-orange-600 border-orange-500/20"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const renderDialog = (isEdit: boolean) => (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit' : 'Create New'} Eco Challenge</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="id">Challenge ID *</Label>
            <Input
              id="id"
              value={formData.id}
              onChange={(e) => handleInputChange("id", e.target.value)}
              placeholder="car_free_commute"
              disabled={isEdit}
            />
          </div>
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
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            placeholder="Car-Free Commuter"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Use public transport, bike, or walk for your entire commute today..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="calculationType">Calculation Type *</Label>
            <Select value={formData.calculationType} onValueChange={(value) => handleInputChange("calculationType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {calculationTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="savingsValue">Savings Value</Label>
            <Input
              id="savingsValue"
              value={formData.savingsValue}
              onChange={(e) => handleInputChange("savingsValue", e.target.value)}
              placeholder="calculated or numeric value"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="targetQuestion">Target Question</Label>
            <Input
              id="targetQuestion"
              value={formData.targetQuestion}
              onChange={(e) => handleInputChange("targetQuestion", e.target.value)}
              placeholder="Q1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="overrideValue">Override Value</Label>
            <Input
              id="overrideValue"
              value={formData.overrideValue}
              onChange={(e) => handleInputChange("overrideValue", e.target.value)}
              placeholder="public_transport"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button  variant="outline" onClick={() => {setIsEditDialogOpen(false); resetForm(); }} >
          Cancel
        </Button>
        <Button onClick={isEdit ? handleUpdateChallenge : handleAddChallenge}>
          {isEdit ? 'Update' : 'Create'} Challenge
        </Button>
      </div>
    </DialogContent>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            Eco Challenges
          </h1>
          <p className="text-muted-foreground">Manage and configure eco challenges for users</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Dialog open={isAddingChallenges} onOpenChange={(open) => { setIsAddingChallenges(open); if (!open) resetForm();  }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Challenge
              </Button>
            </DialogTrigger>
            {renderDialog(false)}
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Challenge Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="hidden lg:table-cell">Calculation Type</TableHead>
                  <TableHead className="hidden xl:table-cell">Savings Value</TableHead>
                  <TableHead className="hidden xl:table-cell">Target Question</TableHead>
                  <TableHead className="hidden xl:table-cell">Override Value</TableHead>
                  <TableHead className="hidden xl:table-cell">Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChallenges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      No challenges found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredChallenges.map((challenge) => (
                    <TableRow key={challenge.id}>
                      <TableCell className="font-mono text-sm">{challenge.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getCategoryColor(challenge.category)}>
                          {challenge.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="secondary">{challenge.calculationType}</Badge>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">{challenge.savingsValue}</TableCell>
                      <TableCell className="hidden xl:table-cell">{challenge.targetQuestion}</TableCell>
                      <TableCell className="hidden xl:table-cell">{challenge.overrideValue}</TableCell>
                      <TableCell className="max-w-xs truncate hidden xl:table-cell">{challenge.description}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(challenge)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Dialog open={deleteId === challenge.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteId(challenge.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete Challenge</DialogTitle>
                              </DialogHeader>
                              <p className="text-muted-foreground">
                                Are you sure you want to delete "{challenge.title}"? This action cannot be undone.
                              </p>
                              <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" onClick={() => setDeleteId(null)}>
                                  Cancel
                                </Button>
                                <Button variant="destructive" onClick={() => handleDelete(challenge.id)}>
                                  Delete
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredChallenges.length} of {challenges.length} challenges
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) resetForm(); }}>
        {renderDialog(true)}
      </Dialog>
    </div>
  )
}
