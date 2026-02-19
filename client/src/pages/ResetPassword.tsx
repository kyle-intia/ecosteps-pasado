import { useSearchParams, Link } from "react-router-dom";
import ResetPasswordForm from "@/components/ResetPasswordForm";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const exp = Number(searchParams.get("exp"));
  const now = Date.now();
  const linkIsValid = code && exp && exp > now;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full mx-auto py-12 px-6 bg-white shadow-lg rounded-lg space-y-6">
        {linkIsValid ? (
          <ResetPasswordForm code={code} />
        ) : (
          <div className="text-center space-y-6">
            <div className="alert alert-error text-red-500 border border-red-300 p-4 rounded-md">
              Invalid Link
            </div>
            <p className="text-gray-500">
              The link is either invalid or expired.
            </p>
            <Link
              to="/password/forgot"
              className="text-blue-600 hover:underline"
            >
              Request a new password reset link
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
