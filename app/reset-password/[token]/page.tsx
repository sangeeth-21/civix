"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, AlertTriangle, CheckCircle, Shield, LockKeyhole } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SystemPageLayout } from "@/components/system-page-layout";

// Password reset schema with strong validation
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password is too long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Type for form values
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

// Props for reset password page
interface ResetPasswordProps {
  params: Promise<{ token: string }>;
}

// Reset password page component
export default function ResetPassword({ params }: ResetPasswordProps) {
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string>("");

  // Form definition
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Get token from params
  useEffect(() => {
    const getToken = async () => {
      const resolvedParams = await params;
      setToken(resolvedParams.token);
    };
    getToken();
  }, [params]);

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) return;
      
      try {
        setIsValidating(true);
        const response = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setIsTokenValid(true);
        } else {
          setError(data.error || "Invalid or expired token. Please request a new password reset link.");
        }
      } catch (err) {
        setError("Failed to validate token. Please try again.");
      } finally {
        setIsValidating(false);
      }
    };

    if (token) {
      validateToken();
    } else if (token === "") {
      setError("No token provided. Please request a password reset from the login page.");
      setIsValidating(false);
    }
  }, [token]);

  // Handle form submission
  async function onSubmit(data: ResetPasswordFormValues) {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsSuccess(true);
        toast({
          title: "Password Updated",
          description: "Your password has been reset successfully. You can now log in with your new password.",
          variant: "default",
        });
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          router.push("/login?reset=success");
        }, 3000);
      } else {
        setError(result.error || "Failed to reset password. Please try again.");
        toast({
          title: "Password Reset Failed",
          description: result.error || "Failed to reset password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Render different content based on state
  const renderContent = () => {
    if (isValidating) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Validating reset token...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Password Reset Failed</h2>
          <p className="text-muted-foreground text-center mb-6">{error}</p>
          <Button asChild>
            <Link href="/forgot-password">Request New Reset Link</Link>
          </Button>
        </div>
      );
    }

    if (isSuccess) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <CheckCircle className="h-12 w-12 text-success mb-4" />
          <h2 className="text-xl font-semibold mb-2">Password Updated Successfully!</h2>
          <p className="text-muted-foreground text-center mb-6">
            Your password has been reset. You will be redirected to the login page shortly.
          </p>
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      );
    }

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter your new password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Confirm your new password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Alert>
            <AlertDescription>
              <div className="flex flex-col space-y-1 text-sm">
                <p className="font-medium">Password requirements:</p>
                <ul className="ml-6 list-disc text-xs">
                  <li>At least 8 characters long</li>
                  <li>Include at least one uppercase letter</li>
                  <li>Include at least one lowercase letter</li>
                  <li>Include at least one number</li>
                  <li>Include at least one special character</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating Password...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>
      </Form>
    );
  };

  return (
    <SystemPageLayout
      title="Reset Password"
      icon={<LockKeyhole className="h-6 w-6" />}
      showHomeButton={true}
      showBackButton={true}
    >
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Create a new password for your account
          </CardDescription>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-center text-sm text-muted-foreground">
            Remember your password? <Link href="/login" className="underline">Sign in</Link>
          </div>
        </CardFooter>
      </Card>
    </SystemPageLayout>
  );
} 
