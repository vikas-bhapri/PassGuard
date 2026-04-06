"use client";

import { AppDispatch, RootState } from "@/store/store";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PlusCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchServices } from "@/store/slices/servicesSlice";
import ServiceCard from "@/app/components/home/services/ServiceCard";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import AddNewService from "@/app/components/home/services/AddNewService";

const ServicesPage = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const services = useSelector((state: RootState) => state.services.services);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/passwords");
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      dispatch(fetchServices());
    }
  }, [user?.role, dispatch]);

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="w-9/10 mx-auto">
      <h1 className="text-2xl font-bold mb-4">Services</h1>
      <p className="mb-4 text-xl">
        This is the services page. Here you can manage all the services
        integrated with PassGuard.
      </p>
      <div className="flex justify-end items-center gap-4 mb-5">
        <p className="text-lg">Add new Service</p>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="min-w-30 py-3 px-6 text-md">
              Add <PlusCircleIcon />
            </Button>
          </DialogTrigger>
          <AddNewService />
        </Dialog>
      </div>
      <ul className="list-disc pl-5">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            id={service.id}
            service={service.name}
            image_url={service.image_url}
          />
        ))}
      </ul>
    </div>
  );
};

export default ServicesPage;
