"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { deleteService } from "@/store/slices/servicesSlice";
import { AppDispatch } from "@/store/store";

const ServiceCard = ({
  service,
  image_url,
  id,
}: {
  service: string;
  image_url: string;
  id: string;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const handleDelete = async () => {
    try {
      await dispatch(deleteService(id)).unwrap();
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  return (
    <div className="border rounded-xl p-4 mb-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <h2 className="text-2xl font-semibold truncate">{service}</h2>
        <Image
          src={image_url}
          width={50}
          height={50}
          alt={`${service} logo`}
          className="w-10 h-10 object-contain"
        />
        <div className="flex items-center justify-start lg:justify-end gap-2 flex-wrap">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" className="min-w-fit">
                <Trash2 className="shrink-0" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete {service}</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this service?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant={"destructive"} onClick={handleDelete}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
