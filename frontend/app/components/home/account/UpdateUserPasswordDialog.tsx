"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useForm, Controller } from "react-hook-form";
import { useState } from "react";

import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

import { AxiosError } from "axios";
import { updateUserPasswordAPI } from "@/store/api/authAPI";

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
    path: ["confirm_password"], // This will attach the error to the confirm_password field
  });

const UpdateUserPasswordDialog = () => {
  const [submitting, setSubmitting] = useState(false);
  const formData = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      old_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (submitting) return; // Prevent double submission

    try {
      setSubmitting(true);
      toast.info("Updating password...");
      await updateUserPasswordAPI(data);
      toast.success("Password updated successfully!");
      formData.reset();
    } catch (error) {
      console.error("Failed to update password:", error);
      let errorMessage = "Failed to update password";
      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.detail || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setSubmitting(false); // Ensure loading state is reset
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Update Password</DialogTitle>
        <DialogDescription>
          Update your account password below.
        </DialogDescription>
        <form onSubmit={formData.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="old_password"
              control={formData.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="old_password">Old Password</FieldLabel>
                  <Input
                    id="old_password"
                    type="password"
                    placeholder="Enter your old password"
                    aria-invalid={fieldState?.invalid}
                    {...field}
                  />
                  <FieldError>{fieldState?.error?.message}</FieldError>
                </Field>
              )}
            />
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
                    aria-invalid={fieldState?.invalid}
                    {...field}
                  />
                  <FieldError>{fieldState?.error?.message}</FieldError>
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
                    aria-invalid={fieldState?.invalid}
                    {...field}
                  />
                  <FieldError>{fieldState?.error?.message}</FieldError>
                </Field>
              )}
            />
          </FieldGroup>
          <DialogClose asChild>
            <Button type="submit" className="w-full my-5">
              Save Changes
            </Button>
          </DialogClose>
        </form>
      </DialogHeader>
    </DialogContent>
  );
};

export default UpdateUserPasswordDialog;
