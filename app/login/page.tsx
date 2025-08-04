"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { PageTransition, FadeIn } from "@/components/page-transition";
import { Eye, EyeOff, Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

const loginSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters",
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/user/dashboard";
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      
      if (result?.error) {
        let errorMessage = "An error occurred during login";
        
        if (result.error === "CredentialsSignin") {
          errorMessage = "Invalid email or password. Please check your credentials and try again.";
        } else if (result.error === "CallbackRouteError") {
          errorMessage = "Authentication service error. Please try again later.";
        } else {
          errorMessage = result.error;
        }
        
        setAuthError(errorMessage);
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: errorMessage,
          duration: 5000,
        });
        return;
      }
      
      toast({
        title: "Welcome back!",
        description: "Login successful. Redirecting to your dashboard...",
        duration: 3000,
      });
      
      // Redirect after successful login
      router.push(callbackUrl);
      router.refresh();
      
    } catch (error) {
      setAuthError("An unexpected error occurred. Please try again.");
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <FadeIn>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {authError && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="your.email@example.com" 
                        {...field} 
                        disabled={isLoading}
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                        disabled={isLoading}
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Remember me
                  </label>
                </div>
                
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4">
          <div className="text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </FadeIn>
  );
}

export default function Login() {
  return (
    <PageTransition>
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center px-4 py-12">
        <Suspense fallback={<div>Loading...</div>}>
          <LoginContent />
        </Suspense>
      </div>
    </PageTransition>
  );
} 
