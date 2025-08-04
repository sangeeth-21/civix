import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Register - Civix Platform",
  description: "Create a new account on Civix",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 