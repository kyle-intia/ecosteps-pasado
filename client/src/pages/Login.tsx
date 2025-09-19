import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/AuthLayout";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { login } from "../lib/api";
import queryClient from "../config/queryClient";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectUrl = location.state?.redirectUrl || "/pre-assessment";

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (loggedIn) {
      navigate(redirectUrl, { replace: true });
    }
  }, [navigate]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    const email = formData.email.trim();
    const password = formData.password;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
  
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkPreAssessmentStatus = async () => {
    try {
      const response = await fetch("http://localhost:4004/api/preassessment/user/status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data?.assessmentDone) {
        navigate("/home", { replace: true });
      } else {
        navigate("/pre-assessment", { replace: true });
      }
    } catch (error) {
      console.error("Error checking assessment status:", error);
      // Default to pre-assessment if error
      navigate("/pre-assessment", { replace: true });
    }
  };

  const {
    mutate: signIn,
    isPending,
  } = useMutation({
    mutationFn:  (data: typeof formData) => login(data),
    onSuccess: () => {
      localStorage.setItem("isLoggedIn", "true");
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in to EcoStep.",
      });
      queryClient.invalidateQueries(["userProfileDetails"]);
      queryClient.invalidateQueries(["auth"]);
      checkPreAssessmentStatus();
    },
    onError: (error: any) => {
      let description = "Invalid email or password. Please try again.";

      if (error?.message?.includes("verify your email")) {
        description = "Please verify your email before logging in. Check your inbox for the verification link.";
      } else if (error?.message) {
        description = error.message;
      }

      toast({
        title: "Login failed",
        description,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      signIn({ email: formData.email, password: formData.password });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const isEmailValid = formData.email;
  const isPasswordValid = formData.password.length >= 8;
  const isNoErrors = Object.keys(errors).length === 0;
  
  const isFormValid = isNoErrors && isEmailValid && isPasswordValid;
      

  return (
    <AuthLayout
      title="Welcome Back"
      description="Log in to your EcoStep account to continue tracking your carbon footprint"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            required
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-red-500 mt-1">
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              tabIndex={-1}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {errors.password && (
            <p id="password-error" className="text-sm text-red-500 mt-1">
              {errors.password}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Link to="/password/forgot" className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="hero"
          className="w-full"
          disabled={!isFormValid || isPending}
        >
          {isPending ? "Signing In..." : "Sign In"}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
