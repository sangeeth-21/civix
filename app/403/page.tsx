import { Metadata } from "next"
import { ShieldAlert } from "lucide-react"
import { SystemPageLayout } from "@/components/system-page-layout"

export const metadata: Metadata = {
  title: "Access Forbidden - Civix",
  description: "You don&apos;t have permission to access this page.",
}

export default function Forbidden() {
  return (
    <SystemPageLayout
      title="403 - Access Forbidden"
      icon={<ShieldAlert className="h-16 w-16" />}
      showHomeButton
      showBackButton
      showSupportButton
    >
      <p className="text-muted-foreground text-lg mb-6">
        You don&apos;t have permission to access this page.
      </p>
      <p className="text-muted-foreground">
        If you believe this is an error, please contact our support team.
      </p>
    </SystemPageLayout>
  )
} 
