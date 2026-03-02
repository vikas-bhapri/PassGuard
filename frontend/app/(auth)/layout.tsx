import Image from "next/image";
import React from "react";
import NextImage from "@/public/next.svg";
import type { Metadata } from "next";
import Provider from "@/app/Provider";

export const authMetadata: Metadata = {
  title: "Authentication",
  description: "Sign in or sign up to manage your passwords securely.",
};

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider>
      <div className="flex m-auto w-full">
        <div className="auth-form-hero-background text-center hidden md:flex flex-col min-h-screen lg:min-w-[40%] md:min-w-[30%] items-center justify-center gap-5">
          <Image src={NextImage} alt="An Image" className="w-sm" />
          <h1 className="text-4xl font-semibold">My Password Manager</h1>
          <p className="text-xl">
            Manage your passwords securely and efficiently.
          </p>
        </div>
        <div className="flex flex-col min-h-screen items-center justify-center dark:bg-black w-full md:min-w-[60%]">
          <div className="md:hidden text-center flex flex-col items-center gap-6 justify-center mb-5">
            <Image src={NextImage} alt="An Image" />
            <h1>My Password Manager</h1>
            <p>Manage your passwords securely and efficiently.</p>
          </div>
          {children}
        </div>
      </div>
    </Provider>
  );
};

export default AuthLayout;
