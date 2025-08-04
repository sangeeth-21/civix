"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageTransition, FadeIn } from "@/components/page-transition";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, User, Lock, MapPin, Phone, Mail, Eye, EyeOff, Save, Camera } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Heading } from "@/components/ui/heading";

// Define the form schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

// Interface for user profile data
interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  bio?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  settings?: {
    notifications?: {
      email: boolean;
      sms: boolean;
      marketing: boolean;
      reminders: boolean;
    };
    appearance?: {
      theme: string;
      fontSize: string;
      reduceAnimations: boolean;
      highContrast: boolean;
    };
    privacy?: {
      profileVisibility: string;
      shareBookingHistory: boolean;
      shareContactInfo: boolean;
      allowDataCollection: boolean;
    };
  };
}

export default function UserProfile() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Fetch user profile data with React Query
  const { data: profileData, isLoading, error, refetch } = useQuery<UserProfile, Error>({
    queryKey: ["userProfile"],
    queryFn: async (): Promise<UserProfile> => {
      const res = await fetch("/api/users/profile");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch profile");
      }
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to load profile data");
      }
      return data.data;
    },
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Retry up to 3 times, but not for 401/403 errors
      if (failureCount >= 3) return false;
      if (error.message.includes('Authentication') || error.message.includes('Unauthorized')) return false;
      return true;
    },
  });

  // Initialize the profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      bio: "",
    }
  });

  // Initialize the password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  });

  // Update form values when profile data is loaded
  useEffect(() => {
    if (profileData) {
      profileForm.reset({
        name: profileData.name || "",
        phone: profileData.phone || "",
        address: profileData.address || "",
        bio: profileData.bio || "",
      });
    }
  }, [profileData, profileForm]);

  // Profile update mutation with optimistic updates
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      const responseData = await response.json();
      if (!responseData.success) {
        throw new Error(responseData.error || "Failed to update profile");
      }

      return responseData;
    },
    onMutate: async (newProfile) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["userProfile"] });

      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData<UserProfile>(["userProfile"]);

      // Optimistically update to the new value
      if (previousProfile) {
        queryClient.setQueryData<UserProfile>(["userProfile"], {
          ...previousProfile,
          ...newProfile,
        });
      }

      return { previousProfile };
    },
    onError: (error: Error, newProfile, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProfile) {
        queryClient.setQueryData(["userProfile"], context.previousProfile);
      }

      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
    onSuccess: (data) => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });

      // Update session with new user data
      updateSession({
        ...session,
        user: {
          ...session?.user,
          name: data.data.name,
        },
      });
    },
  });

  // Password update mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const response = await fetch("/api/users/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update password");
      }

      const responseData = await response.json();
      if (!responseData.success) {
        throw new Error(responseData.error || "Failed to update password");
      }

      return responseData;
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully",
      });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Password Update Failed",
        description: error.message,
      });
    },
  });

  // Handle profile update
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  // Handle password update
  const onPasswordSubmit = (data: PasswordFormValues) => {
    updatePasswordMutation.mutate(data);
  };

  // If no session, user should be redirected to login
  if (!session?.user) {
    return (
      <PageTransition>
        <div className="container py-12 px-4 md:px-6">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                Please login to view your profile
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => router.push('/login?callbackUrl=/user/profile')}>
                Go to Login
              </Button>
            </CardFooter>
          </Card>
        </div>
      </PageTransition>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <PageTransition>
        <div className="container py-12 px-4 md:px-6 max-w-5xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading profile...</span>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Error state
  if (error) {
    return (
      <PageTransition>
        <div className="container py-12 px-4 md:px-6 max-w-5xl">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error.message || "Failed to load profile. Please try again."}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => refetch()} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Get user initials for avatar
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const userInitials = getInitials(profileData?.name || session.user.name);

  return (
    <PageTransition>
      <div className="container py-12 px-4 md:px-6 max-w-5xl">
        <FadeIn>
          <div className="flex justify-between items-center mb-8">
            <div>
              <Heading level="h1">My Profile</Heading>
              <p className="text-muted-foreground">Manage your account information and preferences</p>
            </div>
            <Badge variant="outline" className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>User Account</span>
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* User Info Card */}
            <Card className="md:col-span-1">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={session.user.image || ""} alt={profileData?.name || session.user.name || "User"} />
                    <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <h2 className="text-xl font-semibold">{profileData?.name || session.user.name}</h2>
                <p className="text-muted-foreground">{profileData?.email || session.user.email}</p>

                <div className="w-full mt-6 space-y-4">
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-primary" />
                    <span>Role: {profileData?.role || session.user.role || "User"}</span>
                  </div>

                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-primary" />
                    <span>{profileData?.email || session.user.email}</span>
                  </div>

                  {profileData?.phone && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-primary" />
                      <span>{profileData.phone}</span>
                    </div>
                  )}

                  <Separator />

                  <p className="text-sm text-muted-foreground">
                    Member since {
                      profileData?.createdAt
                        ? format(new Date(profileData.createdAt), "MMMM yyyy")
                        : "N/A"
                    }
                  </p>

                  {profileData?.lastLogin && (
                    <p className="text-sm text-muted-foreground">
                      Last login: {format(new Date(profileData.lastLogin), "MMM dd, yyyy")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Profile Forms */}
            <div className="md:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile">Profile Information</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>
                        Update your personal details and contact information
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                              id="name"
                              {...profileForm.register("name")}
                              placeholder="Enter your full name"
                            />
                            {profileForm.formState.errors.name && (
                              <p className="text-sm text-destructive">
                                {profileForm.formState.errors.name.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              {...profileForm.register("phone")}
                              placeholder="Enter your phone number"
                            />
                            <p className="text-xs text-muted-foreground">
                              Phone number is required for booking services. We&apos;ll use this to contact you about your appointments.
                            </p>
                            {profileForm.formState.errors.phone && (
                              <p className="text-sm text-destructive">
                                {profileForm.formState.errors.phone.message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Textarea
                            id="address"
                            {...profileForm.register("address")}
                            placeholder="Enter your address"
                            rows={3}
                          />
                          {profileForm.formState.errors.address && (
                            <p className="text-sm text-destructive">
                              {profileForm.formState.errors.address.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            {...profileForm.register("bio")}
                            placeholder="Tell us about yourself"
                            rows={4}
                          />
                          {profileForm.formState.errors.bio && (
                            <p className="text-sm text-destructive">
                              {profileForm.formState.errors.bio.message}
                            </p>
                          )}
                        </div>

                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            disabled={updateProfileMutation.isPending}
                            className="flex items-center space-x-2"
                          >
                            {updateProfileMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            <span>Save Changes</span>
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Change Password</CardTitle>
                      <CardDescription>
                        Update your password to keep your account secure
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              type={showCurrentPassword ? "text" : "password"}
                              {...passwordForm.register("currentPassword")}
                              placeholder="Enter your current password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          {passwordForm.formState.errors.currentPassword && (
                            <p className="text-sm text-destructive">
                              {passwordForm.formState.errors.currentPassword.message}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <div className="relative">
                              <Input
                                id="newPassword"
                                type={showNewPassword ? "text" : "password"}
                                {...passwordForm.register("newPassword")}
                                placeholder="Enter new password"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                              >
                                {showNewPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            {passwordForm.formState.errors.newPassword && (
                              <p className="text-sm text-destructive">
                                {passwordForm.formState.errors.newPassword.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <div className="relative">
                              <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                {...passwordForm.register("confirmPassword")}
                                placeholder="Confirm new password"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            {passwordForm.formState.errors.confirmPassword && (
                              <p className="text-sm text-destructive">
                                {passwordForm.formState.errors.confirmPassword.message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            disabled={updatePasswordMutation.isPending}
                            className="flex items-center space-x-2"
                          >
                            {updatePasswordMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                            <span>Update Password</span>
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </FadeIn>
      </div>
    </PageTransition>
  );
} 
