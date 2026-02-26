"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm, Controller } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const SignInForm = () => {
  const formData = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Handle form submission, e.g., send data to the server for authentication
    console.log("Form Data:", data);
  };

  return (
    <form className="w-sm gap-6" onSubmit={formData.handleSubmit(onSubmit)}>
      <FieldGroup className="mb-5">
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
      </FieldGroup>
      <Button type="submit" className="w-full ">
        Sign In
      </Button>
    </form>
  );
};

export default SignInForm;
