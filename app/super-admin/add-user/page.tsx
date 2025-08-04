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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { 
  UserPlus, 
  Users, 
  Shield, 
  User, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ArrowLeft,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Award,
  Settings,
  Eye,
  EyeOff,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Interface for user creation data
interface UserCreationData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  role: "USER" | "AGENT" | "ADMIN" | "SUPER_ADMIN";
  isActive: boolean;
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
  };
}

// Interface for role permissions
interface RolePermissions {
  role: string;
  title: string;
  description: string;
  permissions: string[];
  icon: React.ReactNode;
  color: string;
}

const rolePermissions: RolePermissions[] = [
  {
    role: "USER",
    title: "Regular User",
    description: "Can book services, manage their profile, and view their bookings",
    permissions: [
      "View and book services",
      "Manage personal profile",
      "View booking history",
      "Contact support",
      "Rate and review services"
    ],
    icon: <User className="h-6 w-6" />,
    color: "bg-blue-500"
  },
  {
    role: "AGENT",
    title: "Service Agent",
    description: "Can provide services, manage bookings, and interact with users",
    permissions: [
      "Create and manage services",
      "View assigned bookings",
      "Update booking status",
      "Communicate with users",
      "View earnings and reports"
    ],
    icon: <Award className="h-6 w-6" />,
    color: "bg-green-500"
  },
  {
    role: "ADMIN",
    title: "Administrator",
    description: "Can manage users, agents, and system operations",
    permissions: [
      "Manage all users and agents",
      "View all bookings and services",
      "Generate reports",
      "Manage system settings",
      "Handle support tickets"
    ],
    icon: <Shield className="h-6 w-6" />,
    color: "bg-purple-500"
  },
  {
    role: "SUPER_ADMIN",
    title: "Super Administrator",
    description: "Full system access and control",
    permissions: [
      "All admin permissions",
      "Manage all admins",
      "System-wide analytics",
      "Email log management",
      "Complete system control"
    ],
    icon: <Settings className="h-6 w-6" />,
    color: "bg-red-500"
  }
];

export default function SuperAdminAddUser() {
  const router = useRouter();
  
  // State for wizard steps
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // State for user data
  const [userData, setUserData] = useState<UserCreationData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "USER",
    isActive: true,
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
      timezone: "UTC"
    }
  });
  
  // State for validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: UserCreationData) => {
      const res = await fetch("/api/super-admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create user");
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "User Created Successfully",
        description: `User ${userData.name} has been created with role ${userData.role}.`,
        variant: "default",
      });
      
      // Reset form
      setUserData({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role: "USER",
        isActive: true,
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
          timezone: "UTC"
        }
      });
      setCurrentStep(1);
      setErrors({});
    },
    onError: (error: Error) => {
      toast({
        title: "User Creation Failed",
        description: error.message || "Failed to create user. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Validation functions
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!userData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!userData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!userData.password) {
      newErrors.password = "Password is required";
    } else if (userData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    
    if (userData.password !== userData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!userData.role) {
      newErrors.role = "Role is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle next step
  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) {
      return;
    }
    if (currentStep === 2 && !validateStep2()) {
      return;
    }
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (validateStep1() && validateStep2()) {
      createUserMutation.mutate(userData);
    }
  };
  
  // Handle input changes
  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.includes('.')) {
      const [section, key] = field.split('.');
      setUserData(prev => ({
        ...prev,
        [section]: {
          ...(prev[section as keyof typeof prev] as Record<string, unknown>),
          [key]: value
        }
      }));
    } else {
      setUserData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };
  
  const selectedRole = rolePermissions.find(rp => rp.role === userData.role);
  
  return (
    <PageTransition>
      <div className="container p-6 md:p-10">
        <FadeIn delay={0.1}>
          <div className="flex items-center space-x-4 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <Heading level="h1">Add New User</Heading>
              <p className="text-muted-foreground">Create a new user account with role assignment</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    currentStep >= step 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {currentStep > step ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-medium">{step}</span>
                    )}
                  </div>
                  {step < 4 && (
                    <div className={`w-16 h-0.5 mx-2 ${
                      currentStep > step ? "bg-primary" : "bg-muted"
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>Basic Info</span>
              <span>Role & Permissions</span>
              <span>Profile Details</span>
              <span>Review & Create</span>
            </div>
          </div>

          {/* Step Content */}
          <Card>
            <CardHeader>
              <CardTitle>
                {currentStep === 1 && "Basic Information"}
                {currentStep === 2 && "Role & Permissions"}
                {currentStep === 3 && "Profile Details"}
                {currentStep === 4 && "Review & Create"}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && "Enter the user's basic account information"}
                {currentStep === 2 && "Select the user's role and permissions"}
                {currentStep === 3 && "Add additional profile information (optional)"}
                {currentStep === 4 && "Review all information before creating the user"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="Enter full name"
                        value={userData.name}
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
                        placeholder="Enter email address"
                        value={userData.email}
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
                        placeholder="Enter phone number"
                        value={userData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="isActive">Account Status</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          checked={userData.isActive}
                          onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                        />
                        <Label htmlFor="isActive">
                          {userData.isActive ? "Active" : "Inactive"}
                        </Label>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter password"
                          value={userData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          className={errors.password ? "border-red-500" : ""}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-red-500">{errors.password}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm password"
                          value={userData.confirmPassword}
                          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
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
                </div>
              )}

              {/* Step 2: Role & Permissions */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="role">Select Role *</Label>
                    <Select
                      value={userData.role}
                      onValueChange={(value) => handleInputChange("role", value)}
                    >
                      <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {rolePermissions.map((role) => (
                          <SelectItem key={role.role} value={role.role}>
                            <div className="flex items-center space-x-2">
                              <div className={`p-1 rounded ${role.color}`}>
                                {role.icon}
                              </div>
                              <span>{role.title}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.role && (
                      <p className="text-sm text-red-500">{errors.role}</p>
                    )}
                  </div>
                  
                  {selectedRole && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center space-x-2">
                          <div className={`p-2 rounded ${selectedRole.color}`}>
                            {selectedRole.icon}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{selectedRole.title}</CardTitle>
                            <CardDescription>{selectedRole.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Permissions:</Label>
                          <ul className="space-y-1">
                            {selectedRole.permissions.map((permission, index) => (
                              <li key={index} className="flex items-center space-x-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>{permission}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Step 3: Profile Details */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell us about yourself"
                        value={userData.profile.bio}
                        onChange={(e) => handleInputChange("profile.bio", e.target.value)}
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={userData.profile.dateOfBirth}
                        onChange={(e) => handleInputChange("profile.dateOfBirth", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        placeholder="Enter company name"
                        value={userData.profile.company}
                        onChange={(e) => handleInputChange("profile.company", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="position">Position</Label>
                      <Input
                        id="position"
                        placeholder="Enter job position"
                        value={userData.profile.position}
                        onChange={(e) => handleInputChange("profile.position", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="Enter street address"
                      value={userData.profile.address}
                      onChange={(e) => handleInputChange("profile.address", e.target.value)}
                    />
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="Enter city"
                        value={userData.profile.city}
                        onChange={(e) => handleInputChange("profile.city", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        placeholder="Enter state"
                        value={userData.profile.state}
                        onChange={(e) => handleInputChange("profile.state", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                      <Input
                        id="zipCode"
                        placeholder="Enter ZIP code"
                        value={userData.profile.zipCode}
                        onChange={(e) => handleInputChange("profile.zipCode", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      placeholder="Enter country"
                      value={userData.profile.country}
                      onChange={(e) => handleInputChange("profile.country", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Review & Create */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Basic Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Name</Label>
                          <p className="text-sm">{userData.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Email</Label>
                          <p className="text-sm">{userData.email}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Phone</Label>
                          <p className="text-sm">{userData.phone || "Not provided"}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Status</Label>
                          <Badge variant={userData.isActive ? "default" : "secondary"}>
                            {userData.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Role & Permissions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedRole && (
                          <div className="flex items-center space-x-2">
                            <div className={`p-2 rounded ${selectedRole.color}`}>
                              {selectedRole.icon}
                            </div>
                            <div>
                              <p className="font-medium">{selectedRole.title}</p>
                              <p className="text-sm text-muted-foreground">{selectedRole.description}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  {(userData.profile.bio || userData.profile.company || userData.profile.address) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Profile Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {userData.profile.bio && (
                          <div>
                            <Label className="text-sm font-medium">Bio</Label>
                            <p className="text-sm">{userData.profile.bio}</p>
                          </div>
                        )}
                        {userData.profile.company && (
                          <div>
                            <Label className="text-sm font-medium">Company</Label>
                            <p className="text-sm">{userData.profile.company}</p>
                          </div>
                        )}
                        {userData.profile.position && (
                          <div>
                            <Label className="text-sm font-medium">Position</Label>
                            <p className="text-sm">{userData.profile.position}</p>
                          </div>
                        )}
                        {userData.profile.address && (
                          <div>
                            <Label className="text-sm font-medium">Address</Label>
                            <p className="text-sm">
                              {userData.profile.address}
                              {userData.profile.city && `, ${userData.profile.city}`}
                              {userData.profile.state && `, ${userData.profile.state}`}
                              {userData.profile.zipCode && ` ${userData.profile.zipCode}`}
                              {userData.profile.country && `, ${userData.profile.country}`}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex space-x-2">
                  {currentStep < 4 ? (
                    <Button onClick={handleNext}>
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleSubmit}
                      disabled={createUserMutation.isPending}
                    >
                      {createUserMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="mr-2 h-4 w-4" />
                      )}
                      Create User
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </PageTransition>
  );
} 
