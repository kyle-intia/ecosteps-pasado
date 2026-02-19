import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/AuthLayout";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { register, login } from "../lib/api";
import queryClient from "../config/queryClient";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)
    ) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/^[a-zA-Z0-9!@#$%^&*()\-_=+]+$/.test(formData.password)) {
      newErrors.password =
        "Password can only contain letters, numbers, and the following special characters: !@#$%^&*()-_=+";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.confirmPassword = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isPasswordValid =
    formData.password.length >= 8 &&
    /^[a-zA-Z0-9!@#$%^&*()\-_=+]+$/.test(formData.password);

  const { mutate: createAccount, isPending } = useMutation({
    mutationFn: (data: {
      email: string;
      password: string;
      confirmPassword: string;
    }) => register(data),
    onSuccess: async (_, variables) => {
      try {
        await login({ email: variables.email, password: variables.password });
        localStorage.setItem("isLoggedIn", "true");
        queryClient.invalidateQueries(["userProfileDetails"]);
        queryClient.invalidateQueries(["auth"]);
        toast({
          title: "Welcome to EcoStep!",
          description: "Your account is ready and you're now logged in.",
        });
        navigate("/pre-assessment", { replace: true });
      } catch (error: any) {
        toast({
          title: "Account Created Successfully",
          description:
            "Please check your email and verify your account before logging in.",
        });
        navigate("/verify-email-prompt", { replace: true });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Register failed",
        description:
          error?.message || "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      createAccount({
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const isFormValid =
    formData.email &&
    formData.password.length >= 8 &&
    formData.password === formData.confirmPassword &&
    Object.keys(errors).length === 0;

  return (
    <AuthLayout
      title="Join EcoSteps"
      description="Create your account and start making a positive environmental impact today"
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
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {errors.password && (
            <p id="password-error" className="text-sm text-red-500 mt-1">
              {errors.password}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <ul
          className={`text-xs mt-1 transition-colors ${
            formData.password.length === 0
              ? "text-muted-foreground"
              : isPasswordValid
                ? "text-green-600"
                : "text-red-500"
          }`}
        >
          <li>Must be at least 8 characters long.</li>
          <li>Letters, numbers, and the following symbols are allowed:</li>
          <li>
            <span className="font-mono"> !@#$%^&*()-_=+</span>
          </li>
        </ul>

        <Button
          type="submit"
          variant="hero"
          className="w-full transition-all duration-300 ease-out"
          disabled={isPending || !isFormValid}
        >
          {isPending ? "Creating Account..." : "Create Account"}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary hover:underline font-medium"
          >
            Log in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
