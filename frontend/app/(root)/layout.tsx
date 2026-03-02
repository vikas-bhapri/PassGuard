import React from "react";
import type { Metadata } from "next";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "../components/home/AppSidebar";
import Provider from "@/app/Provider";

export const homeMetadata: Metadata = {
  title: "Home",
  description:
    "This is the home page of My Password Manager. Manage your passwords securely and efficiently. Create and manage your passwords with ease. Your security is our priority.",
};

export const sidebarData = {};

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider>
      <SidebarProvider>
        <AppSidebar />
        <main>
          <SidebarTrigger />
          {children}
        </main>
      </SidebarProvider>
    </Provider>
  );
};

export default layout;
