"use client";

import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";

const HomePage = () => {
  const user = useSelector((state: any) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (!user || !user.token) {
      router.replace("/sign-in");
    }
  }, [user, router]);

  if (!user || !user.token) {
    return null; // Don't render anything while redirecting
  }

  return <div>Welcome </div>;
};

export default HomePage;
