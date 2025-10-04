import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "../lib/api";
import { Spinner } from "@/components/ui/spinner"; 

const ForgotPassword = () => {
  const [email, setEmail] = useState("");

  const {
    mutate: sendPasswordReset,
    isPending,
    isSuccess,
    isError,
    error,
  } = useMutation({
    mutationFn: sendPasswordResetEmail,
  });

  const isValidEmail = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(email);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full mx-auto py-12 px-6 bg-white shadow-lg rounded-lg space-y-6">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Reset your password
        </h2>

        {isError && (
          <div className="mb-4 text-red-500 text-center">
            {error?.message || "An error occurred"}
          </div>
        )}

        <div>
          {isSuccess ? (
            <div className="alert alert-success text-green-500 text-center p-4 rounded-md border border-green-200">
              Email sent! Check your inbox for further instructions.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 p-3 w-full border border-gray-300 rounded-md"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full mt-4 p-3 bg-blue-500 text-white rounded-md disabled:opacity-50"
                disabled={!isValidEmail || isPending}
                onClick={() => sendPasswordReset(email)}
              >
                {isPending ? <Spinner size="8" color="border-white" loading={isPending} /> : "Reset Password"}
              </button>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-500">
            Go back to{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
            &nbsp;or&nbsp;
            <Link to="/register" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
