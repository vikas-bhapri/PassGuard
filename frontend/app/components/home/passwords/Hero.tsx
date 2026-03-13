"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

const Hero = ({ className }: { className?: string }) => {
  const user = useSelector((state: RootState) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (!user || !user.user) {
      router.replace("/sign-in");
    }
  }, [user, router]);

  if (!user || !user.user) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className={`text-center w-9/10 mx-auto ${className}`}>
      <h1 className="text-4xl font-semibold">Hello {user.user.username}!</h1>
      <p className="text-2xl mt-3">Welcome to your password manager.</p>
      <p className="text-xl mt-3">
        We follow some of the best practices to ensure your passwords are safe
        and secure.
      </p>
      <p className="text-xl mt-2">
        Feel free to manage your passwords and update your account settings.
      </p>
      <p className="text-xl mt-2">
        And don&apos;t worry, your data is yours only. We respect your privacy.
      </p>
    </div>
  );
};

export default Hero;
