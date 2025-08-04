"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SystemPageLayout } from "@/components/system-page-layout"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
  }, [error])

  return (
    <SystemPageLayout
      title="Something went wrong"
      icon={<AlertTriangle className="h-16 w-16" />}
      showHomeButton
      animate
    >
      <p className="text-muted-foreground text-lg mb-6">
        An unexpected error occurred. Our team has been notified.
      </p>
      <div className="mt-6">
        <Button onClick={reset} className="w-full">
          Try Again
        </Button>
      </div>
    </SystemPageLayout>
  )
} 