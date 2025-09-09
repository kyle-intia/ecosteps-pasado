import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { resetPassword } from "../lib/api";
import { Spinner } from "./ui/spinner";

const ResetPasswordForm = ({ code }: { code: string }) => {
  const [password, setPassword] = useState("");

  const {
    mutate: resetUserPassword,
    isPending,
    isSuccess,
    isError,
    error,
  } = useMutation({
    mutationFn: resetPassword,
  });

  return (
    <div className="max-w-md w-full mx-auto py-12 px-6">
      <h2 className="text-3xl font-semibold text-center mb-8">Change your password</h2>

      <div className="bg-white shadow-lg rounded-lg p-8">
        {isError && (
          <div className="text-red-500 mb-3">
            {error?.message || "An error occurred"}
          </div>
        )}

        {isSuccess ? (
          <div>
            <div className="alert alert-success text-green-500 border border-green-300 p-4 rounded-md mb-3">
              Password updated successfully!
            </div>
            <Link to="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 p-3 w-full border border-gray-300 rounded-md"
                autoFocus
                onKeyDown={(e) =>
                  e.key === "Enter" && resetUserPassword({ password, verificationCode: code })
                }
              />
            </div>

            <button
              className={`w-full p-3 bg-blue-500 text-white rounded-md ${password.length < 6 ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={password.length < 6 || isPending}
              onClick={() =>
                resetUserPassword({
                  password,
                  verificationCode: code,
                })
              }
            >
              {isPending ? <Spinner size="8" color="border-white" loading={isPending} /> : "Reset Password"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordForm;
