import React from "react";

import { CirclePlusIcon, MailIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";

const NavPassword = ({
  items,
}: {
  items: { name: string; url: string; icon: React.ElementType }[];
}) => {
  const sidebar = useSidebar();

  const openSidebar = () => {
    if (sidebar.state === "collapsed") {
      sidebar.toggleSidebar();
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <Link key={item.name} href={item.url}>
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton tooltip={item.name} onClick={openSidebar}>
                  {item.icon && <item.icon />}
                  {item.name}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </Link>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default NavPassword;
