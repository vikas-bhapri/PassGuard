"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { toast } from "sonner";
import { bufferToBase64Url, randomBytes } from "@/utils/encoding";
import { deriveAuthKey, deriveVaultKey } from "@/crypto/kdf";

const formSchema = z
  .object({
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters long"),
    confirm_password: z
      .string()
      .min(8, "Confirm Password must be at least 8 characters long"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

const ResetPasswordForm = () => {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ detail?: string }>({});
  const router = useRouter();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const formData = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    // TODO: Implement reset password functionality
    try {
      setSubmitting(true);
      toast.promise(
        (async () => {

          const authSalt = randomBytes(16);
          const vaultSalt = randomBytes(16);

          // Derive auth key and vault key on the client side
          const authKey = await deriveAuthKey(data.new_password, authSalt, 125000);
          const vaultKey = await deriveVaultKey(data.new_password, vaultSalt, 125000);

          const response = await fetch(
            `http://localhost:8000/api/v1/auth/reset_password?reset_token=${token}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                auth_salt_b64u: bufferToBase64Url(authSalt),
                auth_verifier_b64u: bufferToBase64Url(authKey),
                vault_salt_b64u: bufferToBase64Url(vaultSalt),
              }),
            },
          );

          const result = await response.json();

          if (!response.ok) {
            setErrors(result.detail);
            throw new Error(result.detail || "Failed to reset password");
          }

          router.push("/sign-in");
        })(),
        {
          loading: "Resetting password...",
          success:
            "Password reset successfully! Redirecting to sign in page...",
          error: (err) => err.message || "Failed to reset password",
        },
      );
    } catch (error) {
      console.log(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="w-sm mt-6" onSubmit={formData.handleSubmit(onSubmit)}>
      <FieldGroup className="gap-3">
        <Controller
          name="new_password"
          control={formData.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="new_password">New Password</FieldLabel>
              <Input
                id="new_password"
                type="password"
                placeholder="Enter your new password"
                {...field}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="confirm_password"
          control={formData.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="confirm_password">
                Confirm Password
              </FieldLabel>
              <Input
                id="confirm_password"
                type="password"
                placeholder="Confirm your new password"
                {...field}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <Button type="submit" className="w-full my-3" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
};

export default ResetPasswordForm;
