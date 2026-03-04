"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldError,
} from "@/components/ui/field";
import { toast } from "sonner";

import { useForm, Controller } from "react-hook-form";

import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { encryptString } from "@/crypto/aesgcm";
import { getVaultKey } from "@/crypto/keyStore";

const formSchema = z.object({
  service: z.string().min(1, "Service name is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

const AddPasswordDialog = () => {
  const kdfParams = useSelector((state: RootState) => state.kdf);
  const vaultKey = getVaultKey();

  const formData = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      service: "",
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const passwordPlainText = data.password;

    if (!vaultKey) {
      throw new Error("Vault key is not available. Cannot encrypt password.");
    }

    const { iv, cipher_b64u } = await encryptString(
      passwordPlainText,
      vaultKey,
    );

    const response = await fetch("http://localhost:8000/api/v1/passwords/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payload: {
          service: data.service,
          username: data.username,
          ciphertext_b64u: cipher_b64u,
          iv_b64u: iv,
        },
        kdf: {
          algo: kdfParams.payload?.algo,
          iterations: kdfParams.payload?.iterations,
          salt_b64u: kdfParams.payload?.salt_b64u,
        },
      }),
      credentials: "include",
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Failed to add password:", result);
      toast.error(result.detail || "Failed to add password");
      throw new Error(result.detail || "Failed to add password");
    }

    toast.success("Password added successfully!");
    formData.reset();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add New Password</DialogTitle>
      </DialogHeader>
      <form onSubmit={formData.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Controller
            name="service"
            control={formData.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="service">Service Name</FieldLabel>
                <Input
                  id="service"
                  aria-invalid={fieldState.invalid}
                  placeholder="e.g. Gmail"
                  {...field}
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
          <Controller
            name="username"
            control={formData.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  aria-invalid={fieldState.invalid}
                  placeholder="e.g. user@example.com"
                  {...field}
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
          <Controller
            name="password"
            control={formData.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter your password"
                  {...field}
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
        </FieldGroup>

        <div className="flex justify-end items-center">
          <Button type="submit" className="mt-4" variant="default">
            Add Password
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};

export default AddPasswordDialog;
