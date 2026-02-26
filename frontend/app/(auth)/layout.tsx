import Image from "next/image";
import React from "react";
import NextImage from "@/public/next.svg";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex m-auto w-full">
      <div className="bg-gray-300 hidden md:flex flex-col min-h-screen lg:min-w-[40%] md:min-w-[30%] items-center justify-center gap-5">
        <Image src={NextImage} alt="An Image" />
        <h1>My Password Manager</h1>
        <p>Manage your passwords securely and efficiently.</p>
      </div>
      <div className="flex flex-col min-h-screen items-center justify-center dark:bg-black w-full md:min-w-[60%]">
        <div className="md:hidden flex flex-col items-center gap-6 justify-center mb-5">
          <Image src={NextImage} alt="An Image" />
          <h1>My Password Manager</h1>
          <p>Manage your passwords securely and efficiently.</p>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
