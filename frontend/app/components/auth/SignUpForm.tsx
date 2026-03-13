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

import { signUpUser } from "@/store/slices/userSlice";
import { AppDispatch } from "@/store/store";
import { useDispatch } from "react-redux";

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
  });

const SignUpForm = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [submitting, setSubmitting] = useState(false);
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
    if (submitting) return; // Prevent double submission

    setSubmitting(true);

    try {
      await dispatch(
        signUpUser({
          username: data.username,
          email: data.email,
          password: data.password,
          confirm_password: data.confirmPassword,
        }),
      ).unwrap();

      toast.success("Signed up successfully! Redirecting to sign in...");
      formData.reset();
      router.push("/sign-in");
    } catch (error) {
      console.error("Sign up error:", error);

      let errorMessage = "Failed to sign up. Please try again.";

      if (typeof error === "object" && error !== null) {
        if ("detail" in error) {
          errorMessage = String((error as { detail?: string }).detail);
        } else if ("message" in error) {
          errorMessage = String((error as { message?: string }).message);
        }
      }

      // Handle specific common errors
      if (errorMessage.toLowerCase().includes("username")) {
        errorMessage =
          "Username already exists. Please choose a different username.";
      } else if (errorMessage.toLowerCase().includes("email")) {
        errorMessage =
          "Email already registered. Please use a different email or sign in.";
      }

      toast.error(errorMessage);
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
