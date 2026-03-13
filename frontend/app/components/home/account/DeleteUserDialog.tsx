"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";

import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { deleteUserAccount } from "@/store/slices/userSlice";
import { toast } from "sonner";

const formSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters long"),
  confirm_delete: z.boolean().refine((val) => val === true, {
    message: "You must confirm account deletion",
  }),
});

const DeleteUserDialog = () => {
  const formData = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: {
      password: "",
      confirm_delete: false,
    },
  });
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      await dispatch(deleteUserAccount(data)).unwrap();
      router.push("/sign-in");
    } catch (error) {
      console.error("Failed to delete account:", error);
      const errorMessage =
        typeof error === "string" ? error : "Failed to delete account";
      formData.setError("password", { message: errorMessage });
      toast.error(errorMessage);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogDescription>
          This action is irreversible. Please enter your password and confirm to
          delete your account.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={formData.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Controller
            name="password"
            control={formData.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  aria-invalid={fieldState.error ? "true" : "false"}
                  {...field}
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
          <Controller
            name="confirm_delete"
            control={formData.control}
            render={({ field, fieldState }) => (
              <Field>
                <div className="flex items-center gap-4">
                  <Checkbox
                    id="confirm_delete"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex flex-col gap-1">
                    <FieldLabel
                      htmlFor="confirm_delete"
                      className="mt-0 cursor-pointer"
                    >
                      I understand this action is irreversible and want to
                      delete my account
                    </FieldLabel>
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </div>
                </div>
              </Field>
            )}
          />
        </FieldGroup>
        <Button type="submit" variant="destructive" className="w-full mt-4">
          Delete Account
        </Button>
      </form>
    </DialogContent>
  );
};

export default DeleteUserDialog;
