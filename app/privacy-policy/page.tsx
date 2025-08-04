import { Metadata } from "next"
import { PolicyPageLayout } from "@/components/policy-page-layout"
import { privacyPolicy } from "@/lib/policy"
import { config } from "@/lib/config"

export const metadata: Metadata = {
  title: "Privacy Policy - Civix",
  description: "Read about how we collect, use, and protect your personal information.",
}

export default function PrivacyPolicy() {
  return <PolicyPageLayout policy={privacyPolicy} />
} 
