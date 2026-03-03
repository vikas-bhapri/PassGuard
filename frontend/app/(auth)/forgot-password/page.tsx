import ForgotPasswordForm from "@/app/components/auth/ForgotPasswordForm";
import type { Metadata } from "next";

import Link from "next/link";

export const metadata: Metadata = {
  title: "Forgot Password - Password Manager",
  description: "Reset your password securely.",
};

const ForgotPasswordPage = () => {
  return (
    <>
      <h1 className="text-3xl font-semibold text-center">
        Did you forget your password?
      </h1>
      <p className="text-center text-lg mt-3">
        Enter your email address below and we&apos;ll send you instructions to
        reset your password.
      </p>
      <ForgotPasswordForm />
      <p>
        Go back to{" "}
        <Link href="/sign-in" className="text-blue-500">
          sign in
        </Link>
      </p>
    </>
  );
};

export default ForgotPasswordPage;
