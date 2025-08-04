import { AppLayout } from "@/components/layout/app-layout";
import { User } from "@/types";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout 
      showSidebar={true} 
      showFooter={false}
    >
      {children}
    </AppLayout>
  );
} 
