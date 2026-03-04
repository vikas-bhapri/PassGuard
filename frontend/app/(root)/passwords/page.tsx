import { Metadata } from "next";
import Hero from "@/app/components/home/passwords/Hero";
import ListPasswords from "../../components/home/passwords/ListPasswords";

export const metadata: Metadata = {
  title: "Passwords",
  description:
    "This is the home page of My Password Manager. Manage your passwords securely and efficiently. Create and manage your passwords with ease. Your security is our priority.",
};

const HomePage = () => {
  return (
    <div className="container mx-auto">
      <Hero className="my-10" />
      <ListPasswords />
    </div>
  );
};

export default HomePage;
