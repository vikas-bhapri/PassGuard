"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useForm, Controller } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldError,
} from "@/components/ui/field";
import { toast } from "sonner";
import Link from "next/link";

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

const SignInForm = () => {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ detail?: string }>({});
  const router = useRouter();

  const formData = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setSubmitting(true);
      toast.promise(
        (async () => {
          const response = await fetch(
            "http://localhost:8000/api/v1/auth/login",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              credentials: "include",
              body: new URLSearchParams(data as Record<string, string>),
            },
          );

          const result = await response.json();

          if (response.status === 401 || response.status === 400) {
            setErrors(result);
            throw new Error(result.detail || "Invalid credentials");
          }

          router.push("/home");
        })(),
        {
          loading: "Attempting to sign in...",
          success: "Signed in successfully! Redirecting...",
          error: (err) => err.message || "Failed to sign in",
        },
      );
    } catch (error) {
      console.log(error);
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
                aria-invalid={fieldState.invalid}
                placeholder="Enter your user name"
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
                aria-invalid={fieldState.invalid}
                placeholder="Enter your password"
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Link className="text-blue-500 self-end" href={"/forgot-password"}>
          Forgot Password?
        </Link>
      </FieldGroup>
      <Button type="submit" className="w-full " disabled={submitting}>
        {submitting ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  );
};

export default SignInForm;
