import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Login - Civix Platform",
  description: "Login to your Civix account",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 