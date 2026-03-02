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

import { useSelector, useDispatch } from "react-redux";
import { getUserProfile, logout } from "@/store/slices/userSlice";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  const dispatch = useDispatch();
  const router = useRouter();
  const sidebar = useSidebar();

  useEffect(() => {
    const fetchProfile = async () => {
      const result = await dispatch(getUserProfile());

      // Check if the request failed (invalid/expired token)
      if (getUserProfile.rejected.match(result)) {
        // Clear the invalid token and redirect to sign-in
        dispatch(logout());
        toast.error("Session expired. Please sign in again.");
        router.push("/sign-in");
      }
    };

    // Only fetch if we have a token
    if (user.token) {
      fetchProfile();
    } else {
      // No token, redirect to sign-in
      router.push("/sign-in");
    }
  }, [dispatch, router, user.token]);

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
              <Link href="#">
                <EvChargerIcon className="size-5!" />
                <span className="text-base font-semibold">
                  My Password Manager
                </span>
              </Link>
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
