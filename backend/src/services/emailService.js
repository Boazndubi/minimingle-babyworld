const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'boazbundi1@gmail.com'
const FROM_EMAIL = 'onboarding@resend.dev' // Use this until you verify a custom domain

/**
 * Send order confirmation email to customer
 */
const sendOrderConfirmationEmail = async (order) => {
  const email = order.shippingAddress?.email
  if (!email) return

  const name = order.shippingAddress?.name || 'Customer'
  const total = Number(order.grandTotal).toLocaleString()
  const orderNo = order.orderNumber

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Order Confirmed - ${orderNo} | Aroma Line`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;">
          <div style="max-width:600px;margin:0 auto;padding:24px;">
            <div style="background:linear-gradient(135deg,#db2777,#be185d);border-radius:16px 16px 0 0;padding:32px;text-align:center;">
              <h1 style="color:white;margin:0;font-size:24px;font-weight:800;">Aroma Line</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Premium Baby Products</p>
            </div>
            <div style="background:white;padding:32px;border-radius:0 0 16px 16px;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
              <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">Order Received!</h2>
              <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">Hi ${name}, thank you for shopping with us. Your order has been received and is being processed.</p>
              <div style="background:#fdf2f8;border-radius:12px;padding:16px;margin-bottom:24px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                  <span style="color:#6b7280;font-size:13px;">Order Number</span>
                  <span style="color:#db2777;font-size:13px;font-weight:600;">${orderNo}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                  <span style="color:#6b7280;font-size:13px;">Payment Method</span>
                  <span style="color:#111827;font-size:13px;font-weight:600;">${order.paymentMethod?.toUpperCase()}</span>
                </div>
                <div style="display:flex;justify-content:space-between;">
                  <span style="color:#6b7280;font-size:13px;">Total Amount</span>
                  <span style="color:#111827;font-size:13px;font-weight:700;">KES ${total}</span>
                </div>
              </div>
              <h3 style="color:#111827;font-size:15px;margin:0 0 12px;">Delivery Address</h3>
              <div style="background:#f9fafb;border-radius:8px;padding:12px;margin-bottom:24px;">
                <p style="color:#374151;font-size:13px;margin:0;">${order.shippingAddress?.name}</p>
                <p style="color:#6b7280;font-size:13px;margin:4px 0 0;">${order.shippingAddress?.address_line_1 || ''}, ${order.shippingAddress?.city || ''}</p>
                <p style="color:#6b7280;font-size:13px;margin:4px 0 0;">${order.shippingAddress?.phone || ''}</p>
              </div>
              <div style="background:#f0fdf4;border-radius:12px;padding:16px;margin-top:24px;text-align:center;">
                <p style="color:#374151;font-size:13px;margin:0;">Need help? WhatsApp us at <strong>+254 712 345 678</strong></p>
              </div>
            </div>
            <div style="text-align:center;padding:16px;">
              <p style="color:#9ca3af;font-size:11px;margin:0;">&copy; 2026 Aroma Line. Nairobi, Kenya.</p>
            </div>
          </div>
        </body>
        </html>
      `
    })
    console.log(`Order confirmation email sent to ${email}`)
  } catch (err) {
    console.error('Email error:', err.message)
  }
}

/**
 * Send new order alert to admin
 */
const sendAdminNewOrderEmail = async (order) => {
  const total = Number(order.grandTotal).toLocaleString()
  const orderNo = order.orderNumber
  const customerName = order.shippingAddress?.name || 'Guest'
  const customerPhone = order.shippingAddress?.phone || 'N/A'
  const customerEmail = order.shippingAddress?.email || 'N/A'
  const payment = order.paymentMethod?.toUpperCase()
  const city = order.shippingAddress?.city || 'N/A'

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New Order ${orderNo} - KES ${total}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;">
          <div style="max-width:600px;margin:0 auto;padding:24px;">
            <div style="background:#111827;border-radius:16px;padding:24px;">
              <h2 style="color:#f472b6;margin:0 0 4px;font-size:18px;">New Order Received!</h2>
              <p style="color:rgba(255,255,255,0.5);margin:0;font-size:12px;">Aroma Line Admin Alert</p>
              <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin-top:16px;">
                <table width="100%" style="border-collapse:collapse;">
                  <tr><td style="color:rgba(255,255,255,0.5);font-size:12px;padding:6px 0;">Order Number</td><td style="color:#f472b6;font-size:13px;font-weight:600;text-align:right;">${orderNo}</td></tr>
                  <tr><td style="color:rgba(255,255,255,0.5);font-size:12px;padding:6px 0;">Customer</td><td style="color:white;font-size:13px;text-align:right;">${customerName}</td></tr>
                  <tr><td style="color:rgba(255,255,255,0.5);font-size:12px;padding:6px 0;">Phone</td><td style="color:white;font-size:13px;text-align:right;">${customerPhone}</td></tr>
                  <tr><td style="color:rgba(255,255,255,0.5);font-size:12px;padding:6px 0;">Email</td><td style="color:white;font-size:13px;text-align:right;">${customerEmail}</td></tr>
                  <tr><td style="color:rgba(255,255,255,0.5);font-size:12px;padding:6px 0;">City</td><td style="color:white;font-size:13px;text-align:right;">${city}</td></tr>
                  <tr><td style="color:rgba(255,255,255,0.5);font-size:12px;padding:6px 0;">Payment</td><td style="color:white;font-size:13px;text-align:right;">${payment}</td></tr>
                  <tr><td style="color:rgba(255,255,255,0.5);font-size:12px;padding:6px 0;border-top:1px solid rgba(255,255,255,0.1);">Total</td><td style="color:#10b981;font-size:16px;font-weight:700;text-align:right;border-top:1px solid rgba(255,255,255,0.1);">KES ${total}</td></tr>
                </table>
              </div>
              <a href="https://minimingle-babyworld.onrender.com" style="display:block;background:linear-gradient(135deg,#db2777,#be185d);color:white;text-align:center;padding:12px;border-radius:8px;margin-top:16px;text-decoration:none;font-size:13px;font-weight:600;">View in Admin Dashboard</a>
            </div>
          </div>
        </body>
        </html>
      `
    })
    console.log(`Admin new order email sent for ${orderNo}`)
  } catch (err) {
    console.error('Admin email error:', err.message)
  }
}

/**
 * Send order status update email to customer
 */
const sendOrderStatusEmail = async (order, newStatus) => {
  const email = order.shippingAddress?.email
  if (!email) return

  const name = order.shippingAddress?.name?.split(' ')[0] || 'Customer'
  const orderNo = order.orderNumber

  const statusConfig = {
    confirmed: { title: 'Order Confirmed!', message: 'Your order has been confirmed and our team is preparing it for delivery.' },
    shipped: { title: 'Order Shipped!', message: 'Great news! Your order is on its way. Our delivery team will contact you shortly.' },
    delivered: { title: 'Order Delivered!', message: 'Your order has been delivered. We hope you and your little one love it!' },
    cancelled: { title: 'Order Cancelled', message: 'Your order has been cancelled. If you made a payment, a refund will be processed within 3-5 business days.' },
  }

  const config = statusConfig[newStatus]
  if (!config) return

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${config.title} - ${orderNo} | Aroma Line`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;">
          <div style="max-width:600px;margin:0 auto;padding:24px;">
            <div style="background:linear-gradient(135deg,#db2777,#be185d);border-radius:16px 16px 0 0;padding:32px;text-align:center;">
              <h1 style="color:white;margin:0;font-size:22px;font-weight:800;">Aroma Line</h1>
            </div>
            <div style="background:white;padding:32px;border-radius:0 0 16px 16px;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
              <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">${config.title}</h2>
              <p style="color:#6b7280;font-size:14px;margin:0 0 16px;">Hi ${name}, ${config.message}</p>
              <div style="background:#fdf2f8;border-radius:12px;padding:16px;">
                <span style="color:#6b7280;font-size:13px;">Order Number: </span>
                <span style="color:#db2777;font-size:13px;font-weight:600;">${orderNo}</span>
              </div>
            </div>
            <div style="text-align:center;padding:16px;">
              <p style="color:#9ca3af;font-size:11px;margin:0;">&copy; 2026 Aroma Line. Nairobi, Kenya.</p>
            </div>
          </div>
        </body>
        </html>
      `
    })
    console.log(`Order status (${newStatus}) email sent to ${email}`)
  } catch (err) {
    console.error('Status email error:', err.message)
  }
}

module.exports = {
  sendOrderConfirmationEmail,
  sendAdminNewOrderEmail,
  sendOrderStatusEmail,
}