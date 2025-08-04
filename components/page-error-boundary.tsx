"use client"

import React from "react"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class PageErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to monitoring service in production
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="container flex items-center justify-center min-h-[70vh] p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <Heading level="h2">Something went wrong</Heading>
                <Alert variant="destructive" className="mt-4">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {this.state.error?.message || "An unexpected error occurred"}
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center gap-4 pt-4">
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Return Home</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
): React.FC<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <PageErrorBoundary fallback={fallback}>
        <Component {...props} />
      </PageErrorBoundary>
    )
  }
} 