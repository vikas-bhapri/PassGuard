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

const formSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

const ForgotPasswordForm = () => {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ detail?: string }>({});

  const formData = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    // TODO: Implement forgot password functionality
    try {
      toast.info(
        "If an account with that email exists, you will receive password reset instructions shortly.",
      );
      const response = await fetch(
        `http://localhost:8000/api/v1/auth/password_reset_request?email=${data.email}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        setErrors(result);
        toast.error(result.detail || "Something went wrong");
        throw new Error(result.detail || "Something went wrong");
      }
    } catch (error) {
      console.log(error);
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
