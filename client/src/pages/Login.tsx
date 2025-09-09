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

  const {
    mutate: signIn,
    isPending,
  } = useMutation({
    mutationFn:  (data: typeof formData) => login(data),
    onSuccess: () => {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userEmail", formData.email);
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in to EcoStep.",
      });
      navigate(redirectUrl, { replace: true });
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error?.message || "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
// Di pasure
    if (validateForm()) {
      signIn({ email: formData.email, password: formData.password });
    }

    setIsLoading(true);

    // Mock authentication
    setTimeout(() => {
      if (formData.email && formData.password) {
        // Ensure a mock userId exists (re-use if already created during register)
        let userId = localStorage.getItem("userId");
        if (!userId) {
          userId = Array.from(crypto.getRandomValues(new Uint8Array(12)))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          localStorage.setItem("userId", userId);
        }
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userEmail", formData.email);
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in to EcoStep.",
        });
        navigate("/home");
      } else {
        toast({
          title: "Error",
          description: "Please fill in all fields.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
// Di pa sure
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const isFormValid =
    Object.keys(errors).length === 0 &&
    formData.email &&
    formData.password.length >= 8;
    

  return (
    <AuthLayout
      title="Welcome Back"
      description="Sign in to your EcoStep account to continue tracking your carbon footprint"
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
            onBlur={validateForm}
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
