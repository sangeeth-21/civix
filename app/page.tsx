"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import {
  Globe,
  Users,
  Calendar,
  Shield,
  HomeIcon,
  Wrench,
  ArrowRight,
  Star,
  CheckCircle2,
  ChevronRight,
  Clock,
  Phone,
  Award,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";

// Hero section slides data
const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    heading: "Professional Home Services",
    subheading: "Trusted experts for all your home maintenance and improvement needs",
    ctaText: "Get Started"
  },
  {
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    heading: "Quality Workmanship",
    subheading: "Licensed professionals delivering exceptional results every time",
    ctaText: "Book Service"
  },
  {
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    heading: "Reliable & On-Time",
    subheading: "Scheduled appointments with guaranteed arrival times",
    ctaText: "Schedule Now"
  }
];

// Services data
const services = [
  {
    title: "Plumbing Services",
    description: "Comprehensive plumbing solutions from repairs to installations. Our certified plumbers ensure quality workmanship and lasting results.",
    features: ["24/7 Emergency Service", "Licensed Professionals", "Warranty Included"],
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
  },
  {
    title: "Electrical Work",
    description: "Safe and reliable electrical services for residential and commercial properties. From simple repairs to complex installations.",
    features: ["Safety First Approach", "Code Compliant", "Expert Technicians"],
    image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
  },
  {
    title: "Home Maintenance",
    description: "Regular maintenance services to keep your home in excellent condition. Preventive care saves time and money.",
    features: ["Preventive Care", "Regular Inspections", "Quality Materials"],
    image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
  }
];

// Testimonials data
const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Homeowner",
    text: "The team was professional, on-time, and completed the work exactly as promised. Highly recommend their services.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
  },
  {
    name: "Michael Chen",
    role: "Property Manager",
    text: "We've been using their services for our rental properties for years. Consistent quality and reliable scheduling.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
  },
  {
    name: "Emily Rodriguez",
    role: "Business Owner",
    text: "Fast response time and excellent work quality. They've become our go-to for all maintenance needs.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1614644147724-2d4785d69962?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
  }
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-rotate hero slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden bg-gray-50">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${currentSlide === index ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
          >
            <div className="absolute inset-0 w-full h-full">
              <Image
                src={slide.image}
                alt={slide.heading}
                fill
                className="object-cover w-full h-full"
                priority
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-black/30"></div>
            </div>

            <div className="container mx-auto px-6 h-full flex items-center relative z-20">
              <div className="max-w-2xl text-white">
                <motion.h1
                  className="text-5xl md:text-6xl lg:text-7xl font-light mb-8 leading-tight"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: currentSlide === index ? 1 : 0, y: currentSlide === index ? 0 : 30 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  {slide.heading}
                </motion.h1>
                <motion.p
                  className="text-xl md:text-2xl mb-12 text-white/90 font-light leading-relaxed"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: currentSlide === index ? 1 : 0, y: currentSlide === index ? 0 : 30 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  {slide.subheading}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: currentSlide === index ? 1 : 0, y: currentSlide === index ? 0 : 30 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 text-lg font-medium">
                    {slide.ctaText} <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        ))}

        {/* Slide Indicators */}
        <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-3 z-20">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${currentSlide === index
                ? "bg-white w-8"
                : "bg-white/40 hover:bg-white/60"
                }`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-light mb-6 text-gray-900">Our Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Comprehensive home services delivered by licensed professionals with years of experience
            </p>
          </div>

          <div className="grid gap-16">
            {services.map((service, index) => (
              <div
                key={index}
                className={`grid md:grid-cols-2 gap-16 items-center ${index % 2 === 0 ? '' : 'md:grid-flow-col-dense'
                  }`}
              >
                <div className={`space-y-8 ${index % 2 === 0 ? 'md:order-1' : 'md:order-2'}`}>
                  <div className="space-y-4">
                    <h3 className="text-3xl md:text-4xl font-light text-gray-900">{service.title}</h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {service.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-4">
                        <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                    Learn More <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <div className={`relative h-96 md:h-[500px] rounded-2xl overflow-hidden shadow-2xl ${index % 2 === 0 ? 'md:order-2' : 'md:order-1'
                  }`}>
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-light mb-6 text-gray-900">Why Choose Us</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We prioritize quality, reliability, and customer satisfaction in everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Licensed & Insured",
                description: "All professionals are fully licensed, bonded, and insured for your protection"
              },
              {
                icon: <Clock className="h-8 w-8" />,
                title: "On-Time Service",
                description: "We respect your schedule with guaranteed arrival times and efficient work"
              },
              {
                icon: <Award className="h-8 w-8" />,
                title: "Quality Guarantee",
                description: "We stand behind our work with comprehensive warranties and satisfaction guarantees"
              },
              {
                icon: <Zap className="h-8 w-8" />,
                title: "Fast Response",
                description: "Quick response times for emergencies and urgent service requests"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300"
                whileHover={{ y: -4 }}
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
                <h3 className="text-xl font-medium mb-4 text-gray-900">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-20 border-t border-gray-200">
            {[
              { value: "15+", label: "Years Experience" },
              { value: "10K+", label: "Projects Completed" },
              { value: "98%", label: "Satisfied Clients" },
              { value: "24/7", label: "Support Available" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="text-4xl md:text-5xl font-light text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-light mb-6 text-gray-900">What Our Clients Say</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Don't just take our word for it. Here's what our satisfied clients have to say about our services.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-gray-50 p-8 rounded-2xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <div className="flex items-center mb-6">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden mr-4">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>

                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-gray-700 leading-relaxed italic">"{testimonial.text}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-light mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Contact us today for a free consultation and estimate on your home service needs.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-white/10">
                  <Phone className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-gray-400">Call us at</p>
                  <p className="font-medium text-lg">1-800-123-4567</p>
                </div>
              </div>

              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 text-lg">
                Schedule Consultation
              </Button>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
