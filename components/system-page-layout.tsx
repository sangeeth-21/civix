"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { PageErrorBoundary } from "@/components/page-error-boundary"

interface SystemPageLayoutProps {
  children: ReactNode
  title: string
  icon?: ReactNode
  showHomeButton?: boolean
  showSupportButton?: boolean
  showBackButton?: boolean
  className?: string
  animate?: boolean
  footerContent?: ReactNode
}

export function SystemPageLayout({
  children,
  title,
  icon,
  showHomeButton = true,
  showSupportButton = false,
  showBackButton = false,
  className = "",
  animate = true,
  footerContent,
}: SystemPageLayoutProps) {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1], // Use cubic-bezier values instead of string
      },
    },
  }

  return (
    <PageErrorBoundary>
      <div className="container flex flex-col items-center justify-center min-h-[80vh] py-12 px-4">
        {animate ? (
          <motion.div
            className={`w-full max-w-2xl ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-6 text-center">
                  {icon && <div className="text-primary">{icon}</div>}
                  <Heading level="h1" align="center" className="mb-4">
                    {title}
                  </Heading>
                  <div className="w-full">{children}</div>
                </div>
              </CardContent>
              {(showHomeButton || showSupportButton || showBackButton || footerContent) && (
                <CardFooter className="flex flex-wrap justify-center gap-4 pt-4">
                  {showHomeButton && (
                    <Button asChild>
                      <Link href="/">Return Home</Link>
                    </Button>
                  )}
                  {showBackButton && (
                    <Button variant="outline" onClick={() => window.history.back()}>
                      Go Back
                    </Button>
                  )}
                  {showSupportButton && (
                    <Button variant="outline" asChild>
                      <Link href="/contact">Contact Support</Link>
                    </Button>
                  )}
                  {footerContent}
                </CardFooter>
              )}
            </Card>
          </motion.div>
        ) : (
          <Card className={`w-full max-w-2xl ${className}`}>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-6 text-center">
                {icon && <div className="text-primary">{icon}</div>}
                <Heading level="h1" align="center" className="mb-4">
                  {title}
                </Heading>
                <div className="w-full">{children}</div>
              </div>
            </CardContent>
            {(showHomeButton || showSupportButton || showBackButton || footerContent) && (
              <CardFooter className="flex flex-wrap justify-center gap-4 pt-4">
                {showHomeButton && (
                  <Button asChild>
                    <Link href="/">Return Home</Link>
                  </Button>
                )}
                {showBackButton && (
                  <Button variant="outline" onClick={() => window.history.back()}>
                    Go Back
                  </Button>
                )}
                {showSupportButton && (
                  <Button variant="outline" asChild>
                    <Link href="/contact">Contact Support</Link>
                  </Button>
                )}
                {footerContent}
              </CardFooter>
            )}
          </Card>
        )}
      </div>
    </PageErrorBoundary>
  )
} 