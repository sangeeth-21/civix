"use client";

import { useState } from "react";
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PageTransition, FadeIn } from "@/components/page-transition";
import { Mail, Phone, MapPin, Loader2, CheckCircle } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";

// Form schema
const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters" }),
  message: z.string().min(10, { message: "Message must be at least 10 characters" }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Initialize form
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: ContactFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Send data to the API endpoint
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }
      
      toast({
        title: "Message sent",
        description: "Thank you for your message. We'll get back to you soon.",
      });
      
      setIsSuccess(true);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "There was a problem sending your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <PageTransition>
        <div className="container py-12 px-4 md:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <Heading level="h1" align="center">Contact Us</Heading>
              <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
                Have questions or need assistance? We&apos;re here to help.
              </p>
            </div>
          </FadeIn>

          <div className="grid gap-8 md:grid-cols-2">
            <FadeIn delay={0.1}>
              <Card>
                <CardHeader>
                  <CardTitle>Send us a message</CardTitle>
                </CardHeader>
                <CardContent>
                  {isSuccess ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <CheckCircle className="h-12 w-12 text-primary mb-4" />
                      <h3 className="text-xl font-medium mb-2">Message Sent!</h3>
                      <p className="text-muted-foreground mb-6">
                        Thank you for reaching out. We&apos;ll get back to you as soon as possible.
                      </p>
                      <Button onClick={() => setIsSuccess(false)}>
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your name" {...field} disabled={isSubmitting} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="Your email address" 
                                  {...field} 
                                  disabled={isSubmitting} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subject</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Subject of your message" 
                                  {...field} 
                                  disabled={isSubmitting} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Message</FormLabel>
                              <FormControl>
                                <textarea
                                  className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                                  placeholder="Your message"
                                  {...field}
                                  disabled={isSubmitting}
                                ></textarea>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            "Send Message"
                          )}
                        </Button>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.2}>
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Email Us</p>
                      <a 
                        href="mailto:support@civix.com"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        support@civix.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Call Us</p>
                      <a 
                        href="tel:+1-800-123-4567"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        +1 (800) 123-4567
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Visit Us</p>
                      <p className="text-muted-foreground">
                        123 Service Avenue<br />
                        Tech District<br />
                        San Francisco, CA 94103
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="font-medium mb-2">Business Hours</p>
                    <p className="text-muted-foreground">
                      Monday - Friday: 9:00 AM - 6:00 PM<br />
                      Saturday: 10:00 AM - 4:00 PM<br />
                      Sunday: Closed
                    </p>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>
      </PageTransition>
    </MainLayout>
  );
} 
