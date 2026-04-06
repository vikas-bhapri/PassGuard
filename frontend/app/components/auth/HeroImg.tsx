"use client";

import Image from "next/image";

import signInImage from "@/public/signIn.png";
import signInError from "@/public/signInError.png";
import signUpImage from "@/public/signUp.png";
import { usePathname } from "next/navigation";

const HeroImg = () => {
  const pathname = usePathname();
  console.log("Current pathname:", pathname);

  let imageSrc;
  if (pathname === "/sign-in") {
    imageSrc = signInImage;
  } else if (pathname === "/sign-up") {
    imageSrc = signUpImage;
  } else if (pathname === "/sign-in-error") {
    imageSrc = signInError;
  }

  if (!imageSrc) return null;

  return (
    <Image
      src={imageSrc}
      alt="Authentication Image"
      className="w-full h-auto object-cover rounded-lg"
    />
  );
};

export default HeroImg;
