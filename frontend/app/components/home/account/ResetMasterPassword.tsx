"use client";

import { useState } from "react";

import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { toast } from "sonner";

import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { setVaultKey } from "@/crypto/keyStore";
import { randomBytes } from "@/utils/encoding";
import { encryptString } from "@/crypto/aesgcm";

import { useDispatch, useSelector } from "react-redux";
import { fetchPasswords, updatePassword } from "@/store/slices/passwordSlice";
import { AppDispatch, RootState } from "@/store/store";
import { deriveAndSetVaultKey, getKdfParams } from "@/store/slices/kdfSlice";
import { createMasterPasswordAPI } from "@/store/api/authAPI";
import { argon2idRawKey, importAesGcmKey } from "@/crypto/argon2id";

const formSchema = z
  .object({
    old_password: z
      .string()
      .min(8, "Old password must be at least 8 characters long"),
    new_password: z
      .string()
      .min(8, "New password must be at least 8 characters long"),
    confirm_password: z
      .string()
      .min(8, "Confirm password must be at least 8 characters long"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "New password and confirm password must match",
    path: ["confirm_password"],
  });

interface ResetMasterPasswordProps {
  onSuccess?: () => void;
}

const ResetMasterPassword = ({ onSuccess }: ResetMasterPasswordProps) => {
  const [submitting, setSubmitting] = useState(false);

  const formData = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      old_password: "",
      new_password: "",
      confirm_password: "",
    },
  });
  const dispatch = useDispatch<AppDispatch>();
  const username = useSelector((state: RootState) => state.user.user?.username);
  const kdfPayload = useSelector((state: RootState) => state.kdf.payload);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setSubmitting(true);
      toast.info("Resetting master password. This may take a moment...");

      // Fetch KDF parameters first
      if (!kdfPayload) {
        await dispatch(getKdfParams()).unwrap();
      }

      // Check if the old password is correct and derive the current vault key if not set

      await dispatch(
        deriveAndSetVaultKey({
          masterPassword: data.old_password,
          username: username!,
        }),
      ).unwrap();

      // Create new salts and derive new keys
      const newVaultKeySalt = randomBytes(16);
      const newAuthKeySalt = randomBytes(16);

      const authKey = await argon2idRawKey(data.new_password, newAuthKeySalt);
      const vaultRaw = await argon2idRawKey(data.new_password, newVaultKeySalt);
      const vaultKey = await importAesGcmKey(vaultRaw);

      const passwords = await dispatch(fetchPasswords()).unwrap();

      toast.info("Re-encrypting stored passwords with new master password...");

      await Promise.all(
        passwords.map(async (pwd) => {
          const encryptedPasswordPayload = {
            ...pwd,
            password: await encryptString(pwd.password, vaultKey),
          };

          await dispatch(
            updatePassword({
              passwordId: pwd.id,
              data: {
                service: encryptedPasswordPayload.service,
                username: encryptedPasswordPayload.username,
                ciphertext_b64u: encryptedPasswordPayload.password.cipher_b64u,
                iv_b64u: encryptedPasswordPayload.password.iv,
              },
              plaintext: {
                service: encryptedPasswordPayload.service,
                username: encryptedPasswordPayload.username,
                password: pwd.password,
              },
            }),
          );
        }),
      );

      setVaultKey(vaultKey);

      await createMasterPasswordAPI({
        authKey: authKey,
        authSalt: newAuthKeySalt,
        vaultSalt: newVaultKeySalt,
      });

      formData.reset();
      toast.success("Master password reset successfully!");

      // Close the dialog after successful reset
      onSuccess?.();
    } catch (error) {
      toast.error(
        typeof error === "string"
          ? error
          : "Failed to reset master password. Please check your old password and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Reset Master Password</DialogTitle>
        <DialogDescription>
          Enter your new master password below. This will delete all your stored
          passwords, so make sure to back them up before proceeding.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={formData.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Controller
            name="old_password"
            control={formData.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="old_password">
                  Old Master Password
                </FieldLabel>
                <Input
                  id="old_password"
                  type="password"
                  placeholder="Enter new master password"
                  aria-invalid={fieldState.error ? "true" : "false"}
                  {...field}
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
          <Controller
            name="new_password"
            control={formData.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="new_password">
                  New Master Password
                </FieldLabel>
                <Input
                  id="new_password"
                  type="password"
                  placeholder="Enter new master password"
                  aria-invalid={fieldState.error ? "true" : "false"}
                  {...field}
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
          <Controller
            name="confirm_password"
            control={formData.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="confirm_password">
                  Confirm New Master Password
                </FieldLabel>
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder="Confirm new master password"
                  aria-invalid={fieldState.error ? "true" : "false"}
                  {...field}
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
        </FieldGroup>
        <Button type="submit" className="mt-5 w-full" disabled={submitting}>
          {submitting ? "Resetting..." : "Reset Master Password"}
        </Button>
      </form>
    </DialogContent>
  );
};

export default ResetMasterPassword;
