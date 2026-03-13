"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

const WelcomeHero = () => {
  const user = useSelector<RootState, RootState["user"]>((state) => state.user);

  return (
    <h1 className="text-4xl text-center">
      Hello, @{user.user?.username || "world"}!
    </h1>
  );
};

export default WelcomeHero;
