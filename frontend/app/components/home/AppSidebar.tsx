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

import { useDispatch, useSelector } from "react-redux";
import { NavUser } from "./nav-user";
import Link from "next/link";
import NavPassword from "./nav-password";
import { AppDispatch, RootState } from "@/store/store";
import { useEffect } from "react";
import { getProfilePicture } from "@/store/slices/userSlice";

type User = {
  username: string;
  first_name: string;
  last_name: string;
  image_url: string;
  role: string;
  email: string;
};

const SAS_REFRESH_INTERVAL = 4 * 60 * 1000; // 4 minutes

export function AppSidebar(props) {
  const user = useSelector((state: RootState) => state.user);
  const sidebar = useSidebar();
  const path = usePathname();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (!user.user?.image_url) return;

    const interval = setInterval(() => {
      dispatch(getProfilePicture());
    }, SAS_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [dispatch, user.user?.image_url]);

  const userData: User = user.user;

  const sideBarItems = {
    user: {
      name: userData?.username || "User",
      avatar: userData?.image_url || "",
      email: userData?.email || "test@email.com",
      role: userData?.role || "user",
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
