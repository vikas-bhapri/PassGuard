import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/home/AppSidebar";
import TopNav from "./components/home/TopNav";

export default function NotFound() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <TopNav />
        <main>
          <div className="w-full min-h-[90vh] flex flex-col justify-center items-center gap-6">
            <h1 className="text-6xl font-bold">404</h1>
            <h2 className="text-2xl font-semibold">Page Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400">
              The page you're looking for doesn't exist.
            </p>
            <Link href="/passwords">
              <Button>Go to Home</Button>
            </Link>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
