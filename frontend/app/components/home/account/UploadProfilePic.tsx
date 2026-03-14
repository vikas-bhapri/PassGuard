"use client";

import { useCallback, useRef, useState, DragEvent, ChangeEvent } from "react";
import Image from "next/image";
import { CloudUpload, X, ImageIcon } from "lucide-react";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getSasTokenAPI, uploadFileAPI } from "@/store/api/storageAPI";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { updateUserProfile } from "@/store/slices/userSlice";

const ACCEPTED_TYPES = ["image/jpeg", "image/png"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const UploadProfilePic = () => {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch<AppDispatch>();

  const validate = (f: File): string | null => {
    if (!ACCEPTED_TYPES.includes(f.type))
      return "Only JPG and PNG files are allowed.";
    if (f.size > MAX_SIZE) return "File size must be under 5 MB.";
    return null;
  };

  const handleFile = useCallback((f: File) => {
    const err = validate(f);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile],
  );

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) handleFile(selected);
    },
    [handleFile],
  );

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFileSubmit = async () => {
    if (!file) return;
    const sasResponse = await getSasTokenAPI({
      content_type: file.type,
      content_length: file.size,
    });
    const { sas_url } = sasResponse;
    await uploadFileAPI(sas_url, file);

    clearFile();

    await dispatch(
      updateUserProfile({ image_url: sas_url.split("?")[0] }),
    ).unwrap();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Upload Profile Picture</DialogTitle>
        <DialogDescription>
          Choose a file to upload as your profile picture. <br />
          Supported formats: JPG, PNG. Max size: 5MB.
        </DialogDescription>
      </DialogHeader>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={`
          relative flex flex-col items-center justify-center gap-3
          w-full rounded-lg border-2 border-dashed p-6
          cursor-pointer transition-colors
          ${
            dragging
              ? "border-blue-500 bg-blue-500/10"
              : "border-muted-foreground/30 hover:border-blue-400 hover:bg-accent/40"
          }
        `}
      >
        {preview ? (
          <div className="relative">
            <Image
              src={preview}
              alt="Preview"
              width={224}
              height={224}
              className="max-h-48 rounded-md object-contain sm:max-h-56"
              unoptimized
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="absolute cursor-pointer -top-2 -right-2 rounded-full bg-destructive p-1 text-white hover:bg-destructive/80"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <>
            <CloudUpload className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              <span className="font-medium text-blue-500">Click to upload</span>{" "}
              or drag and drop
            </p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      {file && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ImageIcon className="size-3.5 shrink-0" />
          <span className="truncate">{file.name}</span>
          <span className="ml-auto shrink-0">
            {(file.size / 1024).toFixed(1)} KB
          </span>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button disabled={!file} className="w-full" onClick={handleFileSubmit}>
        Upload
      </Button>
    </DialogContent>
  );
};

export default UploadProfilePic;
