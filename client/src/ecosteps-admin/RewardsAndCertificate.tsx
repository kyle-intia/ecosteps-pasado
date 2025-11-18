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
import IconPicker from "@/components/iconPicker";
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
  Download,
} from "lucide-react";

import {
  getCertificates,
  getCertificateById,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  getRewards,
  getRewardsById,
  createReward,
  updateReward,
  deleteReward,
} from "../lib/api";

const AdminCertificatesRewards = () => {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddingCertificate, setIsAddingCertificate] = useState(false);
  const [isEditingCertificate, setIsEditingCertificate] = useState<any | null>(null);
  const [newCertificate, setNewCertificate] = useState<any>({
    title: "",
    body: "",
    icon: "Medal",
    color: "#10B981",
    unlockRequirement: { type: "walk", value: 0 },
    earned: false,
  });

  const [isAddingReward, setIsAddingReward] = useState(false);
  const [isEditingReward, setIsEditingReward] = useState<any | null>(null);
  const [newReward, setNewReward] = useState<any>({
    title: "",
    body: "",
    icon: "Gift",
    color: "#60A5FA",
    rewardItem: "",
    rewardType: "physical",
    claimRequirement: { type: "walk", value: 0 },
    claimable: false,
    claimed: false,
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [certs, rws] = await Promise.all([getCertificates(), getRewards()]);
      setCertificates(Array.isArray(certs) ? certs : []);
      setRewards(Array.isArray(rws) ? rws : []);
    } catch (error) {
      console.error("Fetch failed", error);
      toast({
        title: "Error",
        description: "Failed to fetch certificates or rewards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Certificates handlers ---------- */
  const openEditCertificate = async (cert: any) => {
    try {
      const detail = await getCertificateById(cert._id);
      setIsEditingCertificate(detail);
    } catch (error) {
      console.error("Failed to fetch certificate", error);
      toast({ title: "Error", description: "Failed to fetch certificate", variant: "destructive" });
    }
  };

  const saveCertificate = async () => {
    // basic validation
    const target = isEditingCertificate ? isEditingCertificate : newCertificate;
    if (!target.title || !target.unlockRequirement?.type || (Number(target.unlockRequirement?.value) <= 0)) {
      toast({ title: "Validation", description: "Title and requirement value are required", variant: "destructive" });
      return;
    }

    try {
      if (isEditingCertificate) {
        const updated = await updateCertificate(isEditingCertificate._id, isEditingCertificate);
        setCertificates((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
        setIsEditingCertificate(null);
        toast({ title: "Saved", description: "Certificate updated", variant: "default" });
      } else {
        const created = await createCertificate(newCertificate);
        setCertificates((prev) => [created, ...prev]);
        setIsAddingCertificate(false);
        setNewCertificate({
          title: "",
          body: "",
          icon: "Medal",
          color: "#10B981",
          unlockRequirement: { type: "walk", value: 0 },
          earned: false,
        });
        toast({ title: "Created", description: "Certificate created", variant: "default" });
      }
    } catch (error) {
      console.error("Save certificate failed", error);
      toast({ title: "Error", description: "Failed to save certificate", variant: "destructive" });
    }
  };

  const handleDeleteCertificate = async (cert: any) => {
    if (!confirm(`Delete certificate "${cert.title}"?`)) return;
    try {
      await deleteCertificate(cert._id);
      setCertificates((prev) => prev.filter((c) => c._id !== cert._id));
      toast({ title: "Deleted", description: "Certificate deleted", variant: "default" });
    } catch (error) {
      console.error("Delete failed", error);
      toast({ title: "Error", description: "Failed to delete certificate", variant: "destructive" });
    }
  };

  /* ---------- Rewards handlers ---------- */
  const openEditReward = async (rew: any) => {
    try {
      const detail = await getRewardsById(rew._id);
      setIsEditingReward(detail);
    } catch (error) {
      console.error("Failed to fetch reward", error);
      toast({ title: "Error", description: "Failed to fetch reward", variant: "destructive" });
    }
  };

  const saveReward = async () => {
    const target = isEditingReward ? isEditingReward : newReward;
    if (!target.title || !target.rewardItem || (Number(target.claimRequirement?.value) <= 0)) {
      toast({ title: "Validation", description: "Title, reward item and claim value are required", variant: "destructive" });
      return;
    }

    try {
      if (isEditingReward) {
        const updated = await updateReward(isEditingReward._id, isEditingReward);
        setRewards((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
        setIsEditingReward(null);
        toast({ title: "Saved", description: "Reward updated", variant: "default" });
      } else {
        const created = await createReward(newReward);
        setRewards((prev) => [created, ...prev]);
        setIsAddingReward(false);
        setNewReward({
          title: "",
          body: "",
          icon: "Gift",
          color: "#60A5FA",
          rewardItem: "",
          rewardType: "physical",
          claimRequirement: { type: "walk", value: 0 },
          claimable: false,
          claimed: false,
        });
        toast({ title: "Created", description: "Reward created", variant: "default" });
      }
    } catch (error) {
      console.error("Save reward failed", error);
      toast({ title: "Error", description: "Failed to save reward", variant: "destructive" });
    }
  };

  const handleDeleteReward = async (rew: any) => {
    if (!confirm(`Delete reward "${rew.title}"?`)) return;
    try {
      await deleteReward(rew._id);
      setRewards((prev) => prev.filter((r) => r._id !== rew._id));
      toast({ title: "Deleted", description: "Reward deleted", variant: "default" });
    } catch (error) {
      console.error("Delete failed", error);
      toast({ title: "Error", description: "Failed to delete reward", variant: "destructive" });
    }
  };

  /* ---------- helper ---------- */
  const getDaysAgo = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  const handleExport = () => {
  // Check if data exists
  if (!certificates.length && !rewards.length) {
    toast({
      title: "No Data",
      description: "There are no certificates or rewards to export.",
      variant: "destructive",
    });
    return;
  }

  // Export certificates
  const certHeaders = [
    "ID",
    "Title",
    "Description",
    "Icon",
    "Color",
    "Unlock Requirement Type",
    "Unlock Requirement Value",
    "Earned",
  ];

  const certCsvRows = [
    certHeaders.join(","),
    ...certificates.map((cert) => [
      cert._id,
      `"${cert.title}"`,
      `"${cert.body}"`,
      cert.icon,
      cert.color,
      cert.unlockRequirement.type,
      cert.unlockRequirement.value,
      cert.earned,
    ].join(","))
  ];

  // Export rewards
  const rewardHeaders = [
    "ID",
    "Title",
    "Description",
    "Icon",
    "Color",
    "Reward Item",
    "Reward Type",
    "Claim Requirement Type",
    "Claim Requirement Value",
    "Claimable",
    "Claimed",
  ];

  const rewardCsvRows = [
    rewardHeaders.join(","),
    ...rewards.map((rew) => [
      rew._id,
      `"${rew.title}"`,
      `"${rew.body}"`,
      rew.icon,
      rew.color,
      rew.rewardItem,
      rew.rewardType,
      rew.claimRequirement.type,
      rew.claimRequirement.value,
      rew.claimable,
      rew.claimed,
    ].join(","))
  ];

  // Combine both CSV data
  const csvContent = [...certCsvRows, "", ...rewardCsvRows].join("\n");

  // Create CSV Blob and download
  const dataBlob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'certificates_and_rewards.csv';
  link.click();
  URL.revokeObjectURL(url);

  // Show success message
  toast({
    title: "Export Successful",
    description: `Exported ${certificates.length} certificates and ${rewards.length} rewards to CSV.`,
    variant: "default",
  });
};


  /* ---------- UI ---------- */
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Certificates & Rewards</h1>
          <p className="text-muted-foreground">Manage certificates users can earn and rewards they can claim</p>
        </div>
        <div className="flex gap-2">
          <div>
            <Button variant="ghost" onClick={fetchAll}><RotateCcw className="h-4 w-4" /></Button>
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
          
        </div>
      </div>

      <Tabs defaultValue="certificates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="certificates" className="gap-2">
            <Database className="h-4 w-4" />
            Certificates
          </TabsTrigger>
          <TabsTrigger value="rewards" className="gap-2">
            <Palette className="h-4 w-4" />
            Rewards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="certificates" className="space-y-4">
          <Card className="shadow-sm border-admin-border">
            <CardHeader>
              <CardTitle className="text-lg">Certificates</CardTitle>
              <p className="text-sm text-muted-foreground">Certificates are awarded when users meet unlock requirements</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Requirement</TableHead>
                    <TableHead>Earned</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((c) => (
                    <TableRow key={c._id} className="hover:bg-admin-hover">
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell>
                        {(c.unlockRequirement?.type || "-") + ": " + (c.unlockRequirement?.value ?? "-")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.earned ? "secondary" : "outline"}>{c.earned ? "Earned" : "Locked"}</Badge>
                      </TableCell>
                      <TableCell>{getDaysAgo(c.date || c.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditCertificate(c)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteCertificate(c)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {certificates.length === 0 && !loading && (
                <div className="p-6 text-center text-sm text-muted-foreground">No certificates yet. Add one using the button below.</div>
              )}

              <div className="mt-4 flex justify-end">
                <Button variant="default" className="gap-2" onClick={() => setIsAddingCertificate(true)}>
                  <Plus className="h-4 w-4" />
                  Add Certificate
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card className="shadow-sm border-admin-border">
            <CardHeader>
              <CardTitle className="text-lg">Rewards</CardTitle>
              <p className="text-sm text-muted-foreground">Manage claimable rewards</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Requirement</TableHead>
                    <TableHead>Claimed</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewards.map((r) => (
                    <TableRow key={r._id} className="hover:bg-admin-hover">
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell>{r.rewardItem}</TableCell>
                      <TableCell>
                        {(r.claimRequirement?.type || "-") + ": " + (r.claimRequirement?.value ?? "-")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.claimed ? "secondary" : r.claimable ? "default" : "outline"}>
                          {r.claimed ? "Claimed" : r.claimable ? "Claimable" : "Locked"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditReward(r)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteReward(r)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {rewards.length === 0 && !loading && (
                <div className="p-6 text-center text-sm text-muted-foreground">No rewards yet. Add one using the button below.</div>
              )}

              <div className="mt-4 flex justify-end">
                <Button variant="default" className="gap-2" onClick={() => setIsAddingReward(true)}>
                  <Plus className="h-4 w-4" />
                  Add Reward
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ---------- Certificate Edit Dialog ---------- */}
      <Dialog open={!!isEditingCertificate} onOpenChange={(open) => { if (!open) setIsEditingCertificate(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              {isEditingCertificate ? "Edit Certificate" : "Certificate"}
            </DialogTitle>
            <DialogDescription>Modify certificate details and unlock requirement</DialogDescription>
          </DialogHeader>

          {isEditingCertificate && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={isEditingCertificate.title} onChange={(e) => setIsEditingCertificate({ ...isEditingCertificate, title: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={isEditingCertificate.body} onChange={(e) => setIsEditingCertificate({ ...isEditingCertificate, body: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Icon</Label>
                    <IconPicker
                      value={isEditingCertificate.icon}
                      onChange={(value) => setIsEditingCertificate({ ...isEditingCertificate, icon: value })}
                    />
                </div>
                <div>
                  <Label>Color</Label>
                  <Input value={isEditingCertificate.color} onChange={(e) => setIsEditingCertificate({ ...isEditingCertificate, color: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Requirement Type</Label>
                  <Input value={isEditingCertificate.unlockRequirement?.type || ""} onChange={(e) => setIsEditingCertificate({ ...isEditingCertificate, unlockRequirement: { ...(isEditingCertificate.unlockRequirement || {}), type: e.target.value } })} />
                </div>
                <div>
                  <Label>Requirement Value</Label>
                  <Input type="number" value={isEditingCertificate.unlockRequirement?.value || ""} onChange={(e) => setIsEditingCertificate({ ...isEditingCertificate, unlockRequirement: { ...(isEditingCertificate.unlockRequirement || {}), value: e.target.value } })} />
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={saveCertificate}><Save className="h-4 w-4" /> Save</Button>
                <Button variant="outline" className="flex-1" onClick={() => setIsEditingCertificate(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------- Certificate Add Dialog ---------- */}
      <Dialog open={isAddingCertificate} onOpenChange={setIsAddingCertificate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Certificate
            </DialogTitle>
            <DialogDescription>Create a new certificate with unlock requirements</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={newCertificate.title} onChange={(e) => setNewCertificate({ ...newCertificate, title: e.target.value })} placeholder="e.g., Walk 100 km" />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={newCertificate.body} onChange={(e) => setNewCertificate({ ...newCertificate, body: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Icon</Label>
                  <IconPicker
                    value={newCertificate.icon}
                    onChange={(value) => setNewCertificate({ ...newCertificate, icon: value })}
                  />
              </div>
              <div>
                <Label>Color</Label>
                <Input value={newCertificate.color} onChange={(e) => setNewCertificate({ ...newCertificate, color: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Requirement Type *</Label>
                <Input value={newCertificate.unlockRequirement.type} onChange={(e) => setNewCertificate({ ...newCertificate, unlockRequirement: { ...newCertificate.unlockRequirement, type: e.target.value } })} />
              </div>
              <div>
                <Label>Requirement Value *</Label>
                <Input type="number" value={newCertificate.unlockRequirement.value} onChange={(e) => setNewCertificate({ ...newCertificate, unlockRequirement: { ...newCertificate.unlockRequirement, value: e.target.value } })} />
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={saveCertificate}>Add Certificate</Button>
              <Button variant="outline" className="flex-1" onClick={() => setIsAddingCertificate(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---------- Reward Edit Dialog ---------- */}
      <Dialog open={!!isEditingReward} onOpenChange={(open) => { if (!open) setIsEditingReward(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Reward
            </DialogTitle>
            <DialogDescription>Modify reward and claim requirement</DialogDescription>
          </DialogHeader>

          {isEditingReward && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={isEditingReward.title} onChange={(e) => setIsEditingReward({ ...isEditingReward, title: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>Reward Item</Label>
                <Input value={isEditingReward.rewardItem} onChange={(e) => setIsEditingReward({ ...isEditingReward, rewardItem: e.target.value })} />
              </div>

              <div>
                <Label>Icon</Label>
                  <IconPicker
                    value={isEditingReward.icon}
                    onChange={(value) => setIsEditingReward({ ...isEditingReward, icon: value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Reward Type</Label>
                  <Select value={isEditingReward.rewardType} onValueChange={(v) => setIsEditingReward({ ...isEditingReward, rewardType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="physical">Physical</SelectItem>
                      <SelectItem value="digital">Digital</SelectItem>
                      <SelectItem value="discount">Discount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-full">
                    <Label>Claimable</Label>
                    <Switch checked={!!isEditingReward.claimable} onCheckedChange={(v) => setIsEditingReward({ ...isEditingReward, claimable: v })} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Claim Requirement Type</Label>
                  <Input value={isEditingReward.claimRequirement?.type || ""} onChange={(e) => setIsEditingReward({ ...isEditingReward, claimRequirement: { ...(isEditingReward.claimRequirement || {}), type: e.target.value } })} />
                </div>
                <div>
                  <Label>Claim Requirement Value</Label>
                  <Input type="number" value={isEditingReward.claimRequirement?.value || ""} onChange={(e) => setIsEditingReward({ ...isEditingReward, claimRequirement: { ...(isEditingReward.claimRequirement || {}), value: e.target.value } })} />
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={saveReward}><Save className="h-4 w-4" /> Save</Button>
                <Button variant="outline" className="flex-1" onClick={() => setIsEditingReward(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------- Reward Add Dialog ---------- */}
      <Dialog open={isAddingReward} onOpenChange={setIsAddingReward}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Reward
            </DialogTitle>
            <DialogDescription>Create a new reward that users can claim</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={newReward.title} onChange={(e) => setNewReward({ ...newReward, title: e.target.value })} placeholder="e.g., Eco Water Bottle" />
            </div>

            <div className="space-y-2">
              <Label>Reward Item *</Label>
              <Input value={newReward.rewardItem} onChange={(e) => setNewReward({ ...newReward, rewardItem: e.target.value })} placeholder="e.g., Stainless Steel Bottle" />
            </div>

            <div>
                <Label>Icon</Label>
                  <IconPicker
                    value={newReward.icon}
                    onChange={(value) => setNewReward({ ...newReward, icon: value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Reward Type</Label>
                <Select value={newReward.rewardType} onValueChange={(v) => setNewReward({ ...newReward, rewardType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">Physical</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="discount">Discount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-full">
                  <Label>Claimable</Label>
                  <Switch checked={!!newReward.claimable} onCheckedChange={(v) => setNewReward({ ...newReward, claimable: v })} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Claim Requirement Type *</Label>
                <Input value={newReward.claimRequirement.type} onChange={(e) => setNewReward({ ...newReward, claimRequirement: { ...newReward.claimRequirement, type: e.target.value } })} />
              </div>
              <div>
                <Label>Claim Requirement Value *</Label>
                <Input type="number" value={newReward.claimRequirement.value} onChange={(e) => setNewReward({ ...newReward, claimRequirement: { ...newReward.claimRequirement, value: e.target.value } })} />
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={saveReward}>Add Reward</Button>
              <Button variant="outline" className="flex-1" onClick={() => setIsAddingReward(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCertificatesRewards;
