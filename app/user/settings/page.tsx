"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageTransition, FadeIn } from "@/components/page-transition";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Bell, Palette, Globe, Shield, AlertTriangle, Save, Trash2, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Heading } from "@/components/ui/heading";
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

// Interface for user settings
interface UserSettings {
  notifications: {
    email: boolean;
    sms: boolean;
    marketing: boolean;
    reminders: boolean;
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

export default function UserSettings() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for active tab
  const [activeTab, setActiveTab] = useState("notifications");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    bookingReminders: true,
  });

  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: "system",
    fontSize: "medium",
    reduceAnimations: false,
    highContrast: false,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    shareBookingHistory: false,
    shareContactInfo: false,
    allowDataCollection: true,
  });

  // Fetch user settings with React Query
  const { data: settings, isLoading, error, refetch } = useQuery<UserSettings, Error>({
    queryKey: ["userSettings"],
    queryFn: async (): Promise<UserSettings> => {
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

        const [notificationsJson, appearanceJson, privacyJson] = await Promise.all([
          notificationsRes.json(),
          appearanceRes.json(),
          privacyRes.json(),
        ]);

        // Check if any response was not successful
        if (!notificationsJson.success || !appearanceJson.success || !privacyJson.success) {
          throw new Error("Failed to fetch settings data");
        }

        return {
          notifications: notificationsJson.data,
          appearance: appearanceJson.data,
          privacy: privacyJson.data,
        };
      } catch (error) {
        console.error("Settings fetch error:", error);
        throw new Error("Failed to load settings. Please try again.");
      }
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

  // Update settings when data is loaded
  useEffect(() => {
    if (settings) {
      setNotificationSettings({
        emailNotifications: settings.notifications.email,
        smsNotifications: settings.notifications.sms,
        marketingEmails: settings.notifications.marketing,
        bookingReminders: settings.notifications.reminders,
      });

      setAppearanceSettings({
        theme: settings.appearance.theme,
        fontSize: settings.appearance.fontSize,
        reduceAnimations: settings.appearance.reduceAnimations,
        highContrast: settings.appearance.highContrast,
      });

      setPrivacySettings({
        profileVisibility: settings.privacy.profileVisibility,
        shareBookingHistory: settings.privacy.shareBookingHistory,
        shareContactInfo: settings.privacy.shareContactInfo,
        allowDataCollection: settings.privacy.allowDataCollection,
      });
    }
  }, [settings]);

  // Notification settings mutation
  const updateNotificationSettingsMutation = useMutation({
    mutationFn: async (data: typeof notificationSettings) => {
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

      const responseData = await response.json();
      if (!responseData.success) {
        throw new Error(responseData.error || "Failed to update notification settings");
      }

      return responseData;
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated",
      });
      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
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
    mutationFn: async (data: typeof appearanceSettings) => {
      const response = await fetch("/api/users/settings/appearance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: data.theme,
          fontSize: data.fontSize,
          reduceAnimations: data.reduceAnimations,
          highContrast: data.highContrast,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update appearance settings");
      }

      const responseData = await response.json();
      if (!responseData.success) {
        throw new Error(responseData.error || "Failed to update appearance settings");
      }

      return responseData;
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Your appearance preferences have been updated",
      });

      // Apply theme change immediately
      document.documentElement.classList.remove('light', 'dark', 'system');
      document.documentElement.classList.add(appearanceSettings.theme);

      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
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
    mutationFn: async (data: typeof privacySettings) => {
      const response = await fetch("/api/users/settings/privacy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileVisibility: data.profileVisibility,
          shareBookingHistory: data.shareBookingHistory,
          shareContactInfo: data.shareContactInfo,
          allowDataCollection: data.allowDataCollection,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update privacy settings");
      }

      const responseData = await response.json();
      if (!responseData.success) {
        throw new Error(responseData.error || "Failed to update privacy settings");
      }

      return responseData;
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Your privacy preferences have been updated",
      });
      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Settings Update Failed",
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
  const handleSaveNotifications = () => {
    updateNotificationSettingsMutation.mutate(notificationSettings);
  };

  // Handle save appearance settings
  const handleSaveAppearance = () => {
    updateAppearanceSettingsMutation.mutate(appearanceSettings);
  };

  // Handle save privacy settings
  const handleSavePrivacy = () => {
    updatePrivacySettingsMutation.mutate(privacySettings);
  };

  // Handle account deletion
  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate();
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
                Please login to access your settings
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => router.push('/login?callbackUrl=/user/settings')}>
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
            <AlertTitle>Error</AlertTitle>
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
              <Heading level="h1">Settings</Heading>
              <p className="text-muted-foreground">Manage your account preferences and privacy</p>
            </div>
            <Badge variant="outline" className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>User Account</span>
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
                <AlertTriangle className="h-4 w-4" />
                Account
              </TabsTrigger>
            </TabsList>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose how you want to receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive important updates via email
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive urgent notifications via SMS
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.smsNotifications}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({ ...prev, smsNotifications: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Booking Reminders</Label>
                        <p className="text-sm text-muted-foreground">
                          Get reminded about upcoming bookings
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.bookingReminders}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({ ...prev, bookingReminders: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Marketing Emails</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive promotional content and offers
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.marketingEmails}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({ ...prev, marketingEmails: checked }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleSaveNotifications}
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
                </CardFooter>
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
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Theme</Label>
                      <Select
                        value={appearanceSettings.theme}
                        onValueChange={(value) =>
                          setAppearanceSettings(prev => ({ ...prev, theme: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Font Size</Label>
                      <Select
                        value={appearanceSettings.fontSize}
                        onValueChange={(value) =>
                          setAppearanceSettings(prev => ({ ...prev, fontSize: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select font size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Reduce Animations</Label>
                        <p className="text-sm text-muted-foreground">
                          Minimize motion for accessibility
                        </p>
                      </div>
                      <Switch
                        checked={appearanceSettings.reduceAnimations}
                        onCheckedChange={(checked) =>
                          setAppearanceSettings(prev => ({ ...prev, reduceAnimations: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>High Contrast</Label>
                        <p className="text-sm text-muted-foreground">
                          Increase contrast for better visibility
                        </p>
                      </div>
                      <Switch
                        checked={appearanceSettings.highContrast}
                        onCheckedChange={(checked) =>
                          setAppearanceSettings(prev => ({ ...prev, highContrast: checked }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleSaveAppearance}
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
                </CardFooter>
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
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Profile Visibility</Label>
                      <Select
                        value={privacySettings.profileVisibility}
                        onValueChange={(value) =>
                          setPrivacySettings(prev => ({ ...prev, profileVisibility: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="contacts">Contacts Only</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Share Contact Information</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow others to see your contact details
                        </p>
                      </div>
                      <Switch
                        checked={privacySettings.shareContactInfo}
                        onCheckedChange={(checked) =>
                          setPrivacySettings(prev => ({ ...prev, shareContactInfo: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Share Booking History</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow others to see your booking history
                        </p>
                      </div>
                      <Switch
                        checked={privacySettings.shareBookingHistory}
                        onCheckedChange={(checked) =>
                          setPrivacySettings(prev => ({ ...prev, shareBookingHistory: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Data Collection</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow us to collect usage data for improvements
                        </p>
                      </div>
                      <Switch
                        checked={privacySettings.allowDataCollection}
                        onCheckedChange={(checked) =>
                          setPrivacySettings(prev => ({ ...prev, allowDataCollection: checked }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleSavePrivacy}
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
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Management</CardTitle>
                  <CardDescription>
                    Manage your account and data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Danger Zone</AlertTitle>
                    <AlertDescription>
                      These actions cannot be undone. Please proceed with caution.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label className="text-base font-medium">Delete Account</Label>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete your account and all associated data
                        </p>
                      </div>
                      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="flex items-center space-x-2">
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
                              onClick={handleDeleteAccount}
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
        </FadeIn>
      </div>
    </PageTransition>
  );
} 
