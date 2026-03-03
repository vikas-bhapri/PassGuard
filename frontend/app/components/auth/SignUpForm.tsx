"use client";

import { useState } from "react";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { toast } from "sonner";

import { randomBytes, bufferToBase64Url } from "@/utils/encoding";
import { deriveAuthKey, deriveVaultKey } from "@/crypto/kdf";

const formSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters long"),
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z
      .string()
      .min(8, "Confirm Password must be at least 8 characters long"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .strict();

const SignUpForm = () => {
  type errors = {
    detail?: string;
  };
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<errors>({});
  const router = useRouter();

  const formData = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log(data);
    try {
      setSubmitting(true);
      // Generate salts for KDF
      const authSalt = randomBytes(16);
      const vaultSalt = randomBytes(16);

      // Derive keys for client-side encryption
      const authKey = await deriveAuthKey(data.password, authSalt, 400_000);
      const vaultKey = await deriveVaultKey(data.password, vaultSalt, 400_000);

      const response = await fetch("http://localhost:8000/api/v1/auth/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          auth_algo: "PDKDF2-SHA256",
          auth_iterations: 400000,
          auth_salt_b64u: bufferToBase64Url(authSalt),
          auth_verifier_b64u: bufferToBase64Url(authKey),
          vault_kdf: {
            algo: "PBKDF2-SHA256",
            iterations: 400000,
            salt_b64u: bufferToBase64Url(vaultSalt),
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrors({ detail: result.detail || "Sign up failed" });
        throw new Error(result.detail || "Sign up failed");
      }

      formData.reset();

      toast.success("Signed up successfully! Redirecting...");
      router.push("/sign-in");
    } catch (error) {
      console.log("Error during sign up:", error);
      toast.error((error as Error).message || "Failed to sign up");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="w-sm" onSubmit={formData.handleSubmit(onSubmit)}>
      <FieldGroup className="mb-5 gap-3">
        <Controller
          name="username"
          control={formData.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <Input
                id="username"
                {...field}
                placeholder="Enter a username"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="email"
          control={formData.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                {...field}
                placeholder="Enter your email"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
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
                {...field}
                placeholder="Enter a password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="confirmPassword"
          control={formData.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="confirmPassword">
                Confirm Password
              </FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                {...field}
                placeholder="Confirm your password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <Button type="submit" className="w-full " disabled={submitting}>
        {submitting ? "Signing Up..." : "Sign Up"}
      </Button>
    </form>
  );
};

export default SignUpForm;
