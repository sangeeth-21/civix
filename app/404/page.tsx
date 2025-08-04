import { Metadata } from "next"
import { FileQuestion } from "lucide-react"
import { SystemPageLayout } from "@/components/system-page-layout"

export const metadata: Metadata = {
  title: "Page Not Found - Civix",
  description: "The page you are looking for does not exist.",
}

export default function NotFound() {
  return (
    <SystemPageLayout
      title="404 - Page Not Found"
      icon={<FileQuestion className="h-16 w-16" />}
      showHomeButton
      showBackButton
    >
      <p className="text-muted-foreground text-lg mb-6">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <p className="text-muted-foreground">
        Please check the URL or navigate back to the homepage.
      </p>
    </SystemPageLayout>
  )
} 
