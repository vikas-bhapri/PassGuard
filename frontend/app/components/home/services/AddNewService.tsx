"use client";

import { Input } from "@/components/ui/input";
import Dropzone from "../Dropzone";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AppDispatch } from "@/store/store";
import { useDispatch } from "react-redux";
import { addService } from "@/store/slices/servicesSlice";

const AddNewService = () => {
  const [file, setFile] = useState<File | null>(null);
  const [serviceName, setServiceName] = useState("");
  const dispatch = useDispatch<AppDispatch>();

  const handleAddService = async () => {
    await dispatch(addService({ name: serviceName, file })).unwrap();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add New Service</DialogTitle>
        <DialogDescription>
          Enter a service name and optionally upload an icon.
        </DialogDescription>
      </DialogHeader>
      <Input
        placeholder="Service Name"
        value={serviceName}
        onChange={(e) => setServiceName(e.target.value)}
      />
      <p className="text-sm text-muted-foreground">
        Supported formats: JPG, PNG. Max size: 5MB.
      </p>
      <Dropzone onFileSelected={setFile} />
      <Button
        disabled={!file || !serviceName}
        className="w-full"
        onClick={handleAddService}
      >
        Add Service
      </Button>
    </DialogContent>
  );
};

export default AddNewService;
