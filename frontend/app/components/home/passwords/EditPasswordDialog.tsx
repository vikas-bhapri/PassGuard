"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldContent,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { toast } from "sonner";

import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { encryptString } from "@/crypto/aesgcm";
import { getVaultKey } from "@/crypto/keyStore";
import { updatePassword } from "@/store/slices/passwordSlice";

const formSchema = z.object({
  username: z.string().min(1, "Username is required"),
  service: z.string().min(1, "Service is required"),
  password: z.string().min(1, "Password is required"),
});

export const EditPasswordDialog = ({
  username,
  service,
  password,
  pwdId,
  onSuccess,
}: {
  username: string;
  service: string;
  password: string;
  pwdId: string;
  onSuccess: () => void;
}) => {
  const formData = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username,
      service,
      password,
    },
  });

  const dispatch = useDispatch<AppDispatch>();
  const vaultKey = getVaultKey();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setSubmitting(true);
      if (!vaultKey) {
        throw new Error("Vault key is not found!");
      }
      const encryptedPassword = await encryptString(data.password, vaultKey);
      const payload = {
        service: data.service,
        username: data.username,
        ciphertext_b64u: encryptedPassword.cipher_b64u,
        iv_b64u: encryptedPassword.iv,
      };

      await dispatch(
        updatePassword({
          passwordId: pwdId,
          data: payload,
          plaintext: {
            service: data.service,
            username: data.username,
            password: data.password,
          },
        }),
      ).unwrap();

      toast.success("Successfully saved changes!");

      onSuccess?.();
    } catch (error) {
      console.error("Failed to encrypt password:", error);
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Password</DialogTitle>
      </DialogHeader>
      <form onSubmit={formData.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Controller
            name="service"
            control={formData.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Service</FieldLabel>
                <FieldContent>
                  <Input {...field} placeholder="Enter the service" />
                </FieldContent>
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
          <Controller
            name="username"
            control={formData.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Username</FieldLabel>
                <FieldContent>
                  <Input {...field} placeholder="Enter the username" />
                </FieldContent>
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
          <Controller
            name="password"
            control={formData.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Password</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    placeholder="Enter the password"
                    type="password"
                  />
                </FieldContent>
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </FieldGroup>
      </form>
    </DialogContent>
  );
};
