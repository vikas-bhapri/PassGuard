import { Button } from "@/components/ui/button";
import { EyeIcon, CopyIcon, Trash2, PencilIcon, EyeClosed } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { deletePassword } from "@/store/slices/passwordSlice";
import { AppDispatch } from "@/store/store";
import { useDispatch } from "react-redux";

import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { EditPasswordDialog } from "./EditPasswordDialog";

const PasswordCard = ({
  username,
  service,
  password,
  id,
}: {
  username: string;
  service: string;
  password: string;
  id: string;
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [editPasswordOpen, setEditPasswordOpen] = useState(false);

  const toggleReveal = () => {
    setIsRevealed((prev) => !prev);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password).then(
      () => {
        toast.success("Password copied to clipboard!");
      },
      () => {
        toast.error("Failed to copy password to clipboard.");
      },
    );
  };

  const dispatch = useDispatch<AppDispatch>();

  const handleDelete = async () => {
    toast.promise(
      (async () => {
        await dispatch(deletePassword(id)).unwrap();
      })(),
      {
        loading: "Deleting password...",
        success: "Password deleted successfully!",
        error: "Failed to delete password. Please try again.",
      },
    );
  };

  return (
    <div className="border rounded-xl p-4 mb-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <h2 className="text-2xl font-semibold truncate">{service}</h2>
        <p className="text-lg truncate">{username}</p>
        <p
          className="text-lg lg:col-span-2 cursor-pointer break-all"
          onClick={toggleReveal}
        >
          {isRevealed ? (
            <span className="inline-flex items-center gap-2">
              <EyeIcon className="shrink-0" /> {password}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <EyeClosed className="shrink-0" /> Click to reveal password
            </span>
          )}
        </p>
        <div className="flex items-center justify-start lg:justify-end gap-2 flex-wrap">
          <Button onClick={copyToClipboard} className="min-w-fit">
            <CopyIcon className="shrink-0" />
          </Button>
          <Button
            variant="destructive"
            className="min-w-fit"
            onClick={handleDelete}
          >
            <Trash2 className="shrink-0" />
          </Button>
          <Dialog open={editPasswordOpen} onOpenChange={setEditPasswordOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="min-w-fit">
                <PencilIcon className="shrink-0" />
              </Button>
            </DialogTrigger>
            <EditPasswordDialog
              password={password}
              service={service}
              username={username}
              pwdId={id}
              onSuccess={() => setEditPasswordOpen(false)}
            />
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default PasswordCard;
