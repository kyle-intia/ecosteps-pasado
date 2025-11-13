import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, Sparkles, Clock, Award, Bell, CheckCircle, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EmailTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: string;
  subject: string;
  message: string;
  color: string;
}

const templates: EmailTemplate[] = [
  {
    id: "reminder",
    name: "Friendly Reminder",
    icon: <Bell className="h-4 w-4" />,
    category: "Engagement",
    subject: "Quick Reminder: Complete Your Carbon Footprint Assessment",
    message: `Hi there! 👋

We noticed you haven't completed your carbon footprint assessment yet. Taking just 5 minutes to complete it will help you:

• Understand your environmental impact
• Get personalized eco-friendly recommendations
• Track your progress over time
• Compete on the leaderboard

Click here to complete your assessment now!

Best regards,
The Green Team`,
    color: "bg-blue-500"
  },
  {
    id: "reward-claim",
    name: "Claim Your Reward",
    icon: <Gift className="h-4 w-4" />,
    category: "Rewards",
    subject: "🎉 Congratulations! You've Earned a New Reward",
    message: `Congratulations! 🎊

You've successfully earned a new reward for your amazing eco-friendly efforts!

Reward: Carbon Warrior Certificate
Points Earned: 500 points
Achievement Level: Gold

Your dedication to sustainability is truly inspiring! Click the link below to claim your certificate and share it with your network.

[Claim Your Certificate]

Keep up the fantastic work!

Warmly,
The Sustainability Team`,
    color: "bg-green-500"
  },
  {
    id: "achievement",
    name: "Achievement Unlocked",
    icon: <Award className="h-4 w-4" />,
    category: "Motivation",
    subject: "🏆 New Achievement Unlocked!",
    message: `Amazing work! 🌟

You've just unlocked a new achievement:

Achievement: "Eco Champion"
Milestone: 30 Days of Consistent Tracking

This is a huge accomplishment! You're making a real difference in the fight against climate change.

Your Stats:
• Total CO2 Saved: 125 kg
• Eco-Challenges Completed: 15
• Leaderboard Rank: #8

Keep pushing forward - you're inspiring others!

The Green Squad`,
    color: "bg-purple-500"
  },
  {
    id: "weekly-update",
    name: "Weekly Progress Update",
    icon: <CheckCircle className="h-4 w-4" />,
    category: "Updates",
    subject: "Your Weekly Sustainability Report 📊",
    message: `Hi there!

Here's your weekly sustainability summary:

This Week's Highlights:
• Distance Tracked: 45 km (bike & walk)
• CO2 Emissions Saved: 12.5 kg
• Eco-Challenges Completed: 3
• Points Earned: 250

Top Achievement: You're in the top 15% of active users!

Next Week's Goals:
• Complete 2 more eco-challenges
• Track 50 km of sustainable transport
• Reduce carbon footprint by 15 kg

View your detailed report in your dashboard.

Keep going strong!
Your Impact Team`,
    color: "bg-orange-500"
  },
  {
    id: "challenge-invitation",
    name: "Challenge Invitation",
    icon: <Sparkles className="h-4 w-4" />,
    category: "Engagement",
    subject: "Join Our New Eco-Challenge! 🌱",
    message: `Hey Eco-Warrior!

We're launching an exciting new challenge this month:

"30-Day Plastic-Free Challenge"

Challenge Details:
• Duration: 30 days
• Difficulty: Medium
• Rewards: 1000 points + Special Badge
• Participants: 247 users already joined!

What You'll Do:
• Reduce single-use plastic consumption
• Document your journey
• Share tips with the community
• Track your plastic-free days

Join hundreds of users making a difference!

[Accept Challenge]

Together, we're stronger!
The Challenge Team`,
    color: "bg-teal-500"
  },
  {
    id: "deadline-reminder",
    name: "Deadline Reminder",
    icon: <Clock className="h-4 w-4" />,
    category: "Urgent",
    subject: "⏰ Last Chance: Challenge Ends in 48 Hours",
    message: `Time is running out! ⏰

The "Green Commute Challenge" ends in just 48 hours!

Current Status:
• Your Progress: 75% complete
• Remaining Tasks: 2
• Potential Reward: 500 points

You're so close to completing this challenge! Just a little more effort and you'll earn:

✓ Exclusive "Green Commuter" Badge
✓ 500 bonus points
✓ Certificate of Achievement

Don't miss out on this opportunity!

[Complete Challenge Now]

You've got this!
The Support Team`,
    color: "bg-red-500"
  }
];

export default function AdminEmail_v02() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const { toast } = useToast();

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template.id);
    setSubject(template.subject);
    setMessage(template.message);
    
    toast({
      title: "Template Applied",
      description: `${template.name} template loaded successfully`,
    });
  };

const handleSendEmail = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!to || !subject || !message) {
    toast({
      title: "Missing fields",
      description: "Please fill in all fields",
      variant: "destructive",
    });
    return;
  }

  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, message }),
    });

    if (!res.ok) throw new Error("Failed to send email");

    toast({
      title: "Email Sent! 🎉",
      description: `Successfully sent to ${to}`,
    });

    setTo("");
    setSubject("");
    setMessage("");
    setSelectedTemplate(null);
  } catch (err) {
    toast({
      title: "Error sending email",
      description: (err as Error).message,
      variant: "destructive",
    });
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Email Campaign Manager
            </h1>
            <p className="text-slate-600 mt-1">Send personalized emails to your users</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template Selection */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-2 shadow-lg animate-scale-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  Quick Templates
                </CardTitle>
                <CardDescription>Choose a pre-made template to get started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                {templates.map((template, index) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-[1.02] ${
                      selectedTemplate === template.id
                        ? "ring-2 ring-blue-500 shadow-lg"
                        : "hover:ring-1 hover:ring-slate-300"
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 ${template.color} rounded-lg text-white`}>
                          {template.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm mb-1 truncate">
                            {template.name}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {template.category}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Email Composer */}
          <div className="lg:col-span-2">
            <Card className="border-2 shadow-lg animate-scale-in" style={{ animationDelay: "0.2s" }}>
              <CardHeader>
                <CardTitle>Compose Email</CardTitle>
                <CardDescription>
                  {selectedTemplate 
                    ? `Editing: ${templates.find(t => t.id === selectedTemplate)?.name}` 
                    : "Fill in the details below or select a template"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendEmail} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="to" className="text-base font-semibold">
                      Recipient Email
                    </Label>
                    <Input
                      id="to"
                      type="email"
                      placeholder="user@example.com"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className="h-12 text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-base font-semibold">
                      Subject Line
                    </Label>
                    <Input
                      id="subject"
                      type="text"
                      placeholder="Enter email subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="h-12 text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-base font-semibold">
                      Email Message
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Write your message here..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      className="min-h-[300px] text-base leading-relaxed resize-none"
                    />
                    <p className="text-xs text-slate-500">
                      {message.length} characters
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      className="flex-1 h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Send className="mr-2 h-5 w-5" />
                      Send Email
                    </Button>
                    {selectedTemplate && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-12 px-6"
                        onClick={() => {
                          setSelectedTemplate(null);
                          setSubject("");
                          setMessage("");
                          toast({ title: "Template cleared" });
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Preview Card */}
            {message && (
              <Card className="mt-6 border-2 shadow-lg animate-fade-in bg-gradient-to-br from-white to-slate-50">
                <CardHeader>
                  <CardTitle className="text-lg">Email Preview</CardTitle>
                  <CardDescription>How your email will appear to recipients</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-white border-2 rounded-lg p-6 shadow-sm">
                    <div className="border-b pb-4 mb-4">
                      <p className="text-sm text-slate-600 mb-1">To: {to || "user@example.com"}</p>
                      <h3 className="text-xl font-bold text-slate-900">{subject || "Subject Line"}</h3>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                        {message}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card className="border-2 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 animate-fade-in">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-xl">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-700 font-medium">Templates Available</p>
                  <p className="text-3xl font-bold text-blue-900">{templates.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg bg-gradient-to-br from-green-50 to-green-100 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-600 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-700 font-medium">Mock Mode</p>
                  <p className="text-3xl font-bold text-green-900">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-600 rounded-xl">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-purple-700 font-medium">Quick Start</p>
                  <p className="text-3xl font-bold text-purple-900">Ready</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
