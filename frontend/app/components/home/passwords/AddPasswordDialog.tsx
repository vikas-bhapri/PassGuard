"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  DialogContent,
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
import { AxiosError } from "axios";

import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { addPassword } from "@/store/slices/passwordSlice";
import { useState } from "react";

const formSchema = z.object({
  service: z.string().min(1, "Service name is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

const AddPasswordDialog = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [submitting, setSubmitting] = useState(false);

  const formData = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      service: "",
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setSubmitting(true);

    try {
      const result = await dispatch(addPassword(data)).unwrap();

      toast.success("Password added successfully!");
      formData.reset();
    } catch (error) {
      console.error("Failed to add password:", error);
      let errorMessage = "Failed to add password";
      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.detail || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      throw error;
    } finally {
      setSubmitting(false);
    }
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
          <Button
            type="submit"
            className="mt-4 min-w-40"
            variant="default"
            disabled={submitting}
          >
            {submitting ? "Adding..." : "Add Password"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};

export default AddPasswordDialog;
