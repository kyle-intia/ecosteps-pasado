import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner"; 
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { verifyEmail } from "@/lib/api"; 


const VerifyEmail = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { isPending, isSuccess, isError } = useQuery({
    queryKey: ["emailVerification", code],
    queryFn: () => verifyEmail(code),
  });

  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "Email Verified!",
        description: "Your email has been successfully verified.",
      });
    }
    if (isError) {
      toast({
        title: "Invalid Link",
        description: "The verification link is either invalid or expired.",
        variant: "destructive",
      });
    }
  }, [isSuccess, isError, toast]);

  return (
<div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full mx-auto py-12 px-6 bg-white shadow-lg rounded-lg space-y-6">
        {isPending ? (
          <Spinner size="10" color="border-blue-500" loading={isPending} />
        ) : (
          <>
            <div>
              <h2 className="text-lg font-semibold">
                {isSuccess ? "Email Verified!" : "Invalid Link"}
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                {isSuccess
                  ? "Your email has been successfully verified. You can now proceed."
                  : "The link is either invalid or expired."}
              </p>
            </div>
            {isError && (
              <div className="mt-4">
                <Link to="/password/forgot" className="text-blue-600 hover:underline">
                  Get a new verification link
                </Link>
              </div>
            )}
            <Button
              className="w-full mt-6"
              onClick={() => navigate("/login")}
            >
              Login
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
