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

import {
  KeyIcon,
  NotebookPenIcon,
  Lightbulb,
  EvChargerIcon,
} from "lucide-react";

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
        url: "/home",
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

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <div className={`flex items-center gap-2`}>
                <EvChargerIcon
                  className="size-5!"
                  onClick={() => sidebar.toggleSidebar()}
                />
                <Link href="#">
                  <span className={`text-base text-center font-semibold`}>
                    My Password Manager
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
