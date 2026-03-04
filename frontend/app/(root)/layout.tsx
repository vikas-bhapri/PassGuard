import React from "react";
import type { Metadata } from "next";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "../components/home/AppSidebar";
import TopNav from "../components/home/TopNav";

export const homeMetadata: Metadata = {
  title: "Home",
  description:
    "This is the home page of My Password Manager. Manage your passwords securely and efficiently. Create and manage your passwords with ease. Your security is our priority.",
};

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <TopNav />
          <main>{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
};

export default layout;
