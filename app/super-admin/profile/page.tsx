"use client";

import { useEffect, useState } from "react";
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
  Shield, 
  Bell, 
  Settings, 
  Save, 
  Loader2,
  Eye,
  EyeOff,
  Camera,
  Key,
  Lock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Award,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Interface for user profile data
interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "SUPER_ADMIN";
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  profile: {
    bio?: string;
    avatar?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    dateOfBirth?: string;
    company?: string;
    position?: string;
    skills?: string[];
    experience?: string;
    certifications?: string[];
  };
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    marketingEmails: boolean;
    language: string;
    timezone: string;
    theme: "light" | "dark" | "system";
  };
  security: {
    twoFactorEnabled: boolean;
    lastPasswordChange?: string;
    loginHistory: Array<{
      timestamp: string;
      ipAddress: string;
      userAgent: string;
      location?: string;
    }>;
  };
}

export default function SuperAdminProfile() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // State for active tab
  const [activeTab, setActiveTab] = useState("profile");
  
  // State for password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // State for form data
  const [profileData, setProfileData] = useState<Partial<UserProfile>>({
    name: "",
    email: "",
    phone: "",
    profile: {
      bio: "",
      avatar: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      dateOfBirth: "",
      company: "",
      position: "",
      skills: [],
      experience: "",
      certifications: []
    },
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      marketingEmails: false,
      language: "en",
      timezone: "UTC",
      theme: "system"
    }
  });
  
  // State for password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  // State for validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Fetch user profile
  const { data: profileDataResponse, isLoading, error, refetch } = useQuery<{ data?: UserProfile } | undefined, Error>({
    queryKey: ["superAdminProfile"],
    queryFn: async () => {
      const res = await fetch("/api/super-admin/profile");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch profile");
      }
      return res.json();
    },
    retry: (failureCount, error) => {
      // Retry up to 3 times, but not for 401/403 errors
      if (failureCount >= 3) return false;
      if (error.message.includes('Authentication') || error.message.includes('Unauthorized')) return false;
      return true;
    },
  });

  useEffect(() => {
    if (profileDataResponse && typeof profileDataResponse === 'object' && 'data' in profileDataResponse && profileDataResponse.data) {
      setProfileData(profileDataResponse.data);
    }
  }, [profileDataResponse]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<UserProfile>) => {
      const res = await fetch("/api/super-admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superAdminProfile"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (passwordData: { currentPassword: string; newPassword: string }) => {
      const res = await fetch("/api/super-admin/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData),
      });
      if (!res.ok) throw new Error("Failed to change password");
      return res.json();
    },
    onSuccess: () => {
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      toast({
        title: "Password Changed",
        description: "Your password has been changed successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle input changes
  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.includes('.')) {
      const [section, key] = field.split('.');
      setProfileData(prev => {
        const sectionValue = prev[section as keyof typeof prev];
        return {
          ...prev,
          [section]: (sectionValue && typeof sectionValue === 'object')
            ? { ...(sectionValue as Record<string, unknown>), [key]: value }
            : { [key]: value }
        };
      });
    } else {
      setProfileData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Handle password input changes
  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Validate profile form
  const validateProfile = () => {
    const newErrors: Record<string, string> = {};
    
    if (!profileData.name?.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!profileData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = "Email is invalid";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate password form
  const validatePassword = () => {
    const newErrors: Record<string, string> = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle profile save
  const handleProfileSave = () => {
    if (validateProfile()) {
      updateProfileMutation.mutate(profileData);
    }
  };

  // Handle password change
  const handlePasswordChangeClick = () => {
    if (validatePassword()) {
      changePasswordMutation.mutate({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container p-6 md:p-10">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container p-6 md:p-10">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error.message || "Failed to load profile. Please try again."}</p>
            <div className="mt-4">
              <Button onClick={() => refetch()} variant="outline">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const user: UserProfile | undefined = (profileDataResponse && typeof profileDataResponse === 'object' && 'data' in profileDataResponse)
    ? (profileDataResponse as { data?: UserProfile }).data
    : undefined;

  return (
    <PageTransition>
      <div className="container p-6 md:p-10">
        <FadeIn delay={0.1}>
          <div className="flex justify-between items-center mb-8">
            <div>
              <Heading level="h1">Profile Settings</Heading>
              <p className="text-muted-foreground">Manage your account profile and preferences</p>
            </div>
            <Badge variant="outline" className="flex items-center space-x-1">
              <Shield className="h-3 w-3" />
              <span>Super Administrator</span>
            </Badge>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>
            
            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Personal Information</span>
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and profile details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profileData.profile?.avatar} />
                      <AvatarFallback className="text-lg">
                        {profileData.name?.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Button variant="outline" size="sm">
                        <Camera className="mr-2 h-4 w-4" />
                        Change Avatar
                      </Button>
                      <p className="text-sm text-muted-foreground mt-1">
                        JPG, PNG or GIF. Max size 2MB.
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Basic Information */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={profileData.name || ""}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className={errors.name ? "border-red-500" : ""}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500">{errors.name}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email || ""}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500">{errors.email}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone || ""}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={profileData.profile?.dateOfBirth || ""}
                        onChange={(e) => handleInputChange("profile.dateOfBirth", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself"
                      value={profileData.profile?.bio || ""}
                      onChange={(e) => handleInputChange("profile.bio", e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <Separator />
                  
                  {/* Professional Information */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={profileData.profile?.company || ""}
                        onChange={(e) => handleInputChange("profile.company", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="position">Position</Label>
                      <Input
                        id="position"
                        value={profileData.profile?.position || ""}
                        onChange={(e) => handleInputChange("profile.position", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience</Label>
                    <Textarea
                      id="experience"
                      placeholder="Describe your experience"
                      value={profileData.profile?.experience || ""}
                      onChange={(e) => handleInputChange("profile.experience", e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <Separator />
                  
                  {/* Address Information */}
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={profileData.profile?.address || ""}
                      onChange={(e) => handleInputChange("profile.address", e.target.value)}
                    />
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={profileData.profile?.city || ""}
                        onChange={(e) => handleInputChange("profile.city", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        value={profileData.profile?.state || ""}
                        onChange={(e) => handleInputChange("profile.state", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                      <Input
                        id="zipCode"
                        value={profileData.profile?.zipCode || ""}
                        onChange={(e) => handleInputChange("profile.zipCode", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={profileData.profile?.country || ""}
                      onChange={(e) => handleInputChange("profile.country", e.target.value)}
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleProfileSave}
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Security Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Manage your account security and authentication
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Password Change */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Change Password</h3>
                    <div className="grid gap-4 md:grid-cols-1">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) => handlePasswordInputChange("currentPassword", e.target.value)}
                            className={errors.currentPassword ? "border-red-500" : ""}
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
                        {errors.currentPassword && (
                          <p className="text-sm text-red-500">{errors.currentPassword}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) => handlePasswordInputChange("newPassword", e.target.value)}
                            className={errors.newPassword ? "border-red-500" : ""}
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
                        {errors.newPassword && (
                          <p className="text-sm text-red-500">{errors.newPassword}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) => handlePasswordInputChange("confirmPassword", e.target.value)}
                            className={errors.confirmPassword ? "border-red-500" : ""}
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
                        {errors.confirmPassword && (
                          <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handlePasswordChangeClick}
                      disabled={changePasswordMutation.isPending}
                    >
                      {changePasswordMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Key className="mr-2 h-4 w-4" />
                      )}
                      Change Password
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  {/* Two-Factor Authentication */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Switch
                        checked={user?.security?.twoFactorEnabled || false}
                        disabled
                      />
                    </div>
                    
                    {user?.security?.twoFactorEnabled ? (
                      <div className="flex items-center space-x-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Two-factor authentication is enabled</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-sm text-yellow-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Two-factor authentication is not enabled</span>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Login History */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Recent Login Activity</h3>
                    <div className="space-y-2">
                      {user?.security?.loginHistory?.slice(0, 5).map((login: { timestamp: string; ipAddress: string; userAgent: string; location?: string }, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-muted rounded-full">
                              <Lock className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{login.location || "Unknown Location"}</p>
                              <p className="text-xs text-muted-foreground">{login.ipAddress}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">{new Date(login.timestamp).toLocaleDateString()}</p>
                            <p className="text-xs text-muted-foreground">{new Date(login.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>Notification Preferences</span>
                  </CardTitle>
                  <CardDescription>
                    Choose how you want to receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch
                        checked={profileData.preferences?.emailNotifications || false}
                        onCheckedChange={(checked) => handleInputChange("preferences.emailNotifications", checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via SMS
                        </p>
                      </div>
                      <Switch
                        checked={profileData.preferences?.smsNotifications || false}
                        onCheckedChange={(checked) => handleInputChange("preferences.smsNotifications", checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Marketing Emails</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive marketing and promotional emails
                        </p>
                      </div>
                      <Switch
                        checked={profileData.preferences?.marketingEmails || false}
                        onCheckedChange={(checked) => handleInputChange("preferences.marketingEmails", checked)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleProfileSave}
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Account Preferences</span>
                  </CardTitle>
                  <CardDescription>
                    Customize your account settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={profileData.preferences?.language || "en"}
                        onValueChange={(value) => handleInputChange("preferences.language", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="it">Italian</SelectItem>
                          <SelectItem value="pt">Portuguese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={profileData.preferences?.timezone || "UTC"}
                        onValueChange={(value) => handleInputChange("preferences.timezone", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          <SelectItem value="Europe/London">London</SelectItem>
                          <SelectItem value="Europe/Paris">Paris</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="theme">Theme</Label>
                      <Select
                        value={profileData.preferences?.theme || "system"}
                        onValueChange={(value) => handleInputChange("preferences.theme", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleProfileSave}
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Preferences
                    </Button>
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
