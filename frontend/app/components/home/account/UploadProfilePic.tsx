"use client";

import { useState } from "react";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getProfileSasTokenAPI, uploadFileAPI } from "@/store/api/storageAPI";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { getProfilePicture, updateUserProfile } from "@/store/slices/userSlice";
import Dropzone from "../Dropzone";

const UploadProfilePic = () => {
  const [file, setFile] = useState<File | null>(null);
  const dispatch = useDispatch<AppDispatch>();

  const handleFileSubmit = async () => {
    if (!file) return;
    const sasResponse = await getProfileSasTokenAPI({
      content_type: file.type,
      content_length: file.size,
    });
    const { sas_url } = sasResponse;
    await uploadFileAPI(sas_url, file);

    setFile(null);

    await dispatch(
      updateUserProfile({ image_url: sas_url.split("?")[0] }),
    ).unwrap();

    await dispatch(getProfilePicture()).unwrap();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Upload Image</DialogTitle>
        <DialogDescription>
          Supported formats: JPG, PNG. Max size: 5MB.
        </DialogDescription>
      </DialogHeader>

      <Dropzone onFileSelected={setFile} />

      <Button disabled={!file} className="w-full" onClick={handleFileSubmit}>
        Upload
      </Button>
    </DialogContent>
  );
};

export default UploadProfilePic;
