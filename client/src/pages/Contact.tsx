import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Leaf, Send, MessageCircle, Mail, Phone, Clock, HelpCircle, Bug, Lightbulb, Trees, Sprout, Wind, ArrowRight, ArrowLeft } from "lucide-react";
import { contactSupportEmail } from "../lib/api"
import { Link, useNavigate } from "react-router-dom";

const supportCategories = [
  { value: "General Inquiry", label: "General Inquiry", icon: HelpCircle },
  { value: "Technical Issue", label: "Technical Issue", icon: Bug },
  { value: "Feature Request", label: "Feature Request", icon: Lightbulb },
  { value: "Account Help", label: "Account Help", icon: MessageCircle },
];

const contactInfo = [
  { icon: Mail, label: "Email", value: "ecosteps.online@gmail.com" },
  { icon: Phone, label: "Phone", value: "+63 945 865 6557" },
  { icon: Clock, label: "Hours", value: "Mon-Fri, 9:00 AM - 5:00 PM" },
];

const faqs = [
  { question: "How do I track my carbon footprint?", answer: "Navigate to the Track page and log your daily activities including transportation, energy usage, and consumption." },
  { question: "How are eco-points calculated?", answer: "Points are earned based on Eco-challenge, Community Posts, and your Daily Activities" },
];


const FloatingLeaf = ({ delay, x, duration }: { delay: number; x: number; duration: number }) => (
  <motion.div
    initial={{ y: -20, x, opacity: 0, rotate: 0 }}
    animate={{ 
      y: [0, 30, 0], 
      opacity: [0.3, 0.6, 0.3],
      rotate: [0, 15, -15, 0]
    }}
    transition={{ 
      duration, 
      delay, 
      repeat: Infinity, 
      ease: "easeInOut" 
    }}
    className="absolute text-eco/30"
  >
    <Leaf className="w-6 h-6" />
  </motion.div>
);

const ContactSupport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    message: "",
  });

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {

    const ticketNumber = "ECO-" + Math.floor(100000 + Math.random() * 900000);

      const formattedMessage = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body, table, td, div {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #2F2F2F;
    }

    body {
      background: #E8EFEA;
      padding: 40px 20px;
    }

    .wrapper {
      max-width: 650px;
      margin: 0 auto;
      background: #FFFFFF;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #DDE5E1;
      box-shadow: 0 3px 12px rgba(0,0,0,0.05);
    }

    /* Image header */
    .header-image {
      width: 100%;
      display: block;
    }

    .content {
      padding: 30px;
    }

    h2 {
      margin: 0 0 20px 0;
      font-size: 22px;
      color: #1B5E44;
    }


    .field {
      margin-bottom: 22px;
    }

    .label {
      font-size: 13px;
      font-weight: bold;
      color: #144B38;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }

    .value {
      background: #F3FAF6;
      border-left: 4px solid #5BAF86;
      padding: 12px 14px;
      border-radius: 6px;
      white-space: pre-wrap;
      font-size: 14px;
      line-height: 1.5;
    }

    .footer {
      margin-top: 35px;
      text-align: center;
      font-size: 12px;
      color: #8A8A8A;
      padding: 15px;
      border-top: 1px solid #E6E6E6;
    }
  </style>
</head>

<body>

  <div class="wrapper">

    <!-- IMAGE HEADER -->
    <img 
      src="https://res.cloudinary.com/dbrqfyxo0/image/upload/v1764784953/home_bg2_s53iko.png" 
      alt="EcoWalk Header" 
      class="header-image"
    />

    <!-- CONTENT -->
    <div class="content">
      <h2>${formData.category} : ${ticketNumber}</h2>

      <div class="field">
        <div class="label">Name</div>
        <div class="value">${formData.name}</div>
      </div>

      <div class="field">
        <div class="label">Email</div>
        <div class="value">${formData.email}</div>
      </div>

      <div class="field">
        <div class="label">Message</div>
        <div class="value">${formData.message}</div>
      </div>
    </div>

    <div class="footer">
      Sent via EcoWalk Support Center.
    </div>

  </div>

</body>
</html>

      `;
        
    const response = await contactSupportEmail({
      email: formData.email,
      subject: formData.category,
      message: formattedMessage,
    });

    // Axios throws on 4xx/5xx, so if we're here → it's success!
    toast({
      title: "Message Sent!",
      description: "We'll get back to you within 48 hours. Thank you for reaching out!",
    });

    // Reset form
    setFormData({
      name: "",
      email: "",
      category: "",
      message: "",
    });

  } catch (error: any) {
    toast({
      title: "Error",
      description: error.response?.data?.error || error.message || "Failed to send message",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};


  return (
    <div className="min-h-screen bg-background">
      {/* Eco Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-eco/10 via-eco/5 to-background border-b border-eco/20">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <FloatingLeaf delay={0} x={50} duration={4} />
          <FloatingLeaf delay={1} x={150} duration={5} />
          <FloatingLeaf delay={2} x={280} duration={4.5} />
          <FloatingLeaf delay={0.5} x={400} duration={5.5} />
          <FloatingLeaf delay={1.5} x={550} duration={4} />
          <div className="absolute top-0 right-0 w-96 h-96 bg-eco/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-eco/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative px-6 py-16 md:py-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo badge */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.8 }}
              className="inline-flex items-center justify-center mb-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-eco/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-eco to-eco/70 flex items-center justify-center shadow-lg shadow-eco/30">
                  <img
                    src="/ecosteps.svg"
                    alt="EcoStep Logo"
                    className="w-[80%] h-[80%] filter drop-shadow-[2px_2px_2px_white] drop-shadow-[0_0_4px_white]"
                  />
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-2 -right-2"
                >
                  <Sprout className="w-8 h-8 text-eco" />
                </motion.div>
              </div>
            </motion.div>

            {/* Brand name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-2 mb-4"
            >
              <span className="text-sm font-medium text-eco uppercase tracking-widest">EcoSteps</span>
              <Wind className="w-4 h-4 text-eco/60" />
              <span className="text-sm text-muted-foreground">Support Center</span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-6xl font-bold text-foreground mb-6"
            >
              How Can We{" "}
              <span className="text-eco relative">
                Help
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 100 8" preserveAspectRatio="none">
                  <path d="M0,5 Q25,0 50,5 T100,5" fill="none" stroke="currentColor" strokeWidth="2" className="text-eco/40" />
                </svg>
              </span>
              ?
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              Our eco-support team is dedicated to helping you on your sustainability journey. 
              Every question matters—let's make a greener impact together.
            </motion.p>

          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2"
          >
            <Card className="border-eco/20 shadow-xl shadow-eco/5 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-eco/10 via-eco/5 to-transparent border-b border-eco/10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-eco rounded-xl shadow-lg shadow-eco/30">
                    <Send className="w-6 h-6 text-eco-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Send us a Message</CardTitle>
                    <CardDescription className="text-base">We'll get back to you within 48 hours</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="h-12 border-2 border-border focus:border-eco transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="h-12 border-2 border-border focus:border-eco transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Subject</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger className="h-12 border-2 border-border">
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {supportCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              <div className="flex items-center gap-2">
                                <cat.icon className="w-4 h-4 text-eco" />
                                {cat.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-medium">Your Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Please describe your question or issue in detail..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      rows={6}
                      className="border-2 border-border focus:border-eco transition-colors resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 bg-gradient-to-r from-eco to-eco/80 hover:from-eco/90 hover:to-eco/70 text-eco-foreground font-semibold text-lg shadow-lg shadow-eco/30 transition-all hover:shadow-eco/40 hover:scale-[1.02]"
                  >
                    {isSubmitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Leaf className="w-6 h-6" />
                      </motion.div>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-6"
          >
            {/* Contact Info Card */}
            <Card className="border-eco/20 shadow-lg overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-r from-eco/5 to-transparent">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 bg-eco/20 rounded-lg">
                    <Leaf className="w-5 h-5 text-eco" />
                  </div>
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contactInfo.map((info, index) => (
                  <motion.div
                    key={info.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-eco/5 to-transparent hover:from-eco/10 transition-all cursor-pointer group"
                  >
                    <div className="p-2.5 bg-eco/20 rounded-lg group-hover:bg-eco/30 transition-colors">
                      <info.icon className="w-4 h-4 text-eco" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{info.label}</p>
                      <p className="text-sm text-muted-foreground">{info.value}</p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Quick FAQs */}
            <Card className="border-eco/20 shadow-lg">
              <CardHeader className="pb-4 bg-gradient-to-r from-eco/5 to-transparent">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 bg-eco/20 rounded-lg">
                    <HelpCircle className="w-5 h-5 text-eco" />
                  </div>
                  Quick Answers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + index * 0.1 }}
                    className="p-4 rounded-xl border-2 border-border hover:border-eco/40 transition-all cursor-pointer group"
                  >
                    <p className="text-sm font-semibold text-foreground mb-2 group-hover:text-eco transition-colors">
                      {faq.question}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Eco Impact Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.3 }}
              className="relative p-6 rounded-2xl bg-gradient-to-br from-eco via-eco/90 to-eco/70 text-eco-foreground shadow-xl shadow-eco/30 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-eco-foreground/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-eco-foreground/10 rounded-full blur-xl" />
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-eco-foreground/20 rounded-lg">
                    <Sprout className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-lg">Ready to Make a Difference?</span>
                </div>
                <p className="text-sm opacity-90 mb-4">
                  Start your journey towards a more sustainable future today. Every small step counts towards a greener planet.
                </p>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Button variant="outline" size="sm" asChild className="transition-all duration-300 ease-out">
                    <Link to="/register">
                      Join EcoSteps Today
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

        <div className="sticky bottom-0 left-0 right-0 backdrop-blur-sm border-t border-[hsl(240,6%,90%)] p-4 shadow-lg z-50">
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
  );
};

export default ContactSupport;
