"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

import { KeyIcon, NotebookPenIcon, Lightbulb, BotIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import { useSelector } from "react-redux";
import { NavUser } from "./nav-user";
import Link from "next/link";
import NavPassword from "./nav-password";

type User = {
  username: string;
  first_name: string;
  last_name: string;
  image_url: string;
  role: string;
  email: string;
};

export function AppSidebar(props) {
  const user = useSelector((state: any) => state.user);
  const sidebar = useSidebar();
  const path = usePathname();

  const userData: User = user.user;

  const sideBarItems = {
    user: {
      name: userData?.username || "User",
      avatar: userData?.image_url || "",
      email: userData?.email || "test@email.com",
    },
    navMain: [
      {
        name: "Passwords",
        url: "/passwords",
        icon: KeyIcon,
      },
      {
        name: "To-Do List",
        url: "/todo",
        icon: NotebookPenIcon,
      },
      {
        name: "Reminders",
        url: "/reminders",
        icon: Lightbulb,
      },
    ],
  };

  if (path === "/sign-in" || path === "/sign-up" || path === "/welcome") {
    return null; // Don't render AppSidebar on sign-in, sign-up, and welcome pages
  }

  return (
    <Sidebar className="text-lg" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <div className={`flex items-center gap-2`}>
                <BotIcon
                  className="size-5!"
                  onClick={() => sidebar.toggleSidebar()}
                />
                <Link href="/passwords">
                  <span className={`text-xl text-center font-semibold`}>
                    PassGuard
                  </span>
                </Link>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavPassword items={sideBarItems.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sideBarItems.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
