import { Suspense } from "react";
import type { Metadata } from "next";
import ResetPasswordForm from "@/app/components/auth/ResetPasswordFrom";

export const metadata: Metadata = {
  title: "Reset Password - Password Manager",
  description: "Reset your password securely.",
};

const ResetPasswordPage = () => {
  return (
    <>
      <h1 className="text-3xl font-semibold text-center">Reset Password</h1>
      <p className="text-center text-lg mt-3">
        Enter your new password below and confirm it to reset your password.
      </p>
      <Suspense fallback={<div className="w-sm mt-6">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
};

export default ResetPasswordPage;
