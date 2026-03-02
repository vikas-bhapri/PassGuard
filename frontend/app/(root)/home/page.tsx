"use client";

import React from "react";

import { useSelector } from "react-redux";
import { redirect } from "next/navigation";

const HomePage = () => {
  const user = useSelector((state) => state?.user);

  if (!user || !user.token) {
    redirect("/sign-in");
  }

  return <div>Welcome {user.user?.username}</div>;
};

export default HomePage;
