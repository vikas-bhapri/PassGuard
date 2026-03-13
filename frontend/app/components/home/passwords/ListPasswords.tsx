"use client";

import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import AddPasswordDialog from "./AddPasswordDialog";

import { Input } from "@/components/ui/input";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getKdfParams,
  deriveAndSetVaultKey,
  clearVaultKey,
} from "@/store/slices/kdfSlice";
import { fetchPasswords } from "@/store/slices/passwordSlice";

import { AppDispatch, RootState } from "@/store/store";
import { Button } from "@/components/ui/button";

import { useRouter } from "next/navigation";

import {
  clearVaultKey as clearStoredVaultKey,
  hasVaultKey,
} from "@/crypto/keyStore";
import { toast } from "sonner";
import PasswordCard from "./PasswordCard";

const ListPasswords = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [masterPassword, setMasterPassword] = useState("");
  const passwords = useSelector(
    (state: RootState) => state.passwords.passwords,
  );
  const username = useSelector((state: RootState) => state.user.user?.username);
  const new_user = useSelector((state: RootState) => state.user.user?.new_user);

  const router = useRouter();

  useEffect(() => {
    if (new_user) {
      router.push("/welcome");
    }
    dispatch(getKdfParams());
  }, [dispatch, new_user, router]);

  const handleLockVault = () => {
    clearStoredVaultKey();
    dispatch(clearVaultKey());
    setIsLocked(true);
    setIsLoading(false);
  };

  const unlockVault = async (masterPassword: string) => {
    setIsLoading(true);
    try {
      if (!username) {
        toast.error("User not found. Please log in again.");
        return;
      }

      await dispatch(
        deriveAndSetVaultKey({ masterPassword, username }),
      ).unwrap();

      await dispatch(fetchPasswords()).unwrap();

      toast.success("Vault unlocked successfully!");

      setMasterPassword("");
      setIsLocked(false);
    } catch (error) {
      console.log("Error unlocking vault:", error);
      const errorMessage =
        typeof error === "string"
          ? error
          : "Failed to unlock vault. Please check your master password and try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-9/10 mx-auto">
      {isLocked || !hasVaultKey() ? (
        <div className="p-4 bg-secondary rounded-md border w-[80%] mx-auto my-10">
          <h2 className="text-lg font-semibold mb-2">Unlock Your Vault</h2>
          <p className="mb-4">
            Please enter your master password to access your passwords.
          </p>
          <div className="flex flex-wrap items-center justify-start gap-3 container">
            <Input
              type="password"
              placeholder="Enter your master password"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              className="w-75 min-w-62.5"
            />
            <Button
              className="w-37.5 min-w-25"
              onClick={() => unlockVault(masterPassword)}
              variant="default"
              disabled={isLoading || masterPassword.trim() === ""}
            >
              {isLoading ? "Unlocking..." : "Unlock Vault"}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-semibold mb-4">Your Passwords</h1>
          <div className="flex items-center justify-end gap-5 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <h1>Lock your vault here</h1>
              <Button onClick={handleLockVault} variant="secondary">
                Lock Vault
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg">Add new password here</h1>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary">Add New Password</Button>
                </DialogTrigger>
                <AddPasswordDialog />
              </Dialog>
            </div>
          </div>

          {passwords.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No passwords stored yet. Add your first password!
            </div>
          ) : (
            passwords.map((pwd) => (
              <PasswordCard
                password={pwd.password}
                service={pwd.service}
                username={pwd.username}
                key={pwd.id}
                id={pwd.id}
              />
            ))
          )}
        </>
      )}
    </div>
  );
};

export default ListPasswords;
