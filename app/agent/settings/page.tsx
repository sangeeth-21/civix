"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast, useToast } from "@/components/ui/use-toast";
import { 
  Bell, 
  Eye, 
  Lock, 
  Palette, 
  Shield, 
  Trash2, 
  User, 
  Settings as SettingsIcon,
  Loader2,
  AlertTriangle,
  Mail,
  Smartphone,
  BellRing,
  Globe,
  Sun,
  Moon,
  Laptop,
  EyeOff,
  Save,
  Award
} from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { User as UserType } from "@/types";
import { PageTransition, FadeIn } from "@/components/page-transition";
import { Heading } from "@/components/ui/heading";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Form schemas
const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  bookingReminders: z.boolean(),
  marketingEmails: z.boolean(),
  appNotifications: z.boolean(),
});

const appearanceSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  fontSize: z.enum(["small", "medium", "large"]),
  reduceMotion: z.boolean(),
  highContrast: z.boolean(),
});

const privacySchema = z.object({
  profileVisibility: z.enum(["public", "contacts", "private"]),
  shareContactInfo: z.boolean(),
  shareBookingHistory: z.boolean(),
  allowDataCollection: z.boolean(),
});

const accountSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type NotificationFormValues = z.infer<typeof notificationSchema>;
type AppearanceFormValues = z.infer<typeof appearanceSchema>;
type PrivacyFormValues = z.infer<typeof privacySchema>;
type AccountFormValues = z.infer<typeof accountSchema>;

// Interface for agent settings
interface AgentSettings {
  notifications: {
    email: boolean;
    sms: boolean;
    marketing: boolean;
    reminders: boolean;
    app: boolean;
  };
  appearance: {
    theme: string;
    fontSize: string;
    reduceAnimations: boolean;
    highContrast: boolean;
  };
  privacy: {
    profileVisibility: string;
    shareBookingHistory: boolean;
    shareContactInfo: boolean;
    allowDataCollection: boolean;
  };
}

export default function AgentSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPassword, setCurrentPassword] = useState("");
  const [isCurrentPasswordDialogOpen, setIsCurrentPasswordDialogOpen] = useState(false);
  const [actionAfterPassword, setActionAfterPassword] = useState<"save" | "delete" | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("notifications");
  
  const router = useRouter();

  // Fetch agent settings with React Query
  const { data: settings, isLoading, error, refetch } = useQuery<AgentSettings, Error>({
    queryKey: ["agentSettings"],
    queryFn: async (): Promise<AgentSettings> => {
      try {
        const [notificationsRes, appearanceRes, privacyRes] = await Promise.all([
          fetch("/api/users/settings/notifications"),
          fetch("/api/users/settings/appearance"),
          fetch("/api/users/settings/privacy"),
        ]);
        
        // Check if any request failed
        if (!notificationsRes.ok || !appearanceRes.ok || !privacyRes.ok) {
          throw new Error("Failed to fetch settings");
        }
        
        const [notificationsData, appearanceData, privacyData] = await Promise.all([
          notificationsRes.json(),
          appearanceRes.json(),
          privacyRes.json(),
        ]);
        
        return {
          notifications: {
            email: notificationsData.data.emailNotifications,
            sms: notificationsData.data.smsNotifications,
            marketing: notificationsData.data.marketingEmails,
            reminders: notificationsData.data.bookingReminders,
            app: true, // Default for app notifications
          },
          appearance: appearanceData.data,
          privacy: privacyData.data,
        };
      } catch (error) {
        throw new Error("Failed to load settings. Please try again.");
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Retry up to 3 times, but not for 401/403 errors
      if (failureCount >= 3) return false;
      if (error.message.includes('Authentication') || error.message.includes('Unauthorized')) return false;
      return true;
    },
  });

  // Form setup for notifications
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      smsNotifications: false,
      bookingReminders: true,
      marketingEmails: false,
      appNotifications: true,
    },
  });

  // Form setup for appearance
  const appearanceForm = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {
      theme: "system",
      fontSize: "medium",
      reduceMotion: false,
      highContrast: false,
    },
  });

  // Form setup for privacy
  const privacyForm = useForm<PrivacyFormValues>({
    resolver: zodResolver(privacySchema),
    defaultValues: {
      profileVisibility: "public",
      shareContactInfo: true,
      shareBookingHistory: false,
      allowDataCollection: true,
    },
  });

  // Form setup for account
  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Update form values when settings are loaded
  useEffect(() => {
    if (settings) {
      notificationForm.reset({
        emailNotifications: settings.notifications.email,
        smsNotifications: settings.notifications.sms,
        bookingReminders: settings.notifications.reminders,
        marketingEmails: settings.notifications.marketing,
        appNotifications: settings.notifications.app,
      });
      
      appearanceForm.reset({
        theme: settings.appearance.theme as "light" | "dark" | "system",
        fontSize: settings.appearance.fontSize as "small" | "medium" | "large",
        reduceMotion: settings.appearance.reduceAnimations,
        highContrast: settings.appearance.highContrast,
      });
      
      privacyForm.reset({
        profileVisibility: settings.privacy.profileVisibility as "public" | "contacts" | "private",
        shareContactInfo: settings.privacy.shareContactInfo,
        shareBookingHistory: settings.privacy.shareBookingHistory,
        allowDataCollection: settings.privacy.allowDataCollection,
      });
    }
  }, [settings, notificationForm, appearanceForm, privacyForm]);

  // Notification settings mutation
  const updateNotificationSettingsMutation = useMutation({
    mutationFn: async (data: NotificationFormValues) => {
      const response = await fetch("/api/users/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailNotifications: data.emailNotifications,
          smsNotifications: data.smsNotifications,
          marketingEmails: data.marketingEmails,
          bookingReminders: data.bookingReminders,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update notification settings");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated",
      });
      queryClient.invalidateQueries({ queryKey: ["agentSettings"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Settings Update Failed",
        description: error.message,
      });
    },
  });

  // Appearance settings mutation
  const updateAppearanceSettingsMutation = useMutation({
    mutationFn: async (data: AppearanceFormValues) => {
      const response = await fetch("/api/users/settings/appearance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: data.theme,
          fontSize: data.fontSize,
          reduceAnimations: data.reduceMotion,
          highContrast: data.highContrast,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update appearance settings");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Your appearance preferences have been updated",
      });
      
      // Apply theme change immediately
      document.documentElement.classList.remove('light', 'dark', 'system');
      document.documentElement.classList.add(appearanceForm.getValues("theme"));
      
      queryClient.invalidateQueries({ queryKey: ["agentSettings"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Settings Update Failed",
        description: error.message,
      });
    },
  });

  // Privacy settings mutation
  const updatePrivacySettingsMutation = useMutation({
    mutationFn: async (data: PrivacyFormValues) => {
      const response = await fetch("/api/users/settings/privacy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileVisibility: data.profileVisibility,
          shareContactInfo: data.shareContactInfo,
          shareBookingHistory: data.shareBookingHistory,
          allowDataCollection: data.allowDataCollection,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update privacy settings");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Your privacy preferences have been updated",
      });
      queryClient.invalidateQueries({ queryKey: ["agentSettings"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Settings Update Failed",
        description: error.message,
      });
    },
  });

  // Password update mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: AccountFormValues) => {
      const response = await fetch("/api/users/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPassword,
          newPassword: data.password,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update password");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully",
      });
      accountForm.reset();
      setCurrentPassword("");
      setIsCurrentPasswordDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Password Update Failed",
        description: error.message,
      });
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/users/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete account");
      }
      
      return response.json();
    },
    onSuccess: async () => {
      // Sign out and redirect to home page
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Account Deletion Failed",
        description: error.message,
      });
    },
  });

  // Handle save notification settings
  const handleSaveNotifications = (data: NotificationFormValues) => {
    updateNotificationSettingsMutation.mutate(data);
  };

  // Handle save appearance settings
  const handleSaveAppearance = (data: AppearanceFormValues) => {
    updateAppearanceSettingsMutation.mutate(data);
  };

  // Handle save privacy settings
  const handleSavePrivacy = (data: PrivacyFormValues) => {
    updatePrivacySettingsMutation.mutate(data);
  };

  // Handle password update
  const handlePasswordUpdate = (data: AccountFormValues) => {
    if (!currentPassword) {
      setActionAfterPassword("save");
      setIsCurrentPasswordDialogOpen(true);
      return;
    }
    updatePasswordMutation.mutate(data);
  };

  // Handle account deletion
  const handleDeleteAccount = () => {
    if (!currentPassword) {
      setActionAfterPassword("delete");
      setIsCurrentPasswordDialogOpen(true);
      return;
    }
    setIsConfirmDeleteOpen(true);
  };

  // Confirm delete account
  const confirmDeleteAccount = () => {
    deleteAccountMutation.mutate();
  };

  // Loading state
  if (isLoading) {
    return (
      <PageTransition>
        <div className="container py-12 px-4 md:px-6 max-w-6xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading settings...</span>
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
        <div className="container py-12 px-4 md:px-6 max-w-6xl">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error.message || "Failed to load settings. Please try again."}
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

  return (
    <PageTransition>
      <div className="container py-12 px-4 md:px-6 max-w-6xl">
        <FadeIn>
          <div className="flex justify-between items-center mb-8">
            <div>
              <Heading level="h1">Agent Settings</Heading>
              <p className="text-muted-foreground">Manage your account preferences and professional settings</p>
            </div>
            <Badge variant="outline" className="flex items-center space-x-1">
              <Award className="h-3 w-3" />
              <span>Professional Agent</span>
            </Badge>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Privacy
              </TabsTrigger>
              <TabsTrigger value="account" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Account
              </TabsTrigger>
            </TabsList>
            
            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose how you want to receive notifications about bookings and updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...notificationForm}>
                    <form onSubmit={notificationForm.handleSubmit(handleSaveNotifications)} className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive booking confirmations and updates via email
                            </p>
                          </div>
                          <FormField
                            control={notificationForm.control}
                            name="emailNotifications"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>SMS Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive urgent notifications via SMS
                            </p>
                          </div>
                          <FormField
                            control={notificationForm.control}
                            name="smsNotifications"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Booking Reminders</Label>
                            <p className="text-sm text-muted-foreground">
                              Get reminded about upcoming bookings
                            </p>
                          </div>
                          <FormField
                            control={notificationForm.control}
                            name="bookingReminders"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Marketing Emails</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive promotional content and offers
                            </p>
                          </div>
                          <FormField
                            control={notificationForm.control}
                            name="marketingEmails"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>App Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive notifications within the application
                            </p>
                          </div>
                          <FormField
                            control={notificationForm.control}
                            name="appNotifications"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={updateNotificationSettingsMutation.isPending}
                          className="flex items-center space-x-2"
                        >
                          {updateNotificationSettingsMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          <span>Save Changes</span>
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance Settings</CardTitle>
                  <CardDescription>
                    Customize how the application looks and feels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...appearanceForm}>
                    <form onSubmit={appearanceForm.handleSubmit(handleSaveAppearance)} className="space-y-6">
                      <div className="space-y-4">
                        <FormField
                          control={appearanceForm.control}
                          name="theme"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Theme</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select theme" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="light">
                                    <div className="flex items-center space-x-2">
                                      <Sun className="h-4 w-4" />
                                      <span>Light</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="dark">
                                    <div className="flex items-center space-x-2">
                                      <Moon className="h-4 w-4" />
                                      <span>Dark</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="system">
                                    <div className="flex items-center space-x-2">
                                      <Laptop className="h-4 w-4" />
                                      <span>System</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={appearanceForm.control}
                          name="fontSize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Font Size</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select font size" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="small">Small</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="large">Large</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Reduce Motion</Label>
                            <p className="text-sm text-muted-foreground">
                              Minimize animations for accessibility
                            </p>
                          </div>
                          <FormField
                            control={appearanceForm.control}
                            name="reduceMotion"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>High Contrast</Label>
                            <p className="text-sm text-muted-foreground">
                              Increase contrast for better visibility
                            </p>
                          </div>
                          <FormField
                            control={appearanceForm.control}
                            name="highContrast"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={updateAppearanceSettingsMutation.isPending}
                          className="flex items-center space-x-2"
                        >
                          {updateAppearanceSettingsMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          <span>Save Changes</span>
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Privacy Tab */}
            <TabsContent value="privacy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>
                    Control your privacy and data sharing preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...privacyForm}>
                    <form onSubmit={privacyForm.handleSubmit(handleSavePrivacy)} className="space-y-6">
                      <div className="space-y-4">
                        <FormField
                          control={privacyForm.control}
                          name="profileVisibility"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Profile Visibility</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select visibility" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="public">Public</SelectItem>
                                  <SelectItem value="contacts">Contacts Only</SelectItem>
                                  <SelectItem value="private">Private</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Share Contact Information</Label>
                            <p className="text-sm text-muted-foreground">
                              Allow clients to see your contact details
                            </p>
                          </div>
                          <FormField
                            control={privacyForm.control}
                            name="shareContactInfo"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Share Booking History</Label>
                            <p className="text-sm text-muted-foreground">
                              Allow clients to see your booking history
                            </p>
                          </div>
                          <FormField
                            control={privacyForm.control}
                            name="shareBookingHistory"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Data Collection</Label>
                            <p className="text-sm text-muted-foreground">
                              Allow us to collect usage data for improvements
                            </p>
                          </div>
                          <FormField
                            control={privacyForm.control}
                            name="allowDataCollection"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={updatePrivacySettingsMutation.isPending}
                          className="flex items-center space-x-2"
                        >
                          {updatePrivacySettingsMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          <span>Save Changes</span>
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Account Tab */}
            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Management</CardTitle>
                  <CardDescription>
                    Manage your account security and data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">Change Password</h3>
                      <p className="text-sm text-muted-foreground">
                        Update your password to keep your account secure
                      </p>
                    </div>
                    
                    <Form {...accountForm}>
                      <form onSubmit={accountForm.handleSubmit(handlePasswordUpdate)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={accountForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    placeholder="Enter new password"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={accountForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm New Password</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    placeholder="Confirm new password"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
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
                    </Form>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
                      <p className="text-sm text-muted-foreground">
                        These actions cannot be undone. Please proceed with caution.
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label className="text-base font-medium">Delete Account</Label>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete your account and all associated data
                        </p>
                      </div>
                      <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            onClick={handleDeleteAccount}
                            className="flex items-center space-x-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete Account</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your account
                              and remove all your data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={confirmDeleteAccount}
                              disabled={deleteAccountMutation.isPending}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deleteAccountMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Delete Account"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Current Password Dialog */}
          <Dialog open={isCurrentPasswordDialogOpen} onOpenChange={setIsCurrentPasswordDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enter Current Password</DialogTitle>
                <DialogDescription>
                  Please enter your current password to continue.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="Enter your current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCurrentPasswordDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (actionAfterPassword === "save") {
                      updatePasswordMutation.mutate(accountForm.getValues());
                    } else if (actionAfterPassword === "delete") {
                      setIsCurrentPasswordDialogOpen(false);
                      setIsConfirmDeleteOpen(true);
                    }
                  }}
                  disabled={!currentPassword || updatePasswordMutation.isPending}
                >
                  Continue
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </FadeIn>
      </div>
    </PageTransition>
  );
} 
