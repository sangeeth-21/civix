import { ReactNode } from "react"
import { Separator } from "@/components/ui/separator"
import { Heading } from "@/components/ui/heading"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { PolicyDocument, PolicySection } from "@/lib/policy"
import { PageErrorBoundary } from "@/components/page-error-boundary"
import { MainLayout } from "@/components/layout/main-layout"

interface PolicyPageLayoutProps {
  policy: PolicyDocument
  children?: ReactNode
}

export function PolicyPageLayout({ policy, children }: PolicyPageLayoutProps) {
  return (
    <MainLayout>
      <PageErrorBoundary>
        <div className="container max-w-4xl py-12 px-4 md:px-6">
          <div className="space-y-8">
            <div className="text-center">
              <Heading level="h1">{policy.title}</Heading>
              <p className="mt-2 text-muted-foreground">
                Last updated: {policy.lastUpdated}
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-lg leading-relaxed">{policy.introduction}</p>

                  {policy.sections.map((section, index) => (
                    <PolicySection key={index} section={section} />
                  ))}

                  <Separator className="my-8" />

                  <div className="mt-8">
                    <p className="text-lg font-medium">{policy.conclusion}</p>
                  </div>

                  {children}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageErrorBoundary>
    </MainLayout>
  )
}

function PolicySection({ section }: { section: PolicySection }) {
  return (
    <section className="mt-8">
      <Heading level="h2" className="mb-4">{section.title}</Heading>
      <div className="space-y-4">
        {section.content.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </section>
  )
} 