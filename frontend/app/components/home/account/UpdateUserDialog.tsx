"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useForm, Controller } from "react-hook-form";
import { useState } from "react";
import { useDispatch } from "react-redux";

import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { updateUserProfile } from "@/store/slices/userSlice";
import { AppDispatch } from "@/store/store";

const formSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

type UpdateUserDialogProps = {
  onSuccess?: () => void;
};

const UpdateUserDialog = ({ onSuccess }: UpdateUserDialogProps) => {
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const formData = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (submitting) return; // Prevent double submission

    if (data.first_name === "" && data.last_name === "") {
      toast.error("Please provide at least one field to update");
      return;
    }

    try {
      setSubmitting(true);
      toast.info("Updating account...");
      await dispatch(updateUserProfile(data)).unwrap();
      toast.success("Account updated successfully!");
      formData.reset();
      onSuccess?.(); // Close dialog on success
    } catch (error) {
      console.error("Failed to update account:", error);
      let errorMessage = "Failed to update account";
      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.detail || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else errorMessage = error.detail;
      toast.error(errorMessage);
    } finally {
      setSubmitting(false); // Ensure loading state is reset
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Update Account Information</DialogTitle>
        <DialogDescription>
          Update your account information below.
        </DialogDescription>
        <form onSubmit={formData.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="first_name"
              control={formData.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="first_name">First Name</FieldLabel>
                  <Input
                    id="first_name"
                    placeholder="Enter your first name"
                    aria-invalid={fieldState?.invalid}
                    {...field}
                  />
                  <FieldError>{fieldState?.error?.message}</FieldError>
                </Field>
              )}
            />
            <Controller
              name="last_name"
              control={formData.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="last_name">Last Name</FieldLabel>
                  <Input
                    id="last_name"
                    placeholder="Enter your last name"
                    aria-invalid={fieldState?.invalid}
                    {...field}
                  />
                  <FieldError>{fieldState?.error?.message}</FieldError>
                </Field>
              )}
            />
          </FieldGroup>

          <Button type="submit" className="w-full my-5">
            Update
          </Button>
        </form>
      </DialogHeader>
    </DialogContent>
  );
};

export default UpdateUserDialog;
