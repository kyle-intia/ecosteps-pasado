import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Target, Plus, Download, Search, Filter, Pencil, Trash2 } from "lucide-react"

import {
  createCertificate,
  getCertificates,
  updateCertificate,
  deleteCertificate
} from "../lib/api"

interface Certificate {
  _id?: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  date?: string;
  earned: boolean;
  unlockRequirement?: string;
}

export default function CertificatesPage() {
  const { toast } = useToast()

  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [formData, setFormData] = useState<Certificate>({
    title: "",
    description: "",
    icon: "",
    color: "",
    date: "",
    earned: false,
    unlockRequirement: ""
  })

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      icon: "",
      color: "",
      date: "",
      earned: false,
      unlockRequirement: ""
    })
  }

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const data = await getCertificates()
        setCertificates(data)
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch certificates",
          variant: "destructive",
        })
      }
    }
    fetchCertificates()
  }, [])

  const handleInputChange = (field: keyof Certificate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddCertificate = async () => {
    if (!formData.title || !formData.icon || !formData.color) {
      toast({
        title: "Validation Error",
        description: "Please fill required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const created = await createCertificate(formData)
      setCertificates(prev => [...prev, created])

      toast({
        title: "Success",
        description: "Certificate created successfully",
      })

      resetForm()
      setIsAdding(false)
    } catch {
      toast({
        title: "Error",
        description: "Failed to create certificate",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (cert: Certificate) => {
    setEditingId(cert._id || null)
    setFormData(cert)
    setIsEditDialogOpen(true)
  }

  const handleUpdateCertificate = async () => {
    if (!editingId) return

    try {
      const updated = await updateCertificate(editingId, formData)
      setCertificates(prev => prev.map(c => (c._id === editingId ? updated : c)))

      toast({
        title: "Updated",
        description: "Certificate updated successfully",
      })

      resetForm()
      setIsEditDialogOpen(false)
      setEditingId(null)
    } catch {
      toast({
        title: "Error",
        description: "Failed to update certificate",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCertificate(id)
      setCertificates(prev => prev.filter(c => c._id !== id))

      toast({
        title: "Deleted",
        description: "Certificate removed",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete certificate",
        variant: "destructive",
      })
    } finally {
      setDeleteId(null)
    }
  }

  const filteredCertificates = certificates.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleExport = () => {
    const headers = [
      "Title",
      "Description",
      "Icon",
      "Color",
      "Date",
      "Earned",
      "UnlockRequirement"
    ]

    const csvRows = [
      headers.join(","),
      ...filteredCertificates.map(c => [
        `"${c.title}"`,
        `"${c.description}"`,
        c.icon,
        c.color,
        c.date,
        c.earned,
        `"${c.unlockRequirement}"`
      ].join(","))
    ]

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "certificates.csv"
    a.click()

    URL.revokeObjectURL(url)

    toast({
      title: "Exported",
      description: `${filteredCertificates.length} certificates exported to CSV`
    })
  }

  const renderDialog = (isEdit: boolean) => (
    <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Certificate" : "Create Certificate"}</DialogTitle>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label>Title *</Label>
          <Input value={formData.title} onChange={e => handleInputChange("title", e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            rows={3}
            value={formData.description}
            onChange={e => handleInputChange("description", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Icon (string)</Label>
          <Input value={formData.icon} onChange={e => handleInputChange("icon", e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Color</Label>
          <Input value={formData.color} onChange={e => handleInputChange("color", e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={formData.date} onChange={e => handleInputChange("date", e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Unlock Requirement</Label>
          <Input
            value={formData.unlockRequirement}
            onChange={e => handleInputChange("unlockRequirement", e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => { resetForm(); setIsEditDialogOpen(false) }}>
          Cancel
        </Button>
        <Button onClick={isEdit ? handleUpdateCertificate : handleAddCertificate}>
          {isEdit ? "Update Certificate" : "Create Certificate"}
        </Button>
      </div>
    </DialogContent>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            Certificates
          </h1>
          <p className="text-muted-foreground">Manage eco certificates</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export
          </Button>

          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> Add Certificate
              </Button>
            </DialogTrigger>
            {renderDialog(false)}
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Certificate Management</CardTitle>
        </CardHeader>
        <CardContent>

          {/* SEARCH */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* TABLE */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Earned</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredCertificates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No certificates found
                    </TableCell>
                  </TableRow>
                ) : filteredCertificates.map(cert => (
                  <TableRow key={cert._id}>
                    <TableCell className="font-medium">{cert.title}</TableCell>
                    <TableCell>{cert.description || "-"}</TableCell>
                    <TableCell>
                      <Badge style={{ background: cert.color }}>{cert.color}</Badge>
                    </TableCell>
                    <TableCell>{cert.earned ? "Yes" : "No"}</TableCell>

                    <TableCell className="text-right flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(cert)}>
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Dialog open={deleteId === cert._id} onOpenChange={(open) => !open && setDeleteId(null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(cert._id || "")}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </DialogTrigger>

                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Certificate</DialogTitle>
                          </DialogHeader>
                          <p>Are you sure you want to delete "{cert.title}"?</p>

                          <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                            <Button variant="destructive" onClick={() => handleDelete(cert._id || "")}>
                              Delete
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Showing {filteredCertificates.length} of {certificates.length} certificates
          </p>

        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        {renderDialog(true)}
      </Dialog>
    </div>
  )
}
