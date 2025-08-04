"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import {
  Users,
  Award,
  Target,
  Lightbulb,
  Heart,
  Shield,
  CheckCircle2,
  ArrowRight,
  Star,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Linkedin,
  Twitter,
  Instagram,
  Globe,
  Zap,
  TrendingUp,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";

// Team data
const teamMembers = [
  {
    name: "Sarah Johnson",
    role: "CEO & Founder",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    bio: "Former tech executive with 15+ years experience in service platforms",
    linkedin: "#",
    twitter: "#"
  },
  {
    name: "Michael Chen",
    role: "CTO",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    bio: "Engineering leader passionate about scalable solutions and user experience",
    linkedin: "#",
    twitter: "#"
  },
  {
    name: "Emily Rodriguez",
    role: "Head of Operations",
    image: "https://images.unsplash.com/photo-1614644147724-2d4785d69962?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    bio: "Operations expert focused on delivering exceptional customer experiences",
    linkedin: "#",
    twitter: "#"
  },
  {
    name: "David Kim",
    role: "Head of Design",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    bio: "Design leader creating intuitive and beautiful user experiences",
    linkedin: "#",
    twitter: "#"
  }
];

// Company timeline
const timeline = [
  {
    year: "2023",
    title: "Founded",
    description: "Civix was born from a vision to revolutionize service management"
  },
  {
    year: "2023",
    title: "First 100 Users",
    description: "Reached our first milestone with 100 active service providers"
  },
  {
    year: "2024",
    title: "Series A Funding",
    description: "Secured $5M in funding to scale our platform nationwide"
  },
  {
    year: "2024",
    title: "10K+ Users",
    description: "Celebrated 10,000+ registered service providers on our platform"
  },
  {
    year: "2025",
    title: "Expansion",
    description: "Launched in 25+ cities across the United States"
  }
];

// Awards and recognition
const awards = [
  {
    title: "Best Service Platform 2024",
    organization: "TechCrunch",
    year: "2024"
  },
  {
    title: "Innovation Award",
    organization: "Startup Weekly",
    year: "2024"
  },
  {
    title: "Customer Choice",
    organization: "Service Industry Awards",
    year: "2023"
  }
];

export default function About() {
  const [activeTab, setActiveTab] = useState("mission");

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-50 to-gray-100 py-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-light mb-8 text-gray-900 leading-tight">
                About Civix
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
                We're building the future of service management, connecting talented professionals
                with customers who need quality work done.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <Button size="lg" className="bg-gray-900 text-white hover:bg-gray-800 px-8 py-4 text-lg">
                Our Story <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-lg">
                Meet Our Team
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "25K+", label: "Service Providers", icon: <Users className="h-8 w-8" /> },
              { value: "150K+", label: "Happy Customers", icon: <Heart className="h-8 w-8" /> },
              { value: "500K+", label: "Services Completed", icon: <CheckCircle2 className="h-8 w-8" /> },
              { value: "98%", label: "Satisfaction Rate", icon: <Star className="h-8 w-8" /> }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-xl bg-gray-50 text-gray-700">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-light text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <motion.h2
              className="text-4xl md:text-5xl font-light mb-6 text-gray-900"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              Our Purpose
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              We're driven by a simple mission: to make finding and booking quality services
              as easy as ordering takeout.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {[
              {
                icon: <Target className="h-8 w-8" />,
                title: "Our Mission",
                description: "To create seamless connections between service providers and customers, making quality services accessible to everyone."
              },
              {
                icon: <Lightbulb className="h-8 w-8" />,
                title: "Our Vision",
                description: "To become the world's most trusted platform for service management, empowering both providers and customers."
              },
              {
                icon: <Zap className="h-8 w-8" />,
                title: "Our Approach",
                description: "We combine cutting-edge technology with human-centered design to create experiences that just work."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="p-4 rounded-xl bg-gray-50 w-fit mb-6">
                  <div className="text-gray-700">
                    {item.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-medium mb-4 text-gray-900">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Values Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Trust", description: "Building lasting relationships through reliability and honesty", icon: <Shield className="h-6 w-6" /> },
              { title: "Quality", description: "Delivering excellence in every service and interaction", icon: <Award className="h-6 w-6" /> },
              { title: "Innovation", description: "Continuously improving our platform for better experiences", icon: <Lightbulb className="h-6 w-6" /> },
              { title: "Transparency", description: "Clear communication and straightforward processes", icon: <Globe className="h-6 w-6" /> }
            ].map((value, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-4 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="p-2 rounded-lg bg-gray-50 text-gray-700 flex-shrink-0">
                  {value.icon}
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2 text-gray-900">{value.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-light mb-6 text-gray-900">Our Journey</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              From a simple idea to a platform serving thousands of customers nationwide
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              {timeline.map((item, index) => (
                <motion.div
                  key={index}
                  className="relative flex items-start gap-8 mb-12"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <div className="flex-shrink-0 w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center text-white font-medium text-sm relative z-10">
                    {item.year}
                  </div>
                  <div className="flex-1 pt-2">
                    <h3 className="text-xl font-medium mb-2 text-gray-900">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-light mb-6 text-gray-900">Meet Our Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              The passionate people behind Civix who are dedicated to revolutionizing service management
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="relative h-64">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-medium mb-1 text-gray-900">{member.name}</h3>
                  <p className="text-gray-600 mb-3">{member.role}</p>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">{member.bio}</p>
                  <div className="flex gap-3">
                    <a href={member.linkedin} className="text-gray-400 hover:text-gray-600 transition-colors">
                      <Linkedin className="h-5 w-5" />
                    </a>
                    <a href={member.twitter} className="text-gray-400 hover:text-gray-600 transition-colors">
                      <Twitter className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Awards Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-light mb-6 text-gray-900">Recognition & Awards</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Industry recognition for our commitment to innovation and customer satisfaction
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {awards.map((award, index) => (
              <motion.div
                key={index}
                className="text-center p-8 bg-gray-50 rounded-2xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-xl bg-white text-gray-700 shadow-sm">
                    <Award className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-xl font-medium mb-2 text-gray-900">{award.title}</h3>
                <p className="text-gray-600 mb-1">{award.organization}</p>
                <p className="text-sm text-gray-500">{award.year}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2
              className="text-4xl md:text-5xl font-light mb-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              Join Us in Building the Future
            </motion.h2>
            <motion.p
              className="text-xl text-gray-300 mb-12 leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Whether you're a service provider looking to grow your business or a customer
              seeking quality services, we're here to help you succeed.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 text-lg">
                Get Started Today
              </Button>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg">
                Contact Us
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Custom Styles */}
      <style jsx global>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </MainLayout>
  );
} 
