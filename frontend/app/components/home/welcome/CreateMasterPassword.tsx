"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { randomBytes, bufferToBase64Url } from "@/utils/encoding";
import { deriveAuthKey, deriveVaultKey } from "@/crypto/kdf";

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

const CreateMasterPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    const authSalt = randomBytes(16);
    const vaultSalt = randomBytes(16);

    const authKey = await deriveAuthKey(password, authSalt, 125000);
    const vaultKey = await deriveVaultKey(password, vaultSalt, 125000);

    const response = await fetch(
      "http://localhost:8000/api/v1/auth/master_password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_algo: "PBKDF2-SHA256",
          auth_iterations: 125000,
          auth_salt_b64u: bufferToBase64Url(authSalt),
          auth_verifier_b64u: bufferToBase64Url(authKey),
          vault_kdf: {
            algo: "PBKDF2-SHA256",
            iterations: 125000,
            salt_b64u: bufferToBase64Url(vaultSalt),
          },
        }),
        credentials: "include",
      },
    );

    const result = await response.json();

    if (!response.ok) {
      toast.error(
        result.detail || "Failed to create master password. Please try again.",
      );
      return;
    }

    setVaultKey(vaultKey);
    await dispatch(getUserProfile()).unwrap();

    toast.success("Master password created successfully!");
    setPassword("");
    setConfirmPassword("");
    router.push("/passwords");
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
                Confirm
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default CreateMasterPassword;
