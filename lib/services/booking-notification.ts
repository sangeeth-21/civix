import { createNamespaceLogger } from "@/lib/logger";
import { sendEmail } from "@/lib/services/email";
import Booking from "@/models/Booking";
import User from "@/models/User";
import mongoose from "mongoose";

const logger = createNamespaceLogger("services:booking-notification");

/**
 * Interface for booking notification options
 */
interface BookingNotificationOptions {
  userId?: string;
  agentId?: string;
  bookingId: string;
  notificationType: string;
  sendToUser?: boolean;
  sendToAgent?: boolean;
  updatedBy?: string;
}

/**
 * Central service to handle all booking notifications
 */
export const BookingNotificationService = {
  /**
   * Send a booking confirmation notification
   */
  async sendBookingConfirmation(bookingId: string): Promise<{userEmailSent: boolean, agentEmailSent: boolean}> {
    try {
      logger.info("Sending booking confirmation", { bookingId });
      
      // Fetch booking with populated references
      const booking = await Booking.findById(bookingId)
        .populate("userId", "name email")
        .populate("agentId", "name email")
        .populate("serviceId", "title description price category")
        .lean();
        
      if (!booking) {
        throw new Error(`Booking not found: ${bookingId}`);
      }
      
      // Send to user
      const userEmailSent = await this.sendUserBookingEmail({
        bookingId,
        notificationType: "booking_confirmation",
        emailSubject: `Booking Confirmation - #${bookingId}`,
        user: booking.userId as any,
        booking,
        template: "confirmation"
      });
      
      // Send to agent
      const agentEmailSent = await this.sendAgentBookingEmail({
        bookingId,
        notificationType: "new_booking",
        emailSubject: `New Booking Assigned - #${bookingId}`,
        agent: booking.agentId as any,
        user: booking.userId as any,
        booking,
        template: "agent_notification"
      });
      
      // Update booking with notification status
      await Booking.findByIdAndUpdate(bookingId, {
        $set: {
          'notifications.confirmationSent': true,
          'notifications.confirmationSentAt': new Date(),
          'notifications.lastNotificationType': 'booking_confirmation'
        },
        $push: {
          'notifications.notificationHistory': [
            {
              type: 'booking_confirmation_user',
              sentAt: new Date(),
              success: userEmailSent
            },
            {
              type: 'booking_confirmation_agent',
              sentAt: new Date(),
              success: agentEmailSent
            }
          ]
        }
      });
      
      return { userEmailSent, agentEmailSent };
    } catch (error) {
      logger.error("Error sending booking confirmation", {
        bookingId,
        error: error instanceof Error ? error.message : String(error)
      });
      return { userEmailSent: false, agentEmailSent: false };
    }
  },
  
  /**
   * Send a booking status update notification
   */
  async sendStatusUpdateNotification({
    bookingId,
    newStatus,
    updatedBy
  }: {
    bookingId: string;
    newStatus: string;
    updatedBy?: string;
  }): Promise<{userEmailSent: boolean, agentEmailSent: boolean}> {
    try {
      logger.info("Sending status update notification", { bookingId, newStatus });
      
      // Fetch booking with populated references
      const booking = await Booking.findById(bookingId)
        .populate("userId", "name email")
        .populate("agentId", "name email")
        .populate("serviceId", "title description price category")
        .lean();
        
      if (!booking) {
        throw new Error(`Booking not found: ${bookingId}`);
      }
      
      // Get user-friendly status name
      const statusMap: Record<string, string> = {
        "PENDING": "Pending",
        "CONFIRMED": "Confirmed",
        "COMPLETED": "Completed",
        "CANCELLED": "Cancelled"
      };
      
      const statusName = statusMap[newStatus] || newStatus;
      
      // Send to user
      const userEmailSent = await this.sendUserBookingEmail({
        bookingId,
        notificationType: `status_update_${newStatus.toLowerCase()}`,
        emailSubject: `Booking Status Update - #${bookingId} - ${statusName}`,
        user: booking.userId as any,
        booking: { ...booking, status: newStatus },
        template: "status_update",
        additionalData: {
          statusName,
          newStatus
        }
      });
      
      // Send to agent
      const agentEmailSent = await this.sendAgentBookingEmail({
        bookingId,
        notificationType: `status_update_${newStatus.toLowerCase()}`,
        emailSubject: `Booking Status Update - #${bookingId} - ${statusName}`,
        agent: booking.agentId as any,
        user: booking.userId as any,
        booking: { ...booking, status: newStatus },
        template: "status_update",
        additionalData: {
          statusName,
          newStatus
        }
      });
      
      // Update booking with notification status
      await Booking.findByIdAndUpdate(bookingId, {
        $set: {
          'notifications.statusUpdateSent': true,
          'notifications.statusUpdateSentAt': new Date(),
          'notifications.lastNotificationType': `status_update_${newStatus.toLowerCase()}`
        },
        $push: {
          'notifications.notificationHistory': [
            {
              type: `status_update_user_${newStatus.toLowerCase()}`,
              sentAt: new Date(),
              success: userEmailSent
            },
            {
              type: `status_update_agent_${newStatus.toLowerCase()}`,
              sentAt: new Date(),
              success: agentEmailSent
            }
          ]
        }
      });
      
      return { userEmailSent, agentEmailSent };
    } catch (error) {
      logger.error("Error sending status update notification", {
        bookingId,
        newStatus,
        error: error instanceof Error ? error.message : String(error)
      });
      return { userEmailSent: false, agentEmailSent: false };
    }
  },
  
  /**
   * Send email to user about their booking
   */
  async sendUserBookingEmail({
    bookingId,
    notificationType,
    emailSubject,
    user,
    booking,
    template,
    additionalData = {}
  }: {
    bookingId: string;
    notificationType: string;
    emailSubject: string;
    user: { name: string; email: string; };
    booking: any;
    template: string;
    additionalData?: Record<string, any>;
  }): Promise<boolean> {
    try {
      if (!user || !user.email) {
        logger.warn("Cannot send user email: no user email provided", { bookingId });
        return false;
      }
      
      const formattedDate = new Date(booking.scheduledDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      const formattedTime = new Date(booking.scheduledDate).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      
      // Base template for all user booking emails
      let html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #2563eb;">Booking ${getEmailHeaderByTemplate(template)}</h2>
          <p>Hello ${user.name},</p>
      `;
      
      // Add template-specific content
      if (template === "confirmation") {
        html += `
          <p>Thank you for your booking. Here are your booking details:</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Service:</strong> ${booking.serviceId.title}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Price:</strong> $${(booking.totalAmount || booking.amount || booking.serviceId.price).toFixed(2)}</p>
            <p><strong>Status:</strong> ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1).toLowerCase()}</p>
            ${booking.agentId?.name ? `<p><strong>Agent:</strong> ${booking.agentId.name}</p>` : ''}
            ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
          </div>
          
          <p>If you need to modify or cancel your booking, please log in to your account or contact us directly.</p>
        `;
      } else if (template === "status_update") {
        const { statusName } = additionalData;
        html += `
          <p>The status of your booking has been updated to <strong>${statusName}</strong>.</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Service:</strong> ${booking.serviceId.title}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>New Status:</strong> <span style="font-weight: bold; color: ${getStatusColor(booking.status)};">${statusName}</span></p>
            ${booking.agentId?.name ? `<p><strong>Agent:</strong> ${booking.agentId.name}</p>` : ''}
            ${booking.agentNotes ? `<p><strong>Agent Notes:</strong> ${booking.agentNotes}</p>` : ''}
          </div>
          
          <p>If you have any questions about this update, please log in to your account or contact us directly.</p>
        `;
      }
      
      // Add email footer
      html += `
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="font-size: 14px; color: #666;">Thank you for choosing our services!</p>
          </div>
        </div>
      `;
      
      // Send the email
      const emailSent = await sendEmail({
        to: user.email,
        subject: emailSubject,
        html,
      });
      
      logger.info(`User email sent (${notificationType})`, { 
        success: emailSent,
        userEmail: user.email,
        bookingId 
      });
      
      return emailSent;
    } catch (error) {
      logger.error("Error sending user email", {
        bookingId,
        notificationType,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  },
  
  /**
   * Send email to agent about a booking
   */
  async sendAgentBookingEmail({
    bookingId,
    notificationType,
    emailSubject,
    agent,
    user,
    booking,
    template,
    additionalData = {}
  }: {
    bookingId: string;
    notificationType: string;
    emailSubject: string;
    agent: { name: string; email: string; };
    user: { name: string; email: string; };
    booking: any;
    template: string;
    additionalData?: Record<string, any>;
  }): Promise<boolean> {
    try {
      if (!agent || !agent.email) {
        logger.warn("Cannot send agent email: no agent email provided", { bookingId });
        return false;
      }
      
      const formattedDate = new Date(booking.scheduledDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      const formattedTime = new Date(booking.scheduledDate).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      
      // Base template for all agent booking emails
      let html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #2563eb;">${getEmailHeaderByTemplate(template, true)}</h2>
          <p>Hello ${agent.name},</p>
      `;
      
      // Add template-specific content
      if (template === "agent_notification") {
        html += `
          <p>A new booking has been assigned to you. Here are the details:</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Client:</strong> ${user.name}</p>
            <p><strong>Service:</strong> ${booking.serviceId.title}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            ${booking.notes ? `<p><strong>Client Notes:</strong> ${booking.notes}</p>` : ''}
          </div>
          
          <p>Please log in to your account to review the booking details and confirm your availability.</p>
        `;
      } else if (template === "status_update") {
        const { statusName } = additionalData;
        html += `
          <p>The status of a booking has been updated to <strong>${statusName}</strong>.</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Client:</strong> ${user.name}</p>
            <p><strong>Service:</strong> ${booking.serviceId.title}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>New Status:</strong> <span style="font-weight: bold; color: ${getStatusColor(booking.status)};">${statusName}</span></p>
          </div>
          
          <p>Please log in to your account to view the full details.</p>
        `;
      }
      
      // Add email footer
      html += `
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="font-size: 14px; color: #666;">Thank you for your service!</p>
          </div>
        </div>
      `;
      
      // Send the email
      const emailSent = await sendEmail({
        to: agent.email,
        subject: emailSubject,
        html,
      });
      
      logger.info(`Agent email sent (${notificationType})`, { 
        success: emailSent,
        agentEmail: agent.email,
        bookingId 
      });
      
      return emailSent;
    } catch (error) {
      logger.error("Error sending agent email", {
        bookingId,
        notificationType,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }
};

/**
 * Get appropriate email header based on template type
 */
function getEmailHeaderByTemplate(template: string, isAgent: boolean = false): string {
  if (isAgent) {
    switch (template) {
      case "agent_notification":
        return "New Booking Assigned";
      case "status_update":
        return "Booking Status Updated";
      default:
        return "Booking Information";
    }
  } else {
    switch (template) {
      case "confirmation":
        return "is Confirmed!";
      case "status_update":
        return "Status Update";
      default:
        return "Information";
    }
  }
}

/**
 * Get appropriate color for booking status
 */
function getStatusColor(status: string): string {
  switch (status) {
    case "PENDING":
      return "#f59e0b"; // amber
    case "CONFIRMED":
      return "#3b82f6"; // blue
    case "COMPLETED":
      return "#10b981"; // green
    case "CANCELLED":
      return "#ef4444"; // red
    default:
      return "#6b7280"; // gray
  }
} 