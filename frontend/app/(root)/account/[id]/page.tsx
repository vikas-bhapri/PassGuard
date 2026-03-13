"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter, useParams, notFound } from "next/navigation";
import UpdateUserDialog from "@/app/components/home/account/UpdateUserDialog";
import UserDetails from "@/app/components/home/account/UserDetails";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import UpdateUserPasswordDialog from "@/app/components/home/account/UpdateUserPasswordDialog";
import ResetMasterPassword from "@/app/components/home/account/ResetMasterPassword";
import DeleteUserDialog from "@/app/components/home/account/DeleteUserDialog";

export default function UserAccountPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const user = useSelector((state: any) => state.user.user);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [resetMasterPasswordOpen, setResetMasterPasswordOpen] = useState(false);

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (!user || !user.id) {
      router.push("/sign-in");
      return;
    }

    // Check if the username/ID in URL matches the logged-in user
    // The id param could be either username or user ID
    if (user.username !== id && user.id !== id) {
      notFound();
    }
  }, [user, id, router]);

  // Don't render content until authentication is checked
  if (!user || !user.id) {
    return null;
  }

  // Don't render if user doesn't match
  if (user.username !== id && user.id !== id) {
    notFound();
  }

  return (
    <div className="w-9/10 mx-auto flex flex-col sm:flex-row sm:justify-start items-center sm:items-start gap-8 min-h-screen py-10 pb-10 sm:py-10">
      <UserDetails />
      <div className="flex flex-col gap-4 w-full sm:w-fit sm:items-start sm:ml-auto mt-auto sm:mt-0 mb-10 sm:mb-0">
        <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Update Account</Button>
          </DialogTrigger>
          <UpdateUserDialog onSuccess={() => setUpdateDialogOpen(false)} />
        </Dialog>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full">Change Account Password</Button>
          </DialogTrigger>
          <UpdateUserPasswordDialog />
        </Dialog>
        <Dialog
          open={resetMasterPasswordOpen}
          onOpenChange={setResetMasterPasswordOpen}
        >
          <DialogTrigger asChild>
            <Button className="w-full">Change Master Password</Button>
          </DialogTrigger>
          <ResetMasterPassword
            onSuccess={() => setResetMasterPasswordOpen(false)}
          />
        </Dialog>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              Delete Account
            </Button>
          </DialogTrigger>
          <DeleteUserDialog />
        </Dialog>
      </div>
    </div>
  );
}
