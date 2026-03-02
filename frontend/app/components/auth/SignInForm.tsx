"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useForm, Controller } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { useDispatch } from "react-redux";
import { loginUser } from "@/store/slices/userSlice";

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
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  const formData = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (isLoading) return; // Prevent double submission

    setIsLoading(true);

    try {
      const result = await dispatch(loginUser(data));

      if (loginUser.rejected.match(result)) {
        const errorMessage =
          (result.payload as any)?.detail || "Invalid credentials";
        toast.error(errorMessage);
        setIsLoading(false); // Re-enable on error
        return;
      }

      if (loginUser.fulfilled.match(result)) {
        toast.success("Signed in successfully! Redirecting...");
        router.push("/home");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to sign in");
      setIsLoading(false); // Re-enable on error
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
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  );
};

export default SignInForm;
