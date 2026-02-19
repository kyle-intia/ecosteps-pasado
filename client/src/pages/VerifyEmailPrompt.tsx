import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/AuthLayout";
import { Mail, CheckCircle } from "lucide-react";

export default function VerifyEmailPrompt() {
  const navigate = useNavigate();

  return (
    <AuthLayout
      title="Check Your Email"
      description="We've sent you a verification link to complete your registration"
    >
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-blue-100 p-3">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Verify Your Email Address</h3>
          <p className="text-sm text-muted-foreground">
            We've sent a verification link to your email address. Please check
            your inbox and click the link to verify your account.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-blue-800">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">What happens next?</span>
          </div>
          <p className="text-sm text-blue-700 mt-2">
            Once you verify your email, you'll be able to sign in and start your
            carbon footprint assessment.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => navigate("/login")}
            variant="hero"
            className="w-full"
          >
            Continue to Sign In
          </Button>

          <p className="text-xs text-muted-foreground">
            Didn't receive the email? Check your spam folder or{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-primary hover:underline"
            >
              try registering again
            </button>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
