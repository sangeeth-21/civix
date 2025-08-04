"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PageTransition, FadeIn } from "@/components/page-transition";
import { Heading } from "@/components/ui/heading";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Upload, Check, Save, Camera, User, Mail, Phone, MapPin, Award, Star, Calendar } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User as UserType } from "@/types";

// Define schemas for forms
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
});

const skillsSchema = z.object({
  skills: z.array(z.string()).optional(),
  specializations: z.array(z.string()).optional(),
  experience: z.number().min(0, "Experience must be a positive number").optional(),
  certifications: z.array(z.string()).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type SkillsFormValues = z.infer<typeof skillsSchema>;

// Specializations options for agents
const SPECIALIZATION_OPTIONS = [
  "Home Services",
  "Plumbing",
  "Electrical",
  "Cleaning",
  "Landscaping",
  "Interior Design",
  "Pest Control",
  "Tutoring",
  "Health & Wellness",
  "Technology Support",
  "Legal Services",
  "Financial Services",
];

// Interface for agent profile data
interface AgentProfile {
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
  skills?: string[];
  specializations?: string[];
  experience?: number;
  certifications?: string[];
  stats?: {
    totalBookings: number;
    completedBookings: number;
    averageRating: number;
    totalEarnings: number;
  };
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

export default function AgentProfile() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [profileTab, setProfileTab] = useState("general");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Get profile data with React Query
  const { data: profileData, isLoading, error, refetch } = useQuery<AgentProfile, Error>({
    queryKey: ["agentProfile"],
    queryFn: async (): Promise<AgentProfile> => {
      const res = await fetch("/api/users/profile");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch profile");
      }
      const data = await res.json();
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
  
  // Profile form setup
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      bio: "",
    },
    mode: "onChange",
  });
  
  // Skills form setup
  const skillsForm = useForm<SkillsFormValues>({
    resolver: zodResolver(skillsSchema),
    defaultValues: {
      skills: [],
      specializations: [],
      experience: 0,
      certifications: [],
    },
    mode: "onChange",
  });
  
  // Update form values when profile data is loaded
  useEffect(() => {
    if (profileData) {
      profileForm.reset({
        name: profileData.name || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
        address: profileData.address || "",
        bio: profileData.bio || "",
      });
      
      skillsForm.reset({
        skills: profileData.skills || [],
        specializations: profileData.specializations || [],
        experience: profileData.experience || 0,
        certifications: profileData.certifications || [],
      });
    }
  }, [profileData, profileForm, skillsForm]);
  
  // Update profile mutation
  const updateProfileMutation = useMutation<AgentProfile, Error, Partial<AgentProfile>>({
    mutationFn: async (data: Partial<AgentProfile>) => {
      const res = await fetch("/api/users/profile", {
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
      queryClient.invalidateQueries({ queryKey: ["agentProfile"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update skills mutation
  const updateSkillsMutation = useMutation<AgentProfile, Error, SkillsFormValues>({
    mutationFn: async (data: SkillsFormValues) => {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) throw new Error("Failed to update skills");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Skills Updated",
        description: "Your professional information has been updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["agentProfile"] });
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
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  // Handle skills update
  const onSkillsSubmit = (data: SkillsFormValues) => {
    updateSkillsMutation.mutate(data);
  };
  
  // Handle profile photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type and size
    if (!file.type.includes("image")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image should be less than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setUploadingPhoto(true);
      
      const formData = new FormData();
      formData.append("profileImage", file);
      
      // This API endpoint would need to be implemented
      const res = await fetch("/api/users/profile/photo", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) throw new Error("Failed to upload photo");
      
      const data = await res.json();
      
      toast({
        title: "Photo Uploaded",
        description: "Your profile photo has been updated.",
        variant: "default",
      });
      
      queryClient.invalidateQueries({ queryKey: ["agentProfile"] });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload photo",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
    }
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
              <Button onClick={() => router.push('/login?callbackUrl=/agent/profile')}>
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
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>
                {error.message || "Failed to load profile. Please try again."}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => refetch()} variant="outline">
                Retry
              </Button>
            </CardFooter>
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

  const userInitials = getInitials(profileData?.name || session.user.name);

  return (
    <PageTransition>
      <div className="container py-12 px-4 md:px-6 max-w-5xl">
        <FadeIn>
          <div className="flex justify-between items-center mb-8">
            <div>
              <Heading level="h1">Agent Profile</Heading>
              <p className="text-muted-foreground">Manage your professional profile and services</p>
            </div>
            <Badge variant="outline" className="flex items-center space-x-1">
              <Award className="h-3 w-3" />
              <span>Professional Agent</span>
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Agent Info Card */}
            <Card className="md:col-span-1">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={session.user.image || ""} alt={profileData?.name || session.user.name || "Agent"} />
                    <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
                <h2 className="text-xl font-semibold">{profileData?.name || session.user.name}</h2>
                <p className="text-muted-foreground">{profileData?.email || session.user.email}</p>
                
                {profileData?.stats && (
                  <div className="w-full mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Total Bookings:</span>
                      <span className="font-medium">{profileData.stats.totalBookings}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Completed:</span>
                      <span className="font-medium">{profileData.stats.completedBookings}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Rating:</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{profileData.stats.averageRating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="w-full mt-6 space-y-4">
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-primary" />
                    <span>Role: {profileData?.role || session.user.role || "Agent"}</span>
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
                  
                  {profileData?.address && (
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-primary" />
                      <span>{profileData.address}</span>
                    </div>
                  )}
                  
                  <Separator />

                  <p className="text-sm text-muted-foreground">
                    Member since {
                      profileData?.createdAt 
                        ? new Date(profileData.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long' 
                          })
                        : "N/A"
                    }
                  </p>
                  
                  {profileData?.lastLogin && (
                    <p className="text-sm text-muted-foreground">
                      Last login: {new Date(profileData.lastLogin).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Profile Forms */}
            <div className="md:col-span-2">
              <Tabs value={profileTab} onValueChange={setProfileTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="general">General Information</TabsTrigger>
                  <TabsTrigger value="professional">Professional Details</TabsTrigger>
                </TabsList>
                
                {/* General Information Tab */}
                <TabsContent value="general" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>
                        Update your basic contact and personal information
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={profileForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Full Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter your full name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={profileForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email Address</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter your email" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={profileForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your phone number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Enter your address" 
                                    rows={3}
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="bio"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bio</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Tell clients about yourself and your services" 
                                    rows={4}
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  This will be visible to potential clients
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
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
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Professional Details Tab */}
                <TabsContent value="professional" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Professional Information</CardTitle>
                      <CardDescription>
                        Update your skills, specializations, and professional details
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...skillsForm}>
                        <form onSubmit={skillsForm.handleSubmit(onSkillsSubmit)} className="space-y-4">
                          <FormField
                            control={skillsForm.control}
                            name="experience"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Years of Experience</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="Enter years of experience"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={skillsForm.control}
                            name="specializations"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Specializations</FormLabel>
                                <FormControl>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {SPECIALIZATION_OPTIONS.map((spec) => (
                                      <div key={spec} className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          id={spec}
                                          checked={field.value?.includes(spec) || false}
                                          onChange={(e) => {
                                            const current = field.value || [];
                                            if (e.target.checked) {
                                              field.onChange([...current, spec]);
                                            } else {
                                              field.onChange(current.filter(s => s !== spec));
                                            }
                                          }}
                                          className="rounded"
                                        />
                                        <Label htmlFor={spec} className="text-sm">{spec}</Label>
                                      </div>
                                    ))}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={skillsForm.control}
                            name="skills"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Skills</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Enter your skills (comma-separated)" 
                                    rows={3}
                                    {...field}
                                    value={field.value?.join(', ') || ''}
                                    onChange={(e) => {
                                      const skills = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                                      field.onChange(skills);
                                    }}
                                  />
                                </FormControl>
                                <FormDescription>
                                  List your key skills and competencies
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={skillsForm.control}
                            name="certifications"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Certifications</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Enter your certifications (comma-separated)" 
                                    rows={3}
                                    {...field}
                                    value={field.value?.join(', ') || ''}
                                    onChange={(e) => {
                                      const certs = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                                      field.onChange(certs);
                                    }}
                                  />
                                </FormControl>
                                <FormDescription>
                                  List your professional certifications and qualifications
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex justify-end">
                            <Button 
                              type="submit" 
                              disabled={updateSkillsMutation.isPending}
                              className="flex items-center space-x-2"
                            >
                              {updateSkillsMutation.isPending ? (
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
              </Tabs>
            </div>
          </div>
        </FadeIn>
      </div>
    </PageTransition>
  );
} 
