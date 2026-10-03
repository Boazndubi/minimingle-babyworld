const express = require('express')
const axios = require('axios')
const prisma = require('../prismaClient')

const router = express.Router()

async function markPaymentFailed(orderId) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    })
    if (!order || order.paymentStatus !== 'pending') return order

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { increment: item.quantity } }
      })
    }
    return tx.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'failed', status: 'cancelled' }
    })
  })
}

const BASE_URL = process.env.PESAPAL_BASE_URL

// Get OAuth token from Pesapal
async function getAccessToken() {
  const response = await axios.post(`${BASE_URL}/api/Auth/RequestToken`, {
    consumer_key: process.env.PESAPAL_CONSUMER_KEY,
    consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
  }, {
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
  })
  return response.data.token
}

// Register IPN URL with Pesapal (do this once)
async function registerIPN(token) {
  const response = await axios.post(`${BASE_URL}/api/URLSetup/RegisterIPN`, {
    url: process.env.IPN_URL,
    ipn_notification_type: 'GET'
  }, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  })
  return response.data.ipn_id
}

// INITIATE PAYMENT
router.post('/initiate', async (req, res) => {
  try {
    const { orderId, orderNumber, phone, email, firstName, lastName } = req.body

    if (!orderId || !orderNumber) {
      return res.status(400).json({ error: 'orderId and orderNumber are required' })
    }

    const order = await prisma.order.findFirst({ where: { id: orderId, orderNumber }, select: { grandTotal: true, paymentStatus: true } })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    if (order.paymentStatus !== 'pending') return res.status(409).json({ error: 'Order is not awaiting payment' })

    const token = await getAccessToken()
    const ipnId = await registerIPN(token)

    const response = await axios.post(`${BASE_URL}/api/Transactions/SubmitOrderRequest`, {
      id: orderNumber,
      currency: 'KES',
      amount: Number(order.grandTotal),
      description: `Payment for order ${orderNumber}`,
      callback_url: process.env.PESAPAL_CALLBACK_URL,
      notification_id: ipnId,
      billing_address: {
        phone_number: phone || '',
        email_address: email || '',
        first_name: firstName || 'Customer',
        last_name: lastName || ''
      }
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    // Save the Pesapal order tracking id to our order
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentRef: response.data.order_tracking_id }
    })

    res.json({
      success: true,
      redirectUrl: response.data.redirect_url,
      orderTrackingId: response.data.order_tracking_id
    })
  } catch (err) {
    console.error('Pesapal initiate error:', err.response?.data || err.message)
    res.status(500).json({ error: 'Failed to initiate payment' })
  }
})

// Ask Pesapal for the real status of a transaction and apply it to our order.
//
// Never trust the query string alone: OrderTrackingId and
// OrderMerchantReference both arrive from the browser/URL, so someone could pair
// the tracking id of a cheap paid order with the reference of an expensive one.
// The order is therefore found by the tracking id we stored ourselves at
// initiate time, and Pesapal's own response must agree on the merchant
// reference and cover the amount we expect.
async function verifyAndApplyPesapalStatus(orderTrackingId, merchantReference) {
  if (!orderTrackingId) return { order: null, outcome: 'invalid' }

  const order = await prisma.order.findFirst({ where: { paymentRef: String(orderTrackingId) } })
  if (!order) return { order: null, outcome: 'unknown_order' }
  if (merchantReference && merchantReference !== order.orderNumber) {
    console.error(`Pesapal reference mismatch for tracking id ${orderTrackingId}: got ${merchantReference}, expected ${order.orderNumber}`)
    return { order, outcome: 'mismatch' }
  }

  const token = await getAccessToken()
  const statusRes = await axios.get(
    `${BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
    { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } }
  )
  const status = statusRes.data

  if (status.merchant_reference && status.merchant_reference !== order.orderNumber) {
    console.error(`Pesapal status reference mismatch for ${order.orderNumber}: ${status.merchant_reference}`)
    return { order, outcome: 'mismatch' }
  }

  // Already resolved earlier (e.g. callback and IPN both fire): don't redo it.
  if (order.paymentStatus === 'paid') return { order, outcome: 'paid' }
  if (order.paymentStatus !== 'pending') return { order, outcome: order.paymentStatus }

  if (status.payment_status_description === 'Completed') {
    const paidAmount = Number(status.amount)
    if (!Number.isFinite(paidAmount) || paidAmount < Number(order.grandTotal)) {
      console.error(`Pesapal amount mismatch for ${order.orderNumber}: paid ${status.amount}, expected ${order.grandTotal}`)
      return { order, outcome: 'amount_mismatch' }
    }
    // updateMany with a paymentStatus guard makes this safe if two requests race.
    await prisma.order.updateMany({
      where: { id: order.id, paymentStatus: 'pending' },
      data: {
        paymentStatus: 'paid',
        status: order.channel === 'in_store' ? 'delivered' : 'confirmed'
      }
    })
    return { order, outcome: 'paid' }
  }

  if (status.payment_status_description === 'Failed') {
    await markPaymentFailed(order.id)
    return { order, outcome: 'failed' }
  }

  return { order, outcome: 'pending' }
}

// CALLBACK (customer redirected here after payment)
router.get('/callback', async (req, res) => {
  try {
    const { OrderTrackingId, OrderMerchantReference } = req.query
    const { order, outcome } = await verifyAndApplyPesapalStatus(OrderTrackingId, OrderMerchantReference)

    if (order && outcome === 'paid') {
      return res.redirect(`${process.env.STORE_URL}/order-success?order=${encodeURIComponent(order.orderNumber)}`)
    }
    if (order) {
      return res.redirect(`${process.env.STORE_URL}/order-failed?order=${encodeURIComponent(order.orderNumber)}`)
    }
    res.redirect(`${process.env.STORE_URL}/order-failed`)
  } catch (err) {
    console.error('Pesapal callback error:', err.message)
    res.redirect(`${process.env.STORE_URL}/order-failed`)
  }
})

// IPN (Pesapal notifies us of payment status changes)
router.get('/ipn', async (req, res) => {
  const { orderTrackingId, orderMerchantReference } = req.query
  try {
    const { order, outcome } = await verifyAndApplyPesapalStatus(orderTrackingId, orderMerchantReference)
    if (order && outcome === 'paid') console.log(`Order ${order.orderNumber} paid via Pesapal (verified)`)
  } catch (err) {
    console.error('Pesapal IPN error:', err.message)
  }
  res.status(200).json({ orderNotificationType: 'IPNCHANGE', orderTrackingId, orderMerchantReference, status: 200 })
})

// CHECK PAYMENT STATUS
router.get('/status/:orderId', async (req, res) => {
  try {
    if (!req.query.orderNumber) return res.status(400).json({ error: 'orderNumber is required' })
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      select: { paymentStatus: true, status: true, orderNumber: true }
    })
    if (!order || order.orderNumber !== req.query.orderNumber) return res.status(404).json({ error: 'Order not found' })
    res.json(order)
  } catch (err) {
    console.error('Pesapal status check error:', err)
    res.status(500).json({ error: 'Unable to check payment status' })
  }
})

module.exports = router