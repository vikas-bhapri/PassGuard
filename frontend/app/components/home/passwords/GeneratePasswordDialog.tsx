import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { useState, useEffect, useCallback } from "react";

import { RefreshCcw } from "lucide-react";

const CHARSET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$^*-_";

function generatePassword(length = 20): string {
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (n) => CHARSET[n % CHARSET.length]).join("");
}

const GeneratePasswordDialog = () => {
  const [randomPassword, setRandomPassword] = useState("");

  const regenerate = useCallback(() => {
    setRandomPassword(generatePassword());
  }, []);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Generate Password</DialogTitle>
        <DialogDescription>
          Use this dialog to generate a new complex and secure password.
        </DialogDescription>
      </DialogHeader>
      <div className="flex gap-2">
        <Input
          value={randomPassword}
          readOnly
          placeholder="Generated password will appear here"
        />
        <Button variant="outline" onClick={regenerate}>
          <RefreshCcw />
        </Button>
      </div>
      <Button
        onClick={() => {
          navigator.clipboard.writeText(randomPassword);
          toast.success("Password copied to clipboard!");
        }}
      >
        Copy to clipboard
      </Button>
    </DialogContent>
  );
};

export default GeneratePasswordDialog;
