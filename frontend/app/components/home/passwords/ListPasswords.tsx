"use client";

import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import AddPasswordDialog from "./AddPasswordDialog";

import { Input } from "@/components/ui/input";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getKdfParams, deriveAndSetVaultKey } from "@/store/slices/kdfSlice";
import { AppDispatch, RootState } from "@/store/store";
import { Button } from "@/components/ui/button";

const ListPasswords = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterPassword, setMasterPassword] = useState("");
  const kdfParams = useSelector((state: RootState) => state.kdf);

  useEffect(() => {
    dispatch(getKdfParams());
  }, [dispatch]);

  const unlockVault = async (masterPassword: string) => {
    console.log("Unlocking vault with master password:", masterPassword);
    await dispatch(deriveAndSetVaultKey(masterPassword)).unwrap();
    setIsUnlocked(true);
    console.log("Vault unlocked successfully", kdfParams);
  };

  return (
    <div>
      {!isUnlocked ? (
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
              className="w-[300px] min-w-[250px]"
            />
            <Button
              className="w-[150px] min-w-[100px]"
              onClick={() => unlockVault(masterPassword)}
            >
              Unlock Vault
            </Button>
          </div>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-semibold mb-4">Your Passwords</h1>
          <div className="flex items-center justify-end gap-5 mb-4">
            <h1 className="text-lg">Add new password here</h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">Add New Password</Button>
              </DialogTrigger>
              <AddPasswordDialog />
            </Dialog>
          </div>
          <table className="w-full">
            <thead className="text-lg text-center font-semibold">
              <tr>
                <td className="p-2 border">Service</td>
                <td className="p-2 border">Username</td>
                <td className="p-2 border">Password</td>
                <td className="p-2 border">Actions</td>
              </tr>
            </thead>
          </table>
        </>
      )}
    </div>
  );
};

export default ListPasswords;
