import SignInForm from "@/app/components/auth/SignInForm";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - Password Manager",
  description: "Sign in to manage your passwords securely.",
};

const SignIn = () => {
  return (
    <>
      <h1 className="text-2xl font-semibold mb-5">Sign In to your account!</h1>
      <SignInForm />
      <p className="mt-5">
        Don&apos;t have an account?{" "}
        <Link className="text-blue-500" href={"/sign-up"}>
          Sign Up
        </Link>
      </p>
    </>
  );
};

export default SignIn;
