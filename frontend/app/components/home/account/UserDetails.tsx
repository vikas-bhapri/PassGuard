"use client";

import { useSelector } from "react-redux";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const UserDetails = () => {
  const user = useSelector((state: any) => state.user.user);

  return (
    <>
      <Avatar className="w-40 md:w-30 sm:w-20 h-40 md:h-30 sm:h-20">
        <AvatarImage src={user?.image_url} alt={user?.username} />
        <AvatarFallback className="text-3xl">
          {user?.username?.[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="w-full sm:w-auto">
        <h1 className="text-center md:text-left text-2xl font-bold">
          User Account: @{user?.username}
        </h1>
        <p>First Name: {user?.first_name}</p>
        <p>Last Name: {user?.last_name}</p>
        <p>Email: {user?.email}</p>
      </div>
    </>
  );
};

export default UserDetails;
