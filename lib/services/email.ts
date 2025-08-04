import nodemailer from 'nodemailer';
import { logger, createNamespaceLogger } from '../logger';

/**
 * Email service configuration and utility functions
 */
interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
  from?: string;
}

// Create a reusable transporter object
const createTransporter = () => {
  logger.info('Creating email transporter');
  
  // Check if SMTP credentials are available
  const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const smtpPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  
  if (!smtpUser || !smtpPass) {
    logger.warn('SMTP credentials not configured, using mock transporter');
    // Return a mock transporter for development
    return {
      sendMail: async (options: any) => {
        logger.info('📧 Mock email sent', { 
          to: options.to, 
          subject: options.subject,
          message: 'Email would be sent in production with proper SMTP configuration'
        });
        return { messageId: 'mock-' + Date.now() };
      },
      verify: async () => {
        logger.info('📧 Mock SMTP verification successful');
        return true;
      }
    };
  }
  
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true' || process.env.SMTP_SECURE === 'true',
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

/**
 * Send an email
 * 
 * @param options - Email options
 * @returns Promise with the result of sending the email
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const { to, subject, text, html, cc, bcc, attachments, from } = options;
    
    logger.info(`Sending email to ${Array.isArray(to) ? to.join(', ') : to}`, { subject });
    
    const transporter = createTransporter();
    
    // Check if this is a mock transporter (no SMTP credentials)
    if (typeof transporter.sendMail !== 'function') {
      logger.warn('Email not sent - SMTP credentials not configured', { 
        to: Array.isArray(to) ? to.join(', ') : to, 
        subject 
      });
      return true; // Return true to avoid breaking the flow
    }
    
    const mailOptions = {
      from: from || process.env.EMAIL_FROM || 'noreply@example.com',
      to,
      subject,
      text,
      html,
      cc,
      bcc,
      attachments,
    };
    
    const info = await transporter.sendMail(mailOptions);
    logger.info('Email sent successfully', { messageId: info.messageId });
    return true;
  } catch (error) {
    logger.error('Error sending email', { error: (error as Error).message });
    return false;
  }
};

/**
 * Send a booking confirmation email to a user
 */
export const sendBookingConfirmationEmail = async (
  userEmail: string,
  userName: string,
  bookingDetails: {
    _id: string;
    serviceName: string;
    date: Date;
    duration: number;
    price: number;
    status: string;
    agentName?: string;
    notes?: string;
  }
): Promise<boolean> => {
  const formattedDate = new Date(bookingDetails.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const formattedTime = new Date(bookingDetails.date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <h2 style="color: #2563eb;">Your Booking is Confirmed!</h2>
      <p>Hello ${userName},</p>
      <p>Thank you for your booking. Here are your booking details:</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Service:</strong> ${bookingDetails.serviceName}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedTime}</p>
        <p><strong>Duration:</strong> ${bookingDetails.duration} minutes</p>
        <p><strong>Price:</strong> $${bookingDetails.price.toFixed(2)}</p>
        <p><strong>Status:</strong> ${bookingDetails.status.charAt(0).toUpperCase() + bookingDetails.status.slice(1)}</p>
        ${bookingDetails.agentName ? `<p><strong>Agent:</strong> ${bookingDetails.agentName}</p>` : ''}
        ${bookingDetails.notes ? `<p><strong>Notes:</strong> ${bookingDetails.notes}</p>` : ''}
      </div>
      
      <p>If you need to modify or cancel your booking, please log in to your account or contact us directly.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="font-size: 14px; color: #666;">Thank you for choosing our services!</p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: userEmail,
    subject: `Booking Confirmation - #${bookingDetails._id}`,
    html,
  });
};

/**
 * Send a booking notification email to an agent
 */
export const sendAgentNotificationEmail = async (
  agentEmail: string,
  agentName: string,
  userName: string,
  bookingDetails: {
    _id: string;
    serviceName: string;
    date: Date;
    duration: number;
    notes?: string;
  }
): Promise<boolean> => {
  const formattedDate = new Date(bookingDetails.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const formattedTime = new Date(bookingDetails.date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <h2 style="color: #2563eb;">New Booking Assigned</h2>
      <p>Hello ${agentName},</p>
      <p>A new booking has been assigned to you. Here are the details:</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Client:</strong> ${userName}</p>
        <p><strong>Service:</strong> ${bookingDetails.serviceName}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedTime}</p>
        <p><strong>Duration:</strong> ${bookingDetails.duration} minutes</p>
        ${bookingDetails.notes ? `<p><strong>Notes:</strong> ${bookingDetails.notes}</p>` : ''}
      </div>
      
      <p>Please log in to your account to review the booking details and confirm your availability.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="font-size: 14px; color: #666;">Thank you for your service!</p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: agentEmail,
    subject: `New Booking Assigned - #${bookingDetails._id}`,
    html,
  });
};

/**
 * Send a password reset email
 */
export const sendPasswordResetEmail = async (
  userEmail: string,
  userName: string,
  resetToken: string,
  resetUrl: string
): Promise<boolean> => {
  // Use the baseUrl from environment or fallback
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const fullResetUrl = resetUrl || `${baseUrl}/reset-password/${resetToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <h2 style="color: #2563eb;">Reset Your Password</h2>
      <p>Hello ${userName},</p>
      <p>You requested a password reset. Click the button below to reset your password:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${fullResetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Reset Password</a>
      </div>
      
      <p>If you didn't request this password reset, you can safely ignore this email.</p>
      <p>The password reset link will expire in 1 hour.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="font-size: 14px; color: #666;">Thank you!</p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: userEmail,
    subject: "Password Reset Request",
    html,
  });
};

/**
 * Send a welcome email to a new user
 */
export const sendWelcomeEmail = async (
  userEmail: string,
  userName: string
): Promise<boolean> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <h2 style="color: #2563eb;">Welcome to Civix!</h2>
      <p>Hello ${userName},</p>
      <p>Thank you for signing up with Civix. We're excited to have you on board!</p>
      
      <p>With your new account, you can:</p>
      <ul>
        <li>Browse and book services</li>
        <li>Track your bookings</li>
        <li>Manage your profile</li>
        <li>Get support when you need it</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/services" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Explore Services</a>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="font-size: 14px; color: #666;">Thank you for choosing Civix!</p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: userEmail,
    subject: "Welcome to Civix!",
    html,
  });
}; 