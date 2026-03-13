"use client";

import React from "react";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";

const TopNav = () => {
  const path = usePathname();

  if (path === "/sign-in" || path === "/sign-up" || path === "/welcome") {
    return null; // Don't render TopNav on sign-in, sign-up, and welcome pages
  }

  const pageTitle =
    path.split("/")[1]?.charAt(0).toUpperCase() +
      path.split("/")[1]?.slice(1) || "Home";

  return (
    <div className="flex m-2 rounded-md py-2 px-4 border min-h-12.5">
      <SidebarTrigger className="md:hidden" />
      <p className="font-semibold text-lg">{pageTitle}</p>
    </div>
  );
};

export default TopNav;
