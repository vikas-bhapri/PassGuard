import React from "react";
import type { Metadata } from "next";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "../components/home/AppSidebar";

export const homeMetadata: Metadata = {
  title: "Home",
  description:
    "This is the home page of My Password Manager. Manage your passwords securely and efficiently. Create and manage your passwords with ease. Your security is our priority.",
};

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main>{children}</main>
    </SidebarProvider>
  );
};

export default layout;
