import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Award, 
  Trophy, 
  Download, 
  Medal, 
  Sparkles,
  Calendar,
  Shield,
  Bike,
  Sun,
  Leaf,
  Globe,
  Bus,
  Recycle,
  UtensilsCrossed,
  Lock,
  Gift,
  Shirt,
  Sprout,
  Coffee,
  BookOpen,
  Ticket,
  CheckCircle2,
  Star,
  PartyPopper,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface Certificate {
  id: string;
  title: string;
  body: string;
  icon: React.ElementType;
  color: string;
  date?: string;
  earned: boolean;
  unlockRequirement?: string;
}

interface Reward {
  id: string;
  title: string;
  body: string;
  icon: React.ElementType;
  color: string;
  rewardItem: string;
  rewardType: "physical" | "digital" | "discount";
  claimed: boolean;
  claimRequirement: string;
  claimable: boolean;
}

const certificates: Certificate[] = [
  {
    id: "carbon-hero",
    title: "Carbon Footprint Hero",
    body: "Congratulations! You've walked 1,000 km in total, helping reduce your carbon footprint. Keep it up!",
    icon: Award,
    color: "hsl(48 96% 53%)",
    date: "March 15, 2025",
    earned: true,
  },
  {
    id: "green-commuter",
    title: "Green Commuter Certificate",
    body: "You've biked 500 km this year! Your eco-friendly commuting makes a difference.",
    icon: Bike,
    color: "hsl(142 76% 36%)",
    date: "March 10, 2025",
    earned: true,
  },
  {
    id: "carbon-saver",
    title: "Carbon Saver Certificate",
    body: "You've prevented 100 kg of CO₂ emissions. Your actions matter for the planet!",
    icon: Leaf,
    color: "hsl(142 76% 46%)",
    earned: false,
    unlockRequirement: "Prevent 100 kg of CO₂ emissions through eco-friendly actions",
  },
  {
    id: "earth-day",
    title: "Earth Day Special",
    body: "You completed our Earth Day Challenge! Thanks for helping the planet.",
    icon: Globe,
    color: "hsl(217 91% 60%)",
    date: "April 22, 2024",
    earned: true,
  },
  {
    id: "solar-hero",
    title: "Solar Hero Certificate",
    body: "You maintained a 7-day clean energy streak. Your commitment to green energy is inspiring.",
    icon: Sun,
    color: "hsl(48 96% 63%)",
    earned: false,
    unlockRequirement: "Maintain a 7-day streak of clean energy usage",
  },
];

const rewards: Reward[] = [
  {
    id: "bronze-eco",
    title: "Eco Starter Pack",
    body: "Get 50 native plant seeds to start your own eco-garden!",
    icon: Sprout,
    color: "hsl(142 76% 36%)",
    rewardItem: "50 Native Plant Seeds",
    rewardType: "physical",
    claimed: true,
    claimRequirement: "Track your footprint for 7 consecutive days",
    claimable: true,
  },
  {
    id: "silver-star",
    title: "Eco Warrior T-Shirt",
    body: "Show off your commitment with an exclusive organic cotton eco-warrior t-shirt!",
    icon: Shirt,
    color: "hsl(142 76% 46%)",
    rewardItem: "Organic Cotton T-Shirt",
    rewardType: "physical",
    claimed: false,
    claimRequirement: "Reduce your carbon footprint by 50kg total",
    claimable: true,
  },
  {
    id: "coffee-discount",
    title: "Coffee Shop Voucher",
    body: "Enjoy 20% off at participating eco-friendly coffee shops near you!",
    icon: Coffee,
    color: "hsl(30 80% 50%)",
    rewardItem: "20% Discount Voucher",
    rewardType: "discount",
    claimed: false,
    claimRequirement: "Use public transport 20 times",
    claimable: false,
  },
  {
    id: "30-day-habit",
    title: "Reusable Bag Set",
    body: "Get a premium set of reusable shopping bags for your eco-friendly lifestyle!",
    icon: Gift,
    color: "hsl(217 91% 60%)",
    rewardItem: "Premium Reusable Bag Set (5pcs)",
    rewardType: "physical",
    claimed: false,
    claimRequirement: "Track 30 consecutive days of activities",
    claimable: false,
  },
  {
    id: "100-day-champion",
    title: "Sustainability Guidebook",
    body: "Receive a comprehensive digital guidebook on sustainable living practices!",
    icon: BookOpen,
    color: "hsl(262 83% 58%)",
    rewardItem: "Digital Sustainability Guide",
    rewardType: "digital",
    claimed: false,
    claimRequirement: "Maintain 100-day tracking streak",
    claimable: false,
  },
  {
    id: "top-recycler",
    title: "Tree Planting Certificate",
    body: "We'll plant 10 trees in your name at a local reforestation project!",
    icon: Leaf,
    color: "hsl(142 76% 36%)",
    rewardItem: "10 Trees Planted in Your Name",
    rewardType: "digital",
    claimed: false,
    claimRequirement: "Log 100+ recycling activities",
    claimable: true,
  },
  {
    id: "plant-powered",
    title: "Meal Kit Discount",
    body: "Get 30% off on sustainable meal kits from partner restaurants!",
    icon: UtensilsCrossed,
    color: "hsl(142 76% 46%)",
    rewardItem: "30% Off Meal Kit Voucher",
    rewardType: "discount",
    claimed: false,
    claimRequirement: "Track 50 eco-friendly meals",
    claimable: false,
  },
  {
    id: "transit-star",
    title: "Transit Pass Rebate",
    body: "Receive a ₱500 rebate on your next public transit pass purchase!",
    icon: Bus,
    color: "hsl(217 91% 60%)",
    rewardItem: "₱500 Transit Rebate",
    rewardType: "discount",
    claimed: true,
    claimRequirement: "Use public transport 100 times",
    claimable: true,
  },
  {
    id: "weekend-warrior",
    title: "Bamboo Utensil Set",
    body: "Ditch single-use plastics with this beautiful bamboo utensil travel set!",
    icon: Gift,
    color: "hsl(48 96% 53%)",
    rewardItem: "Bamboo Utensil Travel Set",
    rewardType: "physical",
    claimed: false,
    claimRequirement: "Complete weekend activities 4 weeks in a row",
    claimable: true,
  },
];

export default function CertificateRewards() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("certificates");
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [claimedRewardTitle, setClaimedRewardTitle] = useState("");
  const claimedRewards = rewards.filter(r => r.claimed).length;
  const earnedCertificates = certificates.filter(c => c.earned).length;

  const handleDownload = (cert: Certificate) => {
    // Create a new PDF document
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    // Set background
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 297, 210, "F");

    // Add border
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(2);
    doc.rect(10, 10, 277, 190);

    // Add decorative elements
    doc.setFillColor(59, 130, 246);
    doc.circle(20, 20, 5, "F");
    doc.circle(277, 20, 5, "F");
    doc.circle(20, 190, 5, "F");
    doc.circle(277, 190, 5, "F");

    // Title
    doc.setFontSize(36);
    doc.setTextColor(30, 41, 59);
    doc.text("Certificate of Achievement", 148.5, 50, { align: "center" });

    // Subtitle
    doc.setFontSize(16);
    doc.setTextColor(100, 116, 139);
    doc.text("This certifies that", 148.5, 70, { align: "center" });

    // Recipient name
    doc.setFontSize(28);
    doc.setTextColor(59, 130, 246);
    doc.text("John Doe", 148.5, 90, { align: "center" });

    // Certificate title
    doc.setFontSize(14);
    doc.setTextColor(100, 116, 139);
    doc.text("has successfully earned the", 148.5, 105, { align: "center" });

    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text(cert.title, 148.5, 120, { align: "center" });

    // Description
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    const splitText = doc.splitTextToSize(cert.body, 200);
    doc.text(splitText, 148.5, 135, { align: "center" });

    // Date
    doc.setFontSize(11);
    doc.text(`Issued on: ${cert.date || new Date().toLocaleDateString()}`, 148.5, 165, { align: "center" });

    // Signature line
    doc.setDrawColor(100, 116, 139);
    doc.line(50, 180, 120, 180);
    doc.setFontSize(10);
    doc.text("Authorized Signature", 85, 188, { align: "center" });

    // Save the PDF
    doc.save(`${cert.title.replace(/\s+/g, '_')}_Certificate.pdf`);
    toast.success(`Certificate downloaded successfully!`);
  };

  const handleClaim = (reward: Reward) => {
    if (reward.claimable && !reward.claimed) {
      setClaimedRewardTitle(reward.rewardItem);
      setShowClaimDialog(true);
    } else if (reward.claimed) {
      toast.info("You've already claimed this reward!");
    } else {
      toast.info(`Complete the requirement: ${reward.claimRequirement}`);
    }
  };

  return (
    <>
      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <DialogContent className="sm:max-w-lg border-2 border-[hsl(221,83%,53%)]/20 overflow-hidden bg-white">
          {/* Animated background elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(221,83%,53%)]/5 via-[hsl(262,83%,58%)]/5 to-[hsl(221,83%,53%)]/5" />
          <div className="absolute top-0 left-0 w-40 h-40 bg-[hsl(221,83%,53%)]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-[hsl(262,83%,58%)]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          
          {/* Floating stars animation */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ opacity: 0, y: 20, x: Math.random() * 100 - 50 }}
              animate={{ 
                opacity: [0, 1, 0],
                y: [20, -100],
                rotate: [0, 360]
              }}
              transition={{
                duration: 2,
                delay: i * 0.2,
                repeat: Infinity,
                repeatDelay: 1
              }}
              style={{
                left: `${20 + i * 15}%`,
                top: '50%'
              }}
            >
              <Star className="w-4 h-4 text-[hsl(221,83%,53%)] fill-[hsl(221,83%,53%)]" />
            </motion.div>
          ))}

          <div className="relative z-10">
            <DialogHeader className="text-center space-y-4 pb-2">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.1
                }}
                className="mx-auto"
              >
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-br from-[hsl(221,83%,53%)] to-[hsl(262,83%,58%)] rounded-full blur-xl opacity-50 animate-pulse" />
                  <div className="relative bg-gradient-to-br from-[hsl(221,83%,53%)] to-[hsl(262,83%,58%)] p-6 rounded-full">
                    <Trophy className="w-16 h-16 text-white" />
                  </div>
                  <motion.div
                    className="absolute -top-2 -right-2"
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity
                    }}
                  >
                    <Sparkles className="w-8 h-8 text-[hsl(262,83%,58%)] fill-[hsl(262,83%,58%)]" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-[hsl(221,83%,53%)] via-[hsl(262,83%,58%)] to-[hsl(221,83%,53%)] bg-clip-text text-transparent">
                  🎉 Congratulations! 🎉
                </DialogTitle>
                <p className="text-lg font-semibold text-[hsl(240,10%,10%)] mt-2">
                  Reward Successfully Claimed!
                </p>
              </motion.div>
            </DialogHeader>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="pt-6 space-y-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[hsl(221,83%,53%)]/20 via-[hsl(262,83%,58%)]/20 to-[hsl(221,83%,53%)]/20 rounded-lg blur-sm" />
                <div className="relative p-6 bg-gradient-to-br from-[hsl(221,83%,53%)]/10 via-[hsl(262,83%,58%)]/5 to-[hsl(221,83%,53%)]/10 rounded-lg border-2 border-[hsl(221,83%,53%)]/30 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <PartyPopper className="w-6 h-6 text-[hsl(221,83%,53%)]" />
                    <p className="font-bold text-[hsl(240,10%,10%)] text-lg">Your Reward:</p>
                  </div>
                  <motion.p 
                    className="text-2xl font-bold bg-gradient-to-r from-[hsl(221,83%,53%)] to-[hsl(262,83%,58%)] bg-clip-text text-transparent"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: [0.9, 1.05, 1] }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    {claimedRewardTitle}
                  </motion.p>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-3 p-4 bg-[hsl(262,83%,58%)]/5 rounded-lg border border-[hsl(262,83%,58%)]/20">
                  <CheckCircle2 className="w-5 h-5 text-[hsl(262,83%,58%)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-[hsl(240,10%,10%)] mb-1">Check Your Email</p>
                    <p className="text-sm text-[hsl(240,4%,46%)]">
                      We've sent you a confirmation email with detailed instructions on how to collect your reward.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-[hsl(221,83%,53%)]/5 rounded-lg border border-[hsl(221,83%,53%)]/20">
                  <Calendar className="w-5 h-5 text-[hsl(221,83%,53%)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-[hsl(240,10%,10%)] mb-1">What's Next?</p>
                    <p className="text-sm text-[hsl(240,4%,46%)]">
                      You'll receive your reward details within 24 hours. Keep up the great work!
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              className="flex justify-center mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Button 
                onClick={() => setShowClaimDialog(false)}
                size="lg"
                className="px-8 bg-gradient-to-r from-[hsl(221,83%,53%)] to-[hsl(262,83%,58%)] hover:from-[hsl(221,83%,53%)]/90 hover:to-[hsl(262,83%,58%)]/90 text-white"
              >
                Awesome! Got it
              </Button>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-gradient-to-br from-[hsl(220,15%,97%)] via-[hsl(220,15%,97%)] to-[hsl(262,83%,58%)]/5">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[hsl(221,83%,53%)]/10 via-[hsl(262,83%,58%)]/10 to-[hsl(221,83%,53%)]/10 border-b border-[hsl(240,6%,90%)]">
<div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 py-12 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4"
          >
            <div className="flex justify-center gap-2 mb-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Trophy className="w-16 h-16 text-primary" />
              </motion.div>
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, delay: 0.2 }}
              >
                <Award className="w-16 h-16 text-accent" />
              </motion.div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Certificates & Rewards
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Celebrate your eco-friendly milestones!
            </p>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-3xl mx-auto">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border shadow-sm"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-accent" />
                  <span className="text-sm text-muted-foreground">Certificates</span>
                </div>
                <div className="text-3xl font-bold text-accent">{earnedCertificates}</div>
                <div className="text-xs text-muted-foreground">of {certificates.length} earned</div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border shadow-sm"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Gift className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Rewards Claimed</span>
                </div>
                <div className="text-3xl font-bold text-primary">{claimedRewards}</div>
                <div className="text-xs text-muted-foreground">rewards unlocked</div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border shadow-sm"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-warning" />
                  <span className="text-sm text-muted-foreground">Rewards</span>
                </div>
                <div className="text-3xl font-bold text-warning">
                  {rewards.filter(r => r.claimable).length}
                </div>
                <div className="text-xs text-muted-foreground">rewards available</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="certificates" className="gap-2">
              <Award className="w-4 h-4" />
              Certificates
            </TabsTrigger>
            <TabsTrigger value="rewards" className="gap-2">
              <Trophy className="w-4 h-4" />
              Rewards
            </TabsTrigger>
          </TabsList>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence>
                {certificates.map((cert, index) => (
                  <motion.div
                    key={cert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: cert.earned ? -5 : 0 }}
                    className="h-full"
                  >
                    <Card className={`relative overflow-hidden h-full transition-all duration-300 ${
                      !cert.earned 
                        ? 'bg-[hsl(240,5%,96%)]/30 opacity-75' 
                        : 'bg-gradient-to-br from-white via-white to-[hsl(221,83%,53%)]/5 hover:shadow-xl hover:shadow-[hsl(221,83%,53%)]/10'
                    }`}>
                      {/* Enhanced background decoration */}
                      {cert.earned && (
                        <>
                          <div 
                            className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20 animate-pulse"
                            style={{ backgroundColor: cert.color }}
                          />
                          <div 
                            className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-2xl opacity-10"
                            style={{ backgroundColor: cert.color }}
                          />
                        </>
                      )}
                      
                      {/* Corner decorations for earned certificates */}
                      {cert.earned && (
                        <>
                          <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4 rounded-tl-lg opacity-30" style={{ borderColor: cert.color }} />
                          <div className="absolute bottom-0 right-0 w-20 h-20 border-b-4 border-r-4 rounded-br-lg opacity-30" style={{ borderColor: cert.color }} />
                        </>
                      )}
                      
                      {cert.earned ? (
                        <Badge className="absolute top-4 right-4 bg-gradient-to-r from-accent to-primary text-white border-0 shadow-lg">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Earned
                        </Badge>
                      ) : (
                        <Badge className="absolute top-4 right-4 bg-muted/80 backdrop-blur-sm text-muted-foreground border border-border">
                          <Lock className="w-3 h-3 mr-1" />
                          Locked
                        </Badge>
                      )}

                      <CardHeader>
                        <motion.div 
                          className={`w-20 h-20 rounded-xl flex items-center justify-center mb-4 relative ${
                            cert.earned ? 'shadow-lg' : 'opacity-50'
                          }`}
                          style={{ 
                            backgroundColor: `${cert.color}20`,
                            boxShadow: cert.earned ? `0 10px 40px ${cert.color}30` : 'none'
                          }}
                          whileHover={cert.earned ? { scale: 1.1, rotate: 5 } : {}}
                        >
                          {cert.earned && (
                            <div 
                              className="absolute inset-0 rounded-xl opacity-20 blur-xl"
                              style={{ backgroundColor: cert.color }}
                            />
                          )}
                          <cert.icon className="w-10 h-10 relative z-10" style={{ color: cert.color }} />
                          {!cert.earned && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl backdrop-blur-sm">
                              <Lock className="w-8 h-8 text-[hsl(240,4%,46%)]" />
                            </div>
                          )}
                        </motion.div>
                        <CardTitle className={`text-xl font-bold ${
                          cert.earned ? 'text-[hsl(240,10%,10%)]' : 'text-[hsl(240,4%,46%)]'
                        }`}>
                          {cert.title}
                        </CardTitle>
                        {cert.date && (
                          <CardDescription className="flex items-center gap-1.5 text-xs">
                            <Calendar className="w-3.5 h-3.5" />
                            Achieved on {cert.date}
                          </CardDescription>
                        )}
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <p className="text-sm text-[hsl(240,4%,46%)] leading-relaxed">{cert.body}</p>
                        
                        {!cert.earned && cert.unlockRequirement && (
                          <div className="p-3 bg-gradient-to-br from-[hsl(221,83%,53%)]/5 to-[hsl(262,83%,58%)]/5 border border-[hsl(221,83%,53%)]/20 rounded-lg">
                            <div className="flex items-start gap-2">
                              <Lock className="w-4 h-4 text-[hsl(221,83%,53%)] mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-[hsl(221,83%,53%)] mb-1">How to unlock:</p>
                                <p className="text-xs text-[hsl(240,4%,46%)]">{cert.unlockRequirement}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>

                      <CardFooter>
                        <Button
                          onClick={() => handleDownload(cert)}
                          disabled={!cert.earned}
                          className="w-full"
                          variant={cert.earned ? "default" : "outline"}
                          size="lg"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Certificate
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence>
                {rewards.map((reward, index) => (
                  <motion.div
                    key={reward.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: reward.claimable && !reward.claimed ? -5 : 0 }}
                  >
                    <Card className={`relative overflow-hidden h-full border-2 bg-white ${
                      reward.claimed 
                        ? 'border-[hsl(240,5%,96%)]' 
                        : reward.claimable 
                        ? 'border-[hsl(221,83%,53%)]/30 shadow-lg' 
                        : 'border-[hsl(240,6%,90%)]'
                    }`}>
                      {/* Voucher Design Elements */}
                      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[hsl(221,83%,53%)]/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[hsl(221,83%,53%)]/20 to-transparent" />
                      
                      {/* Voucher Punch Holes */}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-[hsl(220,15%,97%)] rounded-full border-2 border-[hsl(240,6%,90%)] -ml-2" />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-[hsl(220,15%,97%)] rounded-full border-2 border-[hsl(240,6%,90%)] -mr-2" />
                      
                      {/* Background decoration */}
                      <div 
                        className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-10"
                        style={{ backgroundColor: reward.color }}
                      />
                      
                      {reward.claimed ? (
                        <Badge className="absolute top-4 right-4 bg-[hsl(240,5%,96%)] text-[hsl(240,4%,46%)]">
                          Claimed
                        </Badge>
                      ) : reward.claimable ? (
                        <Badge className="absolute top-4 right-4 bg-[hsl(221,83%,53%)] text-white">
                          <Ticket className="w-3 h-3 mr-1" />
                          Ready to Claim
                        </Badge>
                      ) : (
                        <Badge className="absolute top-4 right-4 bg-[hsl(240,5%,96%)] text-[hsl(240,4%,46%)]">
                          <Lock className="w-3 h-3 mr-1" />
                          Locked
                        </Badge>
                      )}

                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-4">
                          <div 
                            className={`w-16 h-16 rounded-lg flex items-center justify-center relative flex-shrink-0 ${
                              !reward.claimable || reward.claimed ? 'opacity-50' : ''
                            }`}
                            style={{ backgroundColor: `${reward.color}20` }}
                          >
                            <reward.icon className="w-8 h-8" style={{ color: reward.color }} />
                            {reward.claimable && !reward.claimed && (
                              <motion.div
                                className="absolute -top-1 -right-1"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                              >
                                <Sparkles className="w-5 h-5 text-[hsl(221,83%,53%)] fill-[hsl(221,83%,53%)]" />
                              </motion.div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <CardTitle className={`text-lg mb-1 ${
                              !reward.claimable || reward.claimed ? 'text-[hsl(240,4%,46%)]' : 'text-[hsl(240,10%,10%)]'
                            }`}>
                              {reward.title}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                                style={{ borderColor: reward.color, color: reward.color }}
                              >
                                {reward.rewardType === "physical" && "🎁 Physical"}
                                {reward.rewardType === "digital" && "💾 Digital"}
                                {reward.rewardType === "discount" && "🎟️ Discount"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="p-4 bg-[hsl(262,83%,58%)]/5 border border-dashed border-[hsl(262,83%,58%)]/30 rounded-lg">
                          <p className="text-sm font-bold text-[hsl(262,83%,58%)] mb-1">Your Reward:</p>
                          <p className="text-lg font-semibold text-[hsl(240,10%,10%)]">{reward.rewardItem}</p>
                        </div>
                        
                        <p className="text-sm text-[hsl(240,4%,46%)]">{reward.body}</p>
                        
                        <div className="p-3 bg-[hsl(221,83%,53%)]/5 border border-[hsl(221,83%,53%)]/20 rounded-lg">
                          <p className="text-xs font-semibold text-[hsl(221,83%,53%)] mb-1">
                            {reward.claimed ? "✓ Completed:" : reward.claimable ? "✓ Ready to claim:" : "How to claim:"}
                          </p>
                          <p className="text-xs text-[hsl(240,4%,46%)]">{reward.claimRequirement}</p>
                        </div>
                      </CardContent>

                      <CardFooter>
                        <Button
                          onClick={() => handleClaim(reward)}
                          disabled={reward.claimed || !reward.claimable}
                          className="w-full"
                          variant={reward.claimable && !reward.claimed ? "default" : "outline"}
                          size="lg"
                        >
                          {reward.claimed ? (
                            <>
                              <Trophy className="w-4 h-4 mr-2" />
                              Already Claimed
                            </>
                          ) : reward.claimable ? (
                            <>
                              <Gift className="w-4 h-4 mr-2" />
                              Claim Now
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 mr-2" />
                              Not Available Yet
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sticky Footer with Back Button */}
      <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-[hsl(240,6%,90%)] p-4 shadow-lg z-50">
        <div className="container mx-auto max-w-7xl">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto group border-[hsl(240,6%,90%)] text-[hsl(240,10%,10%)] hover:bg-[hsl(240,5%,96%)]"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}
