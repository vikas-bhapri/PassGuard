import React from "react";
import type { Metadata } from "next";
import HeroImg from "../components/auth/HeroImg";

export const authMetadata: Metadata = {
  title: "Authentication",
  description: "Sign in or sign up to manage your passwords securely.",
};

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex m-auto w-full">
      <div className="auth-form-hero-background text-white text-center hidden md:flex flex-col min-h-screen lg:min-w-[40%] md:min-w-[30%] items-center justify-center gap-5">
        <HeroImg />
        <h1 className="text-4xl font-semibold">PassGuard</h1>
        <p className="text-xl w-9/10">
          Create and manage your passwords with ease. We follow zero-knowledge
          principles to ensure your data is safe and private. Your security is
          our priority.
        </p>
      </div>
      <div className="flex flex-col min-h-screen items-center justify-center bg-background w-full md:min-w-[60%]">
        <div className="md:hidden text-center flex flex-col items-center gap-6 justify-center mb-5 w-9/10">
          <HeroImg />
          <h1 className="text-4xl font-semibold">PassGuard</h1>
          <p className="text-xl">
            Create and manage your passwords with ease. We follow zero-knowledge
            principles to ensure your data is safe and private. Your security is
            our priority.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
