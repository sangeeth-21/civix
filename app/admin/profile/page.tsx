"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { PageTransition, FadeIn } from "@/components/page-transition";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Bell, 
  Settings, 
  Loader2,
  Save,
  Eye,
  EyeOff,
  Camera,
  Lock,
  MapPin,
  Building,
  Award,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Interface for admin profile data
interface AdminProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  bio?: string;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    marketingEmails: boolean;
    language: string;
    timezone: string;
  };
  stats?: {
    totalUsers: number;
    totalAgents: number;
    totalBookings: number;
    totalRevenue: number;
  };
}

export default function AdminProfile() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // State for active tab
  const [activeTab, setActiveTab] = useState("profile");
  
  // State for password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // State for form data
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
  });
  
  const [appearanceSettings, setAppearanceSettings] = useState({
    language: "en",
    timezone: "UTC",
  });
  
  // State for UI
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Fetch admin profile data with React Query
  const { data: profile, isLoading, error, refetch } = useQuery<AdminProfile, Error>({
    queryKey: ["adminProfile"],
    queryFn: async (): Promise<AdminProfile> => {
      const res = await fetch("/api/admin/profile");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch profile");
      }
      const data = await res.json();
      return data.data;
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

  // Update form values when profile data is loaded
  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
      });
      
      setNotificationSettings({
        emailNotifications: profile.preferences?.emailNotifications ?? true,
        pushNotifications: profile.preferences?.pushNotifications ?? true,
        smsNotifications: profile.preferences?.smsNotifications ?? false,
        marketingEmails: profile.preferences?.marketingEmails ?? false,
      });
      
      setAppearanceSettings({
        language: profile.preferences?.language ?? "en",
        timezone: profile.preferences?.timezone ?? "UTC",
      });
    }
  }, [profile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["adminProfile"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordData) => {
      const res = await fetch("/api/users/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      if (!res.ok) throw new Error("Failed to update password");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
        variant: "default",
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { preferences: {
      emailNotifications: boolean;
      pushNotifications: boolean;
      smsNotifications: boolean;
      marketingEmails: boolean;
      language: string;
      timezone: string;
    } }) => {
      const res = await fetch("/api/admin/profile/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your settings have been updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["adminProfile"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle profile update
  const handleProfileUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateProfileMutation.mutateAsync(profileData);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New passwords don't match.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUpdating(true);
    try {
      await updatePasswordMutation.mutateAsync(passwordData);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle settings update
  const handleSettingsUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateSettingsMutation.mutateAsync({
        preferences: {
          emailNotifications: notificationSettings.emailNotifications,
          pushNotifications: notificationSettings.pushNotifications,
          smsNotifications: notificationSettings.smsNotifications,
          marketingEmails: notificationSettings.marketingEmails,
          language: appearanceSettings.language,
          timezone: appearanceSettings.timezone,
        }
      });
    } finally {
      setIsUpdating(false);
    }
  };

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
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>
                {error.message || "Failed to load profile. Please try again."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => refetch()} variant="outline">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  // Get user initials for avatar
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const userInitials = getInitials(profile?.name);

  return (
    <PageTransition>
      <div className="container py-12 px-4 md:px-6 max-w-5xl">
        <FadeIn>
          <div className="flex justify-between items-center mb-8">
            <div>
              <Heading level="h1">Admin Profile</Heading>
              <p className="text-muted-foreground">Manage your administrator account and preferences</p>
            </div>
            <Badge variant="outline" className="flex items-center space-x-1">
              <Shield className="h-3 w-3" />
              <span>System Administrator</span>
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Admin Info Card */}
            <Card className="md:col-span-1">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile?.avatar || ""} alt={profile?.name || "Admin"} />
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
                <h2 className="text-xl font-semibold">{profile?.name}</h2>
                <p className="text-muted-foreground">{profile?.email}</p>
                
                {profile?.stats && (
                  <div className="w-full mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Total Users:</span>
                      <span className="font-medium">{profile.stats.totalUsers}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Total Agents:</span>
                      <span className="font-medium">{profile.stats.totalAgents}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Total Bookings:</span>
                      <span className="font-medium">{profile.stats.totalBookings}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Total Revenue:</span>
                      <span className="font-medium">${profile.stats.totalRevenue.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                
                <div className="w-full mt-6 space-y-4">
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-primary" />
                    <span>Role: {profile?.role || "Admin"}</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-primary" />
                    <span>{profile?.email}</span>
                  </div>
                  
                  {profile?.phone && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-primary" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  
                  <Separator />

                  <p className="text-sm text-muted-foreground">
                    Member since {
                      profile?.createdAt 
                        ? new Date(profile.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long' 
                          })
                        : "N/A"
                    }
                  </p>
                  
                  {profile?.lastLogin && (
                    <p className="text-sm text-muted-foreground">
                      Last login: {new Date(profile.lastLogin).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Profile Forms */}
            <div className="md:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="profile">Profile Information</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
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
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={profileData.name}
                            onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter your full name"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="Enter your email"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Enter your phone number"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={profileData.bio}
                          onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                          placeholder="Tell us about yourself"
                          rows={4}
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          onClick={handleProfileUpdate}
                          disabled={isUpdating || updateProfileMutation.isPending}
                          className="flex items-center space-x-2"
                        >
                          {(isUpdating || updateProfileMutation.isPending) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          <span>Save Changes</span>
                        </Button>
                      </div>
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
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
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
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              type={showNewPassword ? "text" : "password"}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
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
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
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
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          onClick={handlePasswordUpdate}
                          disabled={isUpdating || updatePasswordMutation.isPending}
                          className="flex items-center space-x-2"
                        >
                          {(isUpdating || updatePasswordMutation.isPending) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Lock className="h-4 w-4" />
                          )}
                          <span>Update Password</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Preferences Tab */}
                <TabsContent value="preferences" className="space-y-6">
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
                            <Label>Push Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive notifications within the application
                            </p>
                          </div>
                          <Switch
                            checked={notificationSettings.pushNotifications}
                            onCheckedChange={(checked) =>
                              setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))
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
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Language</Label>
                          <Select
                            value={appearanceSettings.language}
                            onValueChange={(value) =>
                              setAppearanceSettings(prev => ({ ...prev, language: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="es">Spanish</SelectItem>
                              <SelectItem value="fr">French</SelectItem>
                              <SelectItem value="de">German</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Timezone</Label>
                          <Select
                            value={appearanceSettings.timezone}
                            onValueChange={(value) =>
                              setAppearanceSettings(prev => ({ ...prev, timezone: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UTC">UTC</SelectItem>
                              <SelectItem value="America/New_York">Eastern Time</SelectItem>
                              <SelectItem value="America/Chicago">Central Time</SelectItem>
                              <SelectItem value="America/Denver">Mountain Time</SelectItem>
                              <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          onClick={handleSettingsUpdate}
                          disabled={isUpdating || updateSettingsMutation.isPending}
                          className="flex items-center space-x-2"
                        >
                          {(isUpdating || updateSettingsMutation.isPending) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          <span>Save Changes</span>
                        </Button>
                      </div>
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
