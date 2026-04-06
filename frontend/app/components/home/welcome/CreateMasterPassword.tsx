"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { randomBytes, bufferToBase64Url } from "@/utils/encoding";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

import { setVaultKey } from "@/crypto/keyStore";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { getUserProfile } from "@/store/slices/userSlice";
import { argon2idRawKey, importAesGcmKey } from "@/crypto/argon2id";
import { getSodium } from "@/crypto/sodium";

const CreateMasterPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const handleFirstClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (password.length < 8) {
      e.preventDefault();
      toast.error("Master password must be at least 8 characters long.");
      return;
    }
  };

  const handleCreateMasterPassword = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (confirmPassword !== password) {
      e.preventDefault();
      toast.error("Passwords do not match. Please try again.");
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    const loadingToast = toast.loading("Creating your master password...");

    try {
      // Load initialized sodium instance
      const sodium = await getSodium();

      const authSalt = randomBytes(16);
      const vaultSalt = randomBytes(16);

      // Use INTERACTIVE limits for better client-side performance
      // Still secure but much faster than MODERATE/SENSITIVE
      const authOps = sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE;
      const vaultOps = sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE;

      const authMem = sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE;
      const vaultMem = sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE;

      // Allow UI to update before heavy computation
      await new Promise((resolve) => setTimeout(resolve, 0));

      const authKey = await argon2idRawKey(
        password,
        authSalt,
        authOps,
        authMem,
      );
      const vaultRaw = await argon2idRawKey(
        password,
        vaultSalt,
        vaultOps,
        vaultMem,
      );
      const vaultKey = await importAesGcmKey(vaultRaw);

      const response = await fetch(
        "http://localhost:8000/api/v1/auth/master_password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            auth_algo: "Argon2id-13",
            auth_ops_limit: authOps,
            auth_mem_limit_kib: authMem,
            auth_salt_b64u: bufferToBase64Url(authSalt),
            auth_verifier_b64u: bufferToBase64Url(authKey),
            vault_kdf: {
              algo: "Argon2id-13",
              ops_limit: vaultOps,
              mem_limit_kib: vaultMem,
              salt_b64u: bufferToBase64Url(vaultSalt),
            },
          }),
          credentials: "include",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(
          result.detail ||
            "Failed to create master password. Please try again.",
          { id: loadingToast },
        );
        return;
      }

      setVaultKey(vaultKey);
      await dispatch(getUserProfile()).unwrap();

      toast.success("Master password created successfully!", {
        id: loadingToast,
      });
      setPassword("");
      setConfirmPassword("");
      router.push("/passwords");
    } catch (error) {
      console.error("Error creating master password:", error);
      toast.error("An unexpected error occurred. Please try again.", {
        id: loadingToast,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-2xl mt-8 font-semibold mb-4 text-center">
        Create Your Master Password
      </h2>
      <div className="flex gap-3 justify-center items-center">
        <Input
          name="password"
          type="password"
          placeholder="Enter your master password"
          className="max-w-80 min-w-20"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              onClick={(e) => handleFirstClick(e)}
            >
              Create
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Master Password</DialogTitle>
              <DialogDescription>
                Please confirm your master password.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-center items-center">
              <Input
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                className="max-w-80 min-w-20"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={(e) => {
                  handleCreateMasterPassword(e);
                }}
              >
                {isLoading ? "Creating..." : "Confirm"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default CreateMasterPassword;
