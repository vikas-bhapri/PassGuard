"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { useSearchParams, useRouter } from "next/navigation";

import { useState, useEffect } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { toast } from "sonner";
import { resetPasswordAPI } from "@/store/api/authAPI";
import { AxiosError } from "axios";

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
  const [tokenValid, setTokenValid] = useState(true);
  const router = useRouter();

  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const formData = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  });

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      toast.error(
        "Invalid or missing reset token. Please request a new password reset.",
      );
    }
  }, [token]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!token) {
      toast.error("Invalid or missing reset token");
      return;
    }

    if (submitting) return; // Prevent double submission

    setSubmitting(true);

    try {
      await resetPasswordAPI(data, token);

      toast.success(
        "Password reset successful! Please log in with your new password.",
      );

      formData.reset();
      router.push("/sign-in");
    } catch (error) {
      console.error("Reset password error:", error);

      let errorMessage = "Failed to reset password. Please try again.";

      if (error instanceof AxiosError) {
        // Handle specific API error responses
        if (error.response?.status === 400) {
          errorMessage =
            error.response?.data?.detail ||
            "Invalid reset token or token has expired. Please request a new password reset.";
        } else if (error.response?.status === 404) {
          errorMessage =
            "Reset token not found. Please request a new password reset.";
        } else if (error.response?.status === 422) {
          errorMessage =
            error.response?.data?.detail ||
            "Invalid password format. Please check your password meets the requirements.";
        } else if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.message) {
          errorMessage = `Network error: ${error.message}`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
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
      <Button
        type="submit"
        className="w-full my-3"
        disabled={submitting || !tokenValid}
      >
        {submitting ? "Resetting password..." : "Reset Password"}
      </Button>
    </form>
  );
};

export default ResetPasswordForm;
