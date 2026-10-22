import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  throw new Error("RESEND_API_KEY is not configured");
}

const fromEmail = process.env.FROM_EMAIL;
if (!fromEmail) {
  throw new Error("FROM_EMAIL is not configured");
}

const resend = new Resend(resendApiKey);
const siteName = process.env.SITE_NAME ?? "our store";

class EmailService {
  /**
   * Generic email sender
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string
  ) {
    try {
      const response = await resend.emails.send({
        from: fromEmail!,
        to,
        subject,
        html,
      });

      return response;
    } catch (error) {
      console.error("Email Error:", error);
      throw error;
    }
  }

  /**
   * Welcome Email
   */
  async sendWelcomeEmail(
    email: string,
    name: string
  ) {
    return this.sendEmail(
      email,
      `Welcome to ${siteName}`,
      `
      <div style="font-family: Arial, sans-serif;">
        <h2>Welcome, ${name}! 🎉</h2>
        <p>Thank you for joining ${siteName}.</p>
        <p>We're excited to have you with us.</p>
      </div>
      `
    );
  }

  /**
   * Password Reset Email
   */
  async sendPasswordResetEmail(
    email: string,
    resetLink: string
  ) {
    return this.sendEmail(
      email,
      "Reset Your Password",
      `
      <div style="font-family: Arial, sans-serif;">
        <h2>Password Reset Request</h2>

        <p>Click the button below to reset your password.</p>

        <a
          href="${resetLink}"
          style="
            display:inline-block;
            padding:12px 24px;
            background:#2563eb;
            color:#fff;
            text-decoration:none;
            border-radius:6px;
          "
        >
          Reset Password
        </a>

        <p>
          If you did not request a password reset,
          please ignore this email.
        </p>
      </div>
      `
    );
  }

  /**
   * Order Confirmation
   */
  async sendOrderConfirmation(
    email: string,
    customerName: string,
    orderId: string,
    amount: number
  ) {
    return this.sendEmail(
      email,
      `Order Confirmation - ${orderId}`,
      `
      <div style="font-family: Arial, sans-serif;">
        <h2>Thank You For Your Order!</h2>

        <p>Hello ${customerName},</p>

        <p>Your order has been successfully placed.</p>

        <p>
          <strong>Order ID:</strong> ${orderId}
        </p>

        <p>
          <strong>Total Amount:</strong> ₹${amount}
        </p>

        <p>
          We'll notify you once your order ships.
        </p>

        <p>
          Team ${siteName}
        </p>
      </div>
      `
    );
  }

  /**
   * Notify Seller
   */
  async notifySeller(
    orderId: string,
    customerName: string,
    amount: number
  ) {
    const sellerEmail = process.env.SELLER_EMAIL;
    if (!sellerEmail) {
      throw new Error("SELLER_EMAIL is not configured");
    }

    return this.sendEmail(
      sellerEmail,
      `🛒 New Order Received - ${orderId}`,
      `
      <div style="font-family: Arial, sans-serif;">
        <h2>New Order Received</h2>

        <p><strong>Customer:</strong> ${customerName}</p>

        <p><strong>Order ID:</strong> ${orderId}</p>

        <p><strong>Amount:</strong> ₹${amount}</p>
      </div>
      `
    );
  }
}

export const emailService = new EmailService();