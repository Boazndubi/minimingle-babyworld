const AfricasTalking = require('africastalking')

const at = AfricasTalking({
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME,
})

const sms = at.SMS

/**
 * Send SMS notification
 * @param {string|string[]} to - Phone number(s) e.g. "+254712345678"
 * @param {string} message - SMS message text
 */
const sendSMS = async (to, message) => {
  try {
    const recipients = Array.isArray(to) ? to : [to]
    
    // Format phone numbers to international format
    const formatted = recipients.map(phone => {
      phone = phone.replace(/\s/g, '')
      if (phone.startsWith('0')) return '+254' + phone.slice(1)
      if (phone.startsWith('254')) return '+' + phone
      if (phone.startsWith('+254')) return phone
      return phone
    })

    const result = await sms.send({
  to: formatted,
  message,
})

    console.log('SMS sent:', JSON.stringify(result))
    return result
  } catch (err) {
    console.error('SMS error:', err.message)
    // Don't throw — SMS failure should never break order flow
  }
}

/**
 * Notify customer when order is placed
 */
const sendOrderConfirmationSMS = async (order) => {
  const phone = order.shippingAddress?.phone
  if (!phone) return

  const name = order.shippingAddress?.name?.split(' ')[0] || 'Customer'
  const total = Number(order.grandTotal).toLocaleString()
  const orderNo = order.orderNumber

  const message = `Hi ${name}! Your Aroma Line order ${orderNo} has been received. Total: KES ${total}. We will contact you shortly to confirm delivery. Thank you for shopping with us!`

  await sendSMS(phone, message)
}

/**
 * Notify admin when a new order is placed
 */
const sendAdminNewOrderSMS = async (order, adminPhone) => {
  if (!adminPhone) return

  const total = Number(order.grandTotal).toLocaleString()
  const orderNo = order.orderNumber
  const customerName = order.shippingAddress?.name || 'Guest'
  const payment = order.paymentMethod?.toUpperCase()

  const message = `New Order Alert! Order ${orderNo} from ${customerName}. Amount: KES ${total}. Payment: ${payment}. Login to admin to process.`

  await sendSMS(adminPhone, message)
}

/**
 * Notify customer when order status changes
 */
const sendOrderStatusSMS = async (order, newStatus) => {
  const phone = order.shippingAddress?.phone
  if (!phone) return

  const name = order.shippingAddress?.name?.split(' ')[0] || 'Customer'
  const orderNo = order.orderNumber

  const statusMessages = {
    confirmed: `Hi ${name}! Your order ${orderNo} has been confirmed and is being prepared. We will notify you once it ships.`,
    shipped: `Hi ${name}! Great news! Your order ${orderNo} is on its way. Our delivery team will contact you shortly.`,
    delivered: `Hi ${name}! Your order ${orderNo} has been delivered. We hope you love your purchase! For support: +254712345678`,
    cancelled: `Hi ${name}! Your order ${orderNo} has been cancelled. If you paid, a refund will be processed within 3-5 business days. Call us: +254712345678`,
  }

  const message = statusMessages[newStatus]
  if (!message) return

  await sendSMS(phone, message)
}

module.exports = {
  sendSMS,
  sendOrderConfirmationSMS,
  sendAdminNewOrderSMS,
  sendOrderStatusSMS,
}