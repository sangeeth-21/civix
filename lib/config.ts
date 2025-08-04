/**
 * System configuration settings
 */

export const config = {
  // Site metadata
  site: {
    name: 'Civix',
    description: 'Service Management Platform',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://civix.vercel.app',
  },
  
  // Feature flags
  features: {
    maintenanceMode: process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true',
  },
  
  // Contact information
  contact: {
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@civix.com',
    phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || '+1 (555) 123-4567',
  },
  
  // Social media links
  social: {
    twitter: 'https://twitter.com/civix',
    facebook: 'https://facebook.com/civix',
    instagram: 'https://instagram.com/civix',
    linkedin: 'https://linkedin.com/company/civix',
  },
  
  // Date when terms and privacy were last updated
  legal: {
    termsLastUpdated: '2023-12-01',
    privacyLastUpdated: '2023-12-01',
  },
} 