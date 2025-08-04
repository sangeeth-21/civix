"use client";

import React from "react";
import { motion } from "framer-motion";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.3,
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right";
}) {
  const directions = {
    up: { y: 10 },
    down: { y: -10 },
    left: { x: 10 },
    right: { x: -10 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerChildren({
  children,
  className,
  staggerDelay = 0.1,
  duration = 0.3,
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right";
}) {
  const directions = {
    up: { y: 10 },
    down: { y: -10 },
    left: { x: 10 },
    right: { x: -10 },
  };

  return (
    <motion.div className={className}>
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, ...directions[direction] }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          transition={{ duration, delay: index * staggerDelay }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
} 