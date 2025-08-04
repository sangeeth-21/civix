import { Metadata } from "next"
import { redirect } from "next/navigation"
import { Wrench } from "lucide-react"
import { SystemPageLayout } from "@/components/system-page-layout"
import { config } from "@/lib/config"

export const metadata: Metadata = {
  title: "Maintenance - Civix",
  description: "Our site is currently undergoing scheduled maintenance.",
}

export default function Maintenance() {
  // If maintenance mode is not enabled, redirect to home page
  if (!config.features.maintenanceMode) {
    redirect("/")
  }
  
  return (
    <SystemPageLayout
      title="Scheduled Maintenance"
      icon={<Wrench className="h-16 w-16" />}
      showSupportButton
    >
      <p className="text-muted-foreground text-lg mb-6">
        Our site is currently undergoing scheduled maintenance.
      </p>
      <p className="text-muted-foreground mb-6">
        We&apos;re working hard to improve our service and will be back shortly.
        Thank you for your patience.
      </p>
      <p className="text-sm text-muted-foreground">
        Expected completion: <span className="font-medium">Within 2 hours</span>
      </p>
    </SystemPageLayout>
  )
} 
