"use client";

import { useState } from "react";
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
  Shield, 
  Mail, 
  Database, 
  Globe, 
  Bell, 
  Loader2,
  Save,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import React from "react";

// Interface for system settings
interface SystemSettings {
  maintenance: {
    enabled: boolean;
    message: string;
    allowedIPs: string[];
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    fromEmail: string;
    fromName: string;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireTwoFactor: boolean;
    rateLimitEnabled: boolean;
    rateLimitRequests: number;
    rateLimitWindow: number;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    adminAlerts: boolean;
  };
  integrations: {
    googleAnalytics: string;
    facebookPixel: string;
    stripeEnabled: boolean;
    stripeKey: string;
  };
}

export default function AdminSettings() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // State for settings
  const [maintenanceSettings, setMaintenanceSettings] = useState({
    enabled: false,
    message: "",
    allowedIPs: "",
  });
  
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    fromEmail: "",
    fromName: "",
  });
  
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireTwoFactor: false,
    rateLimitEnabled: true,
    rateLimitRequests: 100,
    rateLimitWindow: 15,
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    adminAlerts: true,
  });
  
  const [integrationSettings, setIntegrationSettings] = useState({
    googleAnalytics: "",
    facebookPixel: "",
    stripeEnabled: false,
    stripeKey: "",
  });
  
  // State for UI
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [showStripeKey, setShowStripeKey] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Fetch system settings
  const { data: settings, isLoading, error, refetch } = useQuery({
    queryKey: ["adminSettings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings");
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
  
  // Update settings data when query succeeds
  React.useEffect(() => {
    if (settings?.data) {
      const systemSettings = settings.data as SystemSettings;
      
      setMaintenanceSettings({
        enabled: systemSettings.maintenance?.enabled ?? false,
        message: systemSettings.maintenance?.message ?? "",
        allowedIPs: systemSettings.maintenance?.allowedIPs?.join(", ") ?? "",
      });
      
      setEmailSettings({
        smtpHost: systemSettings.email?.smtpHost ?? "",
        smtpPort: systemSettings.email?.smtpPort ?? 587,
        smtpUser: systemSettings.email?.smtpUser ?? "",
        smtpPass: systemSettings.email?.smtpPass ?? "",
        fromEmail: systemSettings.email?.fromEmail ?? "",
        fromName: systemSettings.email?.fromName ?? "",
      });
      
      setSecuritySettings({
        sessionTimeout: systemSettings.security?.sessionTimeout ?? 24,
        maxLoginAttempts: systemSettings.security?.maxLoginAttempts ?? 5,
        passwordMinLength: systemSettings.security?.passwordMinLength ?? 8,
        requireTwoFactor: systemSettings.security?.requireTwoFactor ?? false,
        rateLimitEnabled: systemSettings.security?.rateLimitEnabled ?? true,
        rateLimitRequests: systemSettings.security?.rateLimitRequests ?? 100,
        rateLimitWindow: systemSettings.security?.rateLimitWindow ?? 15,
      });
      
      setNotificationSettings({
        emailNotifications: systemSettings.notifications?.emailNotifications ?? true,
        pushNotifications: systemSettings.notifications?.pushNotifications ?? true,
        smsNotifications: systemSettings.notifications?.smsNotifications ?? false,
        adminAlerts: systemSettings.notifications?.adminAlerts ?? true,
      });
      
      setIntegrationSettings({
        googleAnalytics: systemSettings.integrations?.googleAnalytics ?? "",
        facebookPixel: systemSettings.integrations?.facebookPixel ?? "",
        stripeEnabled: systemSettings.integrations?.stripeEnabled ?? false,
        stripeKey: systemSettings.integrations?.stripeKey ?? "",
      });
    }
  }, [settings]);
  
  // Update maintenance settings mutation
  const updateMaintenanceMutation = useMutation<unknown, Error, { enabled: boolean; message: string; allowedIPs: string }>({
    mutationFn: async (data: { enabled: boolean; message: string; allowedIPs: string }) => {
      const res = await fetch("/api/admin/settings/maintenance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          allowedIPs: data.allowedIPs.split(",").map((ip: string) => ip.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error("Failed to update maintenance settings");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Maintenance Settings Updated",
        description: "Maintenance settings have been updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["adminSettings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update email settings mutation
  const updateEmailMutation = useMutation<unknown, Error, SystemSettings['email']>({
    mutationFn: async (data: SystemSettings['email']) => {
      const res = await fetch("/api/admin/settings/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update email settings");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Settings Updated",
        description: "Email settings have been updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["adminSettings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update security settings mutation
  const updateSecurityMutation = useMutation<unknown, Error, SystemSettings['security']>({
    mutationFn: async (data: SystemSettings['security']) => {
      const res = await fetch("/api/admin/settings/security", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update security settings");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Security Settings Updated",
        description: "Security settings have been updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["adminSettings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update notification settings mutation
  const updateNotificationMutation = useMutation<unknown, Error, SystemSettings['notifications']>({
    mutationFn: async (data: SystemSettings['notifications']) => {
      const res = await fetch("/api/admin/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update notification settings");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Notification Settings Updated",
        description: "Notification settings have been updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["adminSettings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update integration settings mutation
  const updateIntegrationMutation = useMutation<unknown, Error, SystemSettings['integrations']>({
    mutationFn: async (data: SystemSettings['integrations']) => {
      const res = await fetch("/api/admin/settings/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update integration settings");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Integration Settings Updated",
        description: "Integration settings have been updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["adminSettings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle maintenance settings update
  const handleMaintenanceUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateMaintenanceMutation.mutateAsync(maintenanceSettings);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle email settings update
  const handleEmailUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateEmailMutation.mutateAsync(emailSettings);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle security settings update
  const handleSecurityUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateSecurityMutation.mutateAsync(securitySettings);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle notification settings update
  const handleNotificationUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateNotificationMutation.mutateAsync(notificationSettings);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle integration settings update
  const handleIntegrationUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateIntegrationMutation.mutateAsync(integrationSettings);
    } finally {
      setIsUpdating(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container py-10">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error.message || "Failed to load system settings. Please try again later."}</p>
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
      <div className="container py-10">
        <FadeIn>
          <div className="mb-8">
            <Heading level="h1" className="mb-2">System Settings</Heading>
            <p className="text-muted-foreground">
              Configure system-wide settings and preferences
            </p>
          </div>
        </FadeIn>
        
        <FadeIn delay={0.1}>
          <Tabs defaultValue="maintenance" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="maintenance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Mode</CardTitle>
                  <CardDescription>
                    Enable maintenance mode to temporarily disable the platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {maintenanceSettings.enabled && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Maintenance mode is currently enabled. Users will see the maintenance message.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Enable Maintenance Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Temporarily disable the platform for maintenance
                      </p>
                    </div>
                    <Switch
                      checked={maintenanceSettings.enabled}
                      onCheckedChange={(checked) => 
                        setMaintenanceSettings(prev => ({ ...prev, enabled: checked }))
                      }
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                    <Textarea
                      id="maintenanceMessage"
                      value={maintenanceSettings.message}
                      onChange={(e) => setMaintenanceSettings(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Enter maintenance message to display to users"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="allowedIPs">Allowed IP Addresses</Label>
                    <Input
                      id="allowedIPs"
                      value={maintenanceSettings.allowedIPs}
                      onChange={(e) => setMaintenanceSettings(prev => ({ ...prev, allowedIPs: e.target.value }))}
                      placeholder="Comma-separated list of IP addresses (e.g., 192.168.1.1, 10.0.0.1)"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      These IP addresses will still have access during maintenance mode
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleMaintenanceUpdate}
                    disabled={updateMaintenanceMutation.isPending || isUpdating}
                    className="w-full"
                  >
                    {updateMaintenanceMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Save className="mr-2 h-4 w-4" />
                    Update Maintenance Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="email" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Email Configuration</CardTitle>
                  <CardDescription>
                    Configure SMTP settings for sending emails
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        value={emailSettings.smtpHost}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={emailSettings.smtpPort}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPort: parseInt(e.target.value) }))}
                        placeholder="587"
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="smtpUser">SMTP Username</Label>
                      <Input
                        id="smtpUser"
                        value={emailSettings.smtpUser}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
                        placeholder="your-email@gmail.com"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="smtpPass">SMTP Password</Label>
                      <div className="relative">
                        <Input
                          id="smtpPass"
                          type={showSmtpPassword ? "text" : "password"}
                          value={emailSettings.smtpPass}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPass: e.target.value }))}
                          placeholder="Enter SMTP password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                        >
                          {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="fromEmail">From Email</Label>
                      <Input
                        id="fromEmail"
                        type="email"
                        value={emailSettings.fromEmail}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                        placeholder="noreply@yourdomain.com"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="fromName">From Name</Label>
                      <Input
                        id="fromName"
                        value={emailSettings.fromName}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, fromName: e.target.value }))}
                        placeholder="Your Company Name"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleEmailUpdate}
                    disabled={updateEmailMutation.isPending || isUpdating}
                    className="w-full"
                  >
                    {updateEmailMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Mail className="mr-2 h-4 w-4" />
                    Update Email Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Configure security and authentication settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                        min="1"
                        max="168"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                      <Input
                        id="maxLoginAttempts"
                        type="number"
                        value={securitySettings.maxLoginAttempts}
                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                        min="1"
                        max="10"
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                      <Input
                        id="passwordMinLength"
                        type="number"
                        value={securitySettings.passwordMinLength}
                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) }))}
                        min="6"
                        max="50"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Require Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">
                          Force 2FA for all users
                        </p>
                      </div>
                      <Switch
                        checked={securitySettings.requireTwoFactor}
                        onCheckedChange={(checked) => 
                          setSecuritySettings(prev => ({ ...prev, requireTwoFactor: checked }))
                        }
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Enable Rate Limiting</p>
                        <p className="text-sm text-muted-foreground">
                          Limit API requests per IP address
                        </p>
                      </div>
                      <Switch
                        checked={securitySettings.rateLimitEnabled}
                        onCheckedChange={(checked) => 
                          setSecuritySettings(prev => ({ ...prev, rateLimitEnabled: checked }))
                        }
                      />
                    </div>
                    
                    {securitySettings.rateLimitEnabled && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="rateLimitRequests">Max Requests</Label>
                          <Input
                            id="rateLimitRequests"
                            type="number"
                            value={securitySettings.rateLimitRequests}
                            onChange={(e) => setSecuritySettings(prev => ({ ...prev, rateLimitRequests: parseInt(e.target.value) }))}
                            min="10"
                            max="1000"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="rateLimitWindow">Time Window (minutes)</Label>
                          <Input
                            id="rateLimitWindow"
                            type="number"
                            value={securitySettings.rateLimitWindow}
                            onChange={(e) => setSecuritySettings(prev => ({ ...prev, rateLimitWindow: parseInt(e.target.value) }))}
                            min="1"
                            max="60"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={handleSecurityUpdate}
                    disabled={updateSecurityMutation.isPending || isUpdating}
                    className="w-full"
                  >
                    {updateSecurityMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Shield className="mr-2 h-4 w-4" />
                    Update Security Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Configure system-wide notification preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          Send notifications via email
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
                      <div>
                        <p className="text-sm font-medium">Push Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          Send browser push notifications
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
                      <div>
                        <p className="text-sm font-medium">SMS Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          Send notifications via SMS
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
                      <div>
                        <p className="text-sm font-medium">Admin Alerts</p>
                        <p className="text-sm text-muted-foreground">
                          Send critical alerts to administrators
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.adminAlerts}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, adminAlerts: checked }))
                        }
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleNotificationUpdate}
                    disabled={updateNotificationMutation.isPending || isUpdating}
                    className="w-full"
                  >
                    {updateNotificationMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Bell className="mr-2 h-4 w-4" />
                    Update Notification Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="integrations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Third-Party Integrations</CardTitle>
                  <CardDescription>
                    Configure external service integrations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="googleAnalytics">Google Analytics ID</Label>
                    <Input
                      id="googleAnalytics"
                      value={integrationSettings.googleAnalytics}
                      onChange={(e) => setIntegrationSettings(prev => ({ ...prev, googleAnalytics: e.target.value }))}
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="facebookPixel">Facebook Pixel ID</Label>
                    <Input
                      id="facebookPixel"
                      value={integrationSettings.facebookPixel}
                      onChange={(e) => setIntegrationSettings(prev => ({ ...prev, facebookPixel: e.target.value }))}
                      placeholder="XXXXXXXXXX"
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Enable Stripe Payments</p>
                        <p className="text-sm text-muted-foreground">
                          Enable Stripe payment processing
                        </p>
                      </div>
                      <Switch
                        checked={integrationSettings.stripeEnabled}
                        onCheckedChange={(checked) => 
                          setIntegrationSettings(prev => ({ ...prev, stripeEnabled: checked }))
                        }
                      />
                    </div>
                    
                    {integrationSettings.stripeEnabled && (
                      <div>
                        <Label htmlFor="stripeKey">Stripe Secret Key</Label>
                        <div className="relative">
                          <Input
                            id="stripeKey"
                            type={showStripeKey ? "text" : "password"}
                            value={integrationSettings.stripeKey}
                            onChange={(e) => setIntegrationSettings(prev => ({ ...prev, stripeKey: e.target.value }))}
                            placeholder="sk_test_..."
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowStripeKey(!showStripeKey)}
                          >
                            {showStripeKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={handleIntegrationUpdate}
                    disabled={updateIntegrationMutation.isPending || isUpdating}
                    className="w-full"
                  >
                    {updateIntegrationMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Globe className="mr-2 h-4 w-4" />
                    Update Integration Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </FadeIn>
      </div>
    </PageTransition>
  );
} 
