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
  Settings, 
  Database, 
  Mail, 
  Shield, 
  Bell, 
  Globe, 
  Save, 
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Server,
  Key,
  Lock,
  Users,
  Calendar,
  DollarSign,
  FileText,
  Zap,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

// Interface for system settings
interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    siteUrl: string;
    timezone: string;
    language: string;
    maintenanceMode: boolean;
    maintenanceMessage: string;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    enableEmailNotifications: boolean;
    emailVerificationRequired: boolean;
  };
  security: {
    passwordMinLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    enableTwoFactor: boolean;
    enableAuditLogs: boolean;
  };
  notifications: {
    enableEmailNotifications: boolean;
    enableSmsNotifications: boolean;
    enablePushNotifications: boolean;
    notificationRetentionDays: number;
    enableSystemAlerts: boolean;
  };
  integrations: {
    enableGoogleAuth: boolean;
    googleClientId: string;
    googleClientSecret: string;
    enableStripe: boolean;
    stripePublishableKey: string;
    stripeSecretKey: string;
    enableAnalytics: boolean;
    analyticsTrackingId: string;
  };
  limits: {
    maxUsers: number;
    maxAgents: number;
    maxAdmins: number;
    maxServicesPerAgent: number;
    maxBookingsPerUser: number;
    maxFileSize: number;
    maxStoragePerUser: number;
  };
}

export default function SuperAdminSettings() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // State for active tab
  const [activeTab, setActiveTab] = useState("general");
  
  // State for settings
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      siteName: "Civix",
      siteDescription: "Professional service booking platform",
      siteUrl: "https://civix.com",
      timezone: "UTC",
      language: "en",
      maintenanceMode: false,
      maintenanceMessage: "We&apos;re currently performing maintenance. Please check back soon."
    },
    email: {
      smtpHost: "smtp.gmail.com",
      smtpPort: 587,
      smtpUser: "",
      smtpPassword: "",
      fromEmail: "noreply@civix.com",
      fromName: "Civix Support",
      enableEmailNotifications: true,
      emailVerificationRequired: true
    },
    security: {
      passwordMinLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      sessionTimeout: 24,
      maxLoginAttempts: 5,
      lockoutDuration: 30,
      enableTwoFactor: true,
      enableAuditLogs: true
    },
    notifications: {
      enableEmailNotifications: true,
      enableSmsNotifications: false,
      enablePushNotifications: true,
      notificationRetentionDays: 90,
      enableSystemAlerts: true
    },
    integrations: {
      enableGoogleAuth: false,
      googleClientId: "",
      googleClientSecret: "",
      enableStripe: false,
      stripePublishableKey: "",
      stripeSecretKey: "",
      enableAnalytics: false,
      analyticsTrackingId: ""
    },
    limits: {
      maxUsers: 10000,
      maxAgents: 1000,
      maxAdmins: 50,
      maxServicesPerAgent: 20,
      maxBookingsPerUser: 100,
      maxFileSize: 10,
      maxStoragePerUser: 100
    }
  });
  
  // Fetch settings
  const { data: settingsData, isLoading, error, refetch } = useQuery({
    queryKey: ["superAdminSettings"],
    queryFn: async () => {
      const res = await fetch("/api/super-admin/settings");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch settings");
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
    if (settingsData && typeof settingsData === 'object' && 'data' in settingsData && settingsData.data) {
      setSettings(settingsData.data);
    }
  }, [settingsData]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: SystemSettings) => {
      const res = await fetch("/api/super-admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      
      if (!res.ok) throw new Error("Failed to save settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superAdminSettings"] });
      toast({
        title: "Settings Saved",
        description: "System settings have been updated successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle input changes
  const handleInputChange = (section: keyof SystemSettings, field: string, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Handle save
  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  // Handle test email
  const handleTestEmail = async () => {
    try {
      const res = await fetch("/api/super-admin/settings/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "test@example.com",
          subject: "Test Email from Civix",
          message: "This is a test email to verify SMTP configuration."
        }),
      });
      
      if (!res.ok) throw new Error("Failed to send test email");
      
      toast({
        title: "Test Email Sent",
        description: "Test email has been sent successfully. Check your inbox.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to send test email. Please check your SMTP settings.",
        variant: "destructive",
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
            <CardTitle className="text-destructive">Error Loading Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error.message || "Failed to load settings. Please try again."}</p>
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

  return (
    <PageTransition>
      <div className="container p-6 md:p-10">
        <FadeIn delay={0.1}>
          <div className="flex justify-between items-center mb-8">
            <div>
              <Heading level="h1">System Settings</Heading>
              <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
            </div>
            <Button 
              onClick={handleSave}
              disabled={saveSettingsMutation.isPending}
            >
              {saveSettingsMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Settings
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="limits">Limits</TabsTrigger>
            </TabsList>
            
            {/* General Settings */}
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5" />
                    <span>General Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Configure basic system information and behavior
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="siteName">Site Name</Label>
                      <Input
                        id="siteName"
                        value={settings.general.siteName}
                        onChange={(e) => handleInputChange("general", "siteName", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="siteUrl">Site URL</Label>
                      <Input
                        id="siteUrl"
                        value={settings.general.siteUrl}
                        onChange={(e) => handleInputChange("general", "siteUrl", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={settings.general.timezone}
                        onValueChange={(value) => handleInputChange("general", "timezone", value)}
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
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={settings.general.language}
                        onValueChange={(value) => handleInputChange("general", "language", value)}
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
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="siteDescription">Site Description</Label>
                    <Textarea
                      id="siteDescription"
                      value={settings.general.siteDescription}
                      onChange={(e) => handleInputChange("general", "siteDescription", e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Maintenance Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable maintenance mode to restrict access to the system
                        </p>
                      </div>
                      <Switch
                        checked={settings.general.maintenanceMode}
                        onCheckedChange={(checked) => handleInputChange("general", "maintenanceMode", checked)}
                      />
                    </div>
                    
                    {settings.general.maintenanceMode && (
                      <div className="space-y-2">
                        <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                        <Textarea
                          id="maintenanceMessage"
                          value={settings.general.maintenanceMessage}
                          onChange={(e) => handleInputChange("general", "maintenanceMessage", e.target.value)}
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Email Settings */}
            <TabsContent value="email" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>Email Configuration</span>
                  </CardTitle>
                  <CardDescription>
                    Configure SMTP settings for email notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        value={settings.email.smtpHost}
                        onChange={(e) => handleInputChange("email", "smtpHost", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={settings.email.smtpPort}
                        onChange={(e) => handleInputChange("email", "smtpPort", parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="smtpUser">SMTP Username</Label>
                      <Input
                        id="smtpUser"
                        value={settings.email.smtpUser}
                        onChange={(e) => handleInputChange("email", "smtpUser", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="smtpPassword">SMTP Password</Label>
                      <Input
                        id="smtpPassword"
                        type="password"
                        value={settings.email.smtpPassword}
                        onChange={(e) => handleInputChange("email", "smtpPassword", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fromEmail">From Email</Label>
                      <Input
                        id="fromEmail"
                        type="email"
                        value={settings.email.fromEmail}
                        onChange={(e) => handleInputChange("email", "fromEmail", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fromName">From Name</Label>
                      <Input
                        id="fromName"
                        value={settings.email.fromName}
                        onChange={(e) => handleInputChange("email", "fromName", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Enable Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send email notifications for system events
                      </p>
                    </div>
                    <Switch
                      checked={settings.email.enableEmailNotifications}
                      onCheckedChange={(checked) => handleInputChange("email", "enableEmailNotifications", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Require Email Verification</Label>
                      <p className="text-sm text-muted-foreground">
                        Require users to verify their email address
                      </p>
                    </div>
                    <Switch
                      checked={settings.email.emailVerificationRequired}
                      onCheckedChange={(checked) => handleInputChange("email", "emailVerificationRequired", checked)}
                    />
                  </div>
                  
                  <Button variant="outline" onClick={handleTestEmail}>
                    <Mail className="mr-2 h-4 w-4" />
                    Test Email Configuration
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Security Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Configure security policies and authentication settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                      <Input
                        id="passwordMinLength"
                        type="number"
                        value={settings.security.passwordMinLength}
                        onChange={(e) => handleInputChange("security", "passwordMinLength", parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => handleInputChange("security", "sessionTimeout", parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                      <Input
                        id="maxLoginAttempts"
                        type="number"
                        value={settings.security.maxLoginAttempts}
                        onChange={(e) => handleInputChange("security", "maxLoginAttempts", parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
                      <Input
                        id="lockoutDuration"
                        type="number"
                        value={settings.security.lockoutDuration}
                        onChange={(e) => handleInputChange("security", "lockoutDuration", parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Require Uppercase</Label>
                        <p className="text-sm text-muted-foreground">
                          Passwords must contain at least one uppercase letter
                        </p>
                      </div>
                      <Switch
                        checked={settings.security.requireUppercase}
                        onCheckedChange={(checked) => handleInputChange("security", "requireUppercase", checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Require Lowercase</Label>
                        <p className="text-sm text-muted-foreground">
                          Passwords must contain at least one lowercase letter
                        </p>
                      </div>
                      <Switch
                        checked={settings.security.requireLowercase}
                        onCheckedChange={(checked) => handleInputChange("security", "requireLowercase", checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Require Numbers</Label>
                        <p className="text-sm text-muted-foreground">
                          Passwords must contain at least one number
                        </p>
                      </div>
                      <Switch
                        checked={settings.security.requireNumbers}
                        onCheckedChange={(checked) => handleInputChange("security", "requireNumbers", checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Require Special Characters</Label>
                        <p className="text-sm text-muted-foreground">
                          Passwords must contain at least one special character
                        </p>
                      </div>
                      <Switch
                        checked={settings.security.requireSpecialChars}
                        onCheckedChange={(checked) => handleInputChange("security", "requireSpecialChars", checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Enable Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow users to enable 2FA for additional security
                        </p>
                      </div>
                      <Switch
                        checked={settings.security.enableTwoFactor}
                        onCheckedChange={(checked) => handleInputChange("security", "enableTwoFactor", checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Enable Audit Logs</Label>
                        <p className="text-sm text-muted-foreground">
                          Log all system activities for security monitoring
                        </p>
                      </div>
                      <Switch
                        checked={settings.security.enableAuditLogs}
                        onCheckedChange={(checked) => handleInputChange("security", "enableAuditLogs", checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Settings */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>Notification Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Configure notification preferences and retention policies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Enable Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send notifications via email
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.enableEmailNotifications}
                        onCheckedChange={(checked) => handleInputChange("notifications", "enableEmailNotifications", checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Enable SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send notifications via SMS
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.enableSmsNotifications}
                        onCheckedChange={(checked) => handleInputChange("notifications", "enableSmsNotifications", checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Enable Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send push notifications to mobile devices
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.enablePushNotifications}
                        onCheckedChange={(checked) => handleInputChange("notifications", "enablePushNotifications", checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Enable System Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Send alerts for system events and issues
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.enableSystemAlerts}
                        onCheckedChange={(checked) => handleInputChange("notifications", "enableSystemAlerts", checked)}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="notificationRetentionDays">Notification Retention (days)</Label>
                    <Input
                      id="notificationRetentionDays"
                      type="number"
                      value={settings.notifications.notificationRetentionDays}
                      onChange={(e) => handleInputChange("notifications", "notificationRetentionDays", parseInt(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground">
                      How long to keep notification history
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Integrations Settings */}
            <TabsContent value="integrations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Third-Party Integrations</span>
                  </CardTitle>
                  <CardDescription>
                    Configure external service integrations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Google Auth */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Google Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow users to sign in with Google
                        </p>
                      </div>
                      <Switch
                        checked={settings.integrations.enableGoogleAuth}
                        onCheckedChange={(checked) => handleInputChange("integrations", "enableGoogleAuth", checked)}
                      />
                    </div>
                    
                    {settings.integrations.enableGoogleAuth && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="googleClientId">Google Client ID</Label>
                          <Input
                            id="googleClientId"
                            value={settings.integrations.googleClientId}
                            onChange={(e) => handleInputChange("integrations", "googleClientId", e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="googleClientSecret">Google Client Secret</Label>
                          <Input
                            id="googleClientSecret"
                            type="password"
                            value={settings.integrations.googleClientSecret}
                            onChange={(e) => handleInputChange("integrations", "googleClientSecret", e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Stripe */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Stripe Payment Processing</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable Stripe for payment processing
                        </p>
                      </div>
                      <Switch
                        checked={settings.integrations.enableStripe}
                        onCheckedChange={(checked) => handleInputChange("integrations", "enableStripe", checked)}
                      />
                    </div>
                    
                    {settings.integrations.enableStripe && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="stripePublishableKey">Stripe Publishable Key</Label>
                          <Input
                            id="stripePublishableKey"
                            value={settings.integrations.stripePublishableKey}
                            onChange={(e) => handleInputChange("integrations", "stripePublishableKey", e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
                          <Input
                            id="stripeSecretKey"
                            type="password"
                            value={settings.integrations.stripeSecretKey}
                            onChange={(e) => handleInputChange("integrations", "stripeSecretKey", e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Analytics */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Google Analytics</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable Google Analytics tracking
                        </p>
                      </div>
                      <Switch
                        checked={settings.integrations.enableAnalytics}
                        onCheckedChange={(checked) => handleInputChange("integrations", "enableAnalytics", checked)}
                      />
                    </div>
                    
                    {settings.integrations.enableAnalytics && (
                      <div className="space-y-2">
                        <Label htmlFor="analyticsTrackingId">Analytics Tracking ID</Label>
                        <Input
                          id="analyticsTrackingId"
                          value={settings.integrations.analyticsTrackingId}
                          onChange={(e) => handleInputChange("integrations", "analyticsTrackingId", e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Limits Settings */}
            <TabsContent value="limits" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>System Limits</span>
                  </CardTitle>
                  <CardDescription>
                    Configure system limits and quotas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="maxUsers">Max Users</Label>
                      <Input
                        id="maxUsers"
                        type="number"
                        value={settings.limits.maxUsers}
                        onChange={(e) => handleInputChange("limits", "maxUsers", parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxAgents">Max Agents</Label>
                      <Input
                        id="maxAgents"
                        type="number"
                        value={settings.limits.maxAgents}
                        onChange={(e) => handleInputChange("limits", "maxAgents", parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxAdmins">Max Admins</Label>
                      <Input
                        id="maxAdmins"
                        type="number"
                        value={settings.limits.maxAdmins}
                        onChange={(e) => handleInputChange("limits", "maxAdmins", parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxServicesPerAgent">Max Services per Agent</Label>
                      <Input
                        id="maxServicesPerAgent"
                        type="number"
                        value={settings.limits.maxServicesPerAgent}
                        onChange={(e) => handleInputChange("limits", "maxServicesPerAgent", parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxBookingsPerUser">Max Bookings per User</Label>
                      <Input
                        id="maxBookingsPerUser"
                        type="number"
                        value={settings.limits.maxBookingsPerUser}
                        onChange={(e) => handleInputChange("limits", "maxBookingsPerUser", parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                      <Input
                        id="maxFileSize"
                        type="number"
                        value={settings.limits.maxFileSize}
                        onChange={(e) => handleInputChange("limits", "maxFileSize", parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxStoragePerUser">Max Storage per User (MB)</Label>
                      <Input
                        id="maxStoragePerUser"
                        type="number"
                        value={settings.limits.maxStoragePerUser}
                        onChange={(e) => handleInputChange("limits", "maxStoragePerUser", parseInt(e.target.value))}
                      />
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
