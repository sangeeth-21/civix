import { AppLayout } from "@/components/layout/app-layout";
import type { User } from "@/types";

interface MainLayoutProps {
  children: React.ReactNode;
  showNavbar?: boolean;
  showFooter?: boolean;
  user?: Partial<User> | null;
  className?: string;
}

export function MainLayout({
  children,
  showNavbar = true,
  showFooter = true,
  user,
  className,
}: MainLayoutProps) {
  return (
    <AppLayout
      user={user as Partial<User> | null}
      showNavbar={showNavbar}
      showFooter={showFooter}
      showSidebar={false}
      className={className}
    >
      {children}
    </AppLayout>
  );
} 