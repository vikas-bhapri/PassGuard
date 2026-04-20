"use client";

import { useState } from "react";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useForm, Controller } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { toast } from "sonner";
import { requestPasswordResetAPI } from "@/store/api/authAPI";
import { AxiosError } from "axios";

const formSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

const ForgotPasswordForm = () => {
  const [submitting, setSubmitting] = useState(false);

  const formData = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (submitting) return; // Prevent double submission

    setSubmitting(true);

    try {
      // Always show success message for security (don't reveal if email exists)
      toast.success(
        "If an account with that email exists, you will receive password reset instructions shortly.",
      );
      requestPasswordResetAPI(data.email);

      formData.reset();
    } catch (error) {
      console.error("Password reset request error:", error);

      let errorMessage = "Failed to send reset email. Please try again later.";

      if (error instanceof AxiosError) {
        // Handle specific API error responses
        if (error.response?.status === 429) {
          errorMessage =
            "Too many requests. Please wait a few minutes before trying again.";
        } else if (error.response?.status === 422) {
          errorMessage =
            "Invalid email format. Please check your email address.";
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
      <FieldGroup>
        <Controller
          name="email"
          control={formData.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                placeholder="Enter your email"
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

export default ForgotPasswordForm;
