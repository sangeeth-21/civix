import { Metadata } from "next"
import { PolicyPageLayout } from "@/components/policy-page-layout"
import { termsAndConditions } from "@/lib/policy"
import { config } from "@/lib/config"

export const metadata: Metadata = {
  title: "Terms and Conditions - Civix",
  description: "Read about the terms and conditions for using our service.",
}

export default function TermsAndConditions() {
  return <PolicyPageLayout policy={termsAndConditions} />
} 
