import { z } from 'zod';

// Schema for policy sections
export const PolicySectionSchema = z.object({
  title: z.string(),
  content: z.array(z.string()),
});

export type PolicySection = z.infer<typeof PolicySectionSchema>;

// Schema for full policy document
export const PolicyDocumentSchema = z.object({
  title: z.string(),
  lastUpdated: z.string(),
  introduction: z.string(),
  sections: z.array(PolicySectionSchema),
  conclusion: z.string(),
});

export type PolicyDocument = z.infer<typeof PolicyDocumentSchema>;

// Privacy Policy content
export const privacyPolicy: PolicyDocument = {
  title: "Privacy Policy",
  lastUpdated: "December 1, 2023",
  introduction: 
    "At Civix, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service management platform. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the platform.",
  sections: [
    {
      title: "Information We Collect",
      content: [
        "We collect information that you provide directly to us when registering, creating or modifying your account, setting up profiles, or interacting with our platform.",
        "Personal Information: Name, email address, postal address, phone number, and other similar contact data.",
        "Profile Information: Username, password, service preferences, and other profile data.",
        "Transaction Information: We collect data about the services you book or provide through our platform, including dates, times, locations, and payment information.",
        "Usage Information: We automatically collect information about your interactions with our platform, including pages visited, features used, and time spent on the platform."
      ]
    },
    {
      title: "How We Use Your Information",
      content: [
        "To provide, maintain, and improve our services.",
        "To process transactions and send related information including confirmations, receipts, and service updates.",
        "To send administrative information, such as updates to our terms, conditions, and policies.",
        "To personalize your experience and deliver content relevant to your interests.",
        "To respond to your comments, questions, and requests and provide customer service.",
        "To monitor and analyze trends, usage, and activities in connection with our services."
      ]
    },
    {
      title: "Information Sharing and Disclosure",
      content: [
        "We may share your information with service providers who perform services on our behalf.",
        "We may disclose your information if required to do so by law or in response to valid requests by public authorities.",
        "With your consent or at your direction, including if we notify you that the information you provide will be shared in a particular manner and you provide such information.",
        "We may share aggregated or de-identified information, which cannot reasonably be used to identify you."
      ]
    },
    {
      title: "Data Security",
      content: [
        "We implement appropriate technical and organizational measures to protect the security of your personal information.",
        "However, please be aware that no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security."
      ]
    },
    {
      title: "Your Rights and Choices",
      content: [
        "Account Information: You may update, correct, or delete your account information at any time by logging into your account or contacting us.",
        "Marketing Communications: You may opt out of receiving promotional emails from us by following the instructions in those emails.",
        "Cookies: Most web browsers are set to accept cookies by default. You can usually choose to set your browser to remove or reject browser cookies."
      ]
    }
  ],
  conclusion: "By using Civix, you consent to our Privacy Policy and agree to its terms. If you have any questions about this Privacy Policy, please contact us at support@civix.com."
};

// Terms and Conditions content
export const termsAndConditions: PolicyDocument = {
  title: "Terms and Conditions",
  lastUpdated: "December 1, 2023",
  introduction: 
    "Welcome to Civix. These Terms and Conditions govern your use of our service management platform and provide information about the Service, outlined below. When you create a Civix account or use Civix, you agree to these terms.",
  sections: [
    {
      title: "Acceptance of Terms",
      content: [
        "By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.",
        "We reserve the right to modify these Terms at any time. We will always post the most current version on our website and notify you of any significant changes."
      ]
    },
    {
      title: "User Accounts",
      content: [
        "To use certain features of our Service, you must register for an account. You must provide accurate, current, and complete information during the registration process.",
        "You are responsible for safeguarding the password you use to access the Service and for any activities or actions under your password.",
        "You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account."
      ]
    },
    {
      title: "Service Usage and Conduct",
      content: [
        "You may use our Service only for lawful purposes and in accordance with these Terms.",
        "You agree not to use the Service in any way that could damage, disable, overburden, or impair our servers or networks, or interfere with any other party's use and enjoyment of the Service.",
        "You agree not to attempt to gain unauthorized access to any parts of the Service, other accounts, computer systems, or networks connected to the Service.",
        "You must not transmit any worms or viruses or any code of a destructive nature."
      ]
    },
    {
      title: "Intellectual Property",
      content: [
        "The Service and its original content, features, and functionality are and will remain the exclusive property of Civix and its licensors.",
        "Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Civix."
      ]
    },
    {
      title: "Termination",
      content: [
        "We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.",
        "Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service."
      ]
    },
    {
      title: "Limitation of Liability",
      content: [
        "In no event shall Civix, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.",
        "Civix assumes no liability or responsibility for any errors, mistakes, or inaccuracies of content; personal injury or property damage resulting from your access to or use of our service; unauthorized access to or use of our secure servers and/or any personal information stored therein."
      ]
    },
    {
      title: "Governing Law",
      content: [
        "These Terms shall be governed and construed in accordance with the laws, without regard to its conflict of law provisions.",
        "Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights."
      ]
    }
  ],
  conclusion: "By using Civix, you acknowledge that you have read these Terms of Service, understood them, and agree to be bound by them. If you do not agree to these Terms of Service, you are not authorized to use the Service. We reserve the right to change these Terms of Service at any time, so please review them frequently."
}; 