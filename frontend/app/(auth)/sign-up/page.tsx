import SignUpForm from "@/app/components/auth/SignUpForm";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - Password Manager",
  description: "Sign up to manage your passwords securely.",
};

const SignUpPage = () => {
  return (
    <>
      <h1 className="text-2xl font-semibold mb-4">
        Sign Up to Password Manager here!
      </h1>
      <SignUpForm />
      <p className="mt-3">
        Already have an account?{" "}
        <Link className="text-blue-500" href="/sign-in">
          Sign In
        </Link>
      </p>
    </>
  );
};

export default SignUpPage;
