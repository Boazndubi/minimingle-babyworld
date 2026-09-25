const express = require('express')
const axios = require('axios')
const prisma = require('../prismaClient')

const router = express.Router()

const MPESA_ENV = (process.env.MPESA_ENV || 'sandbox').toLowerCase()
const BASE_URL = MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke'

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

// Get OAuth access token
async function getAccessToken() {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64')

  const response = await axios.get(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } }
  )

  return response.data.access_token
}

// Generate timestamp in format YYYYMMDDHHmmss
function getTimestamp() {
  const date = new Date()
  const pad = (n) => n.toString().padStart(2, '0')
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  )
}

// Ask Safaricom directly for the real status of an STK push, keyed by
// our own stored CheckoutRequestID. Used by both /query and /callback so
// the callback body is never trusted on its own for marking an order paid.
async function queryTransactionStatus(checkoutRequestId) {
  const accessToken = await getAccessToken()
  const timestamp = getTimestamp()
  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString('base64')

  const response = await axios.post(
    `${BASE_URL}/mpesa/stkpushquery/v1/query`,
    {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  )
  return response.data
}

// INITIATE STK PUSH
router.post('/stkpush', async (req, res) => {
  try {
    const { phone, orderId, orderNumber } = req.body

    if (!phone || !orderId || !orderNumber) {
      return res.status(400).json({ error: 'Phone, orderId and orderNumber are required' })
    }

    const order = await prisma.order.findFirst({ where: { id: orderId, orderNumber }, select: { grandTotal: true, paymentStatus: true } })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    if (order.paymentStatus !== 'pending') return res.status(409).json({ error: 'Order is not awaiting payment' })

    let formattedPhone = phone.replace(/\D/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1)
    } else if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.slice(1)
    }

    const accessToken = await getAccessToken()
    const timestamp = getTimestamp()
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64')

    const response = await axios.post(
      `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(Number(order.grandTotal)),
        PartyA: formattedPhone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: orderNumber || orderId,
        TransactionDesc: `Payment for order ${orderNumber || orderId}`
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    await prisma.order.update({
      where: { id: orderId },
      data: {
        mpesaCheckoutRequestId: response.data.CheckoutRequestID
      }
    })

    res.json({
      success: true,
      checkoutRequestId: response.data.CheckoutRequestID,
      message: 'STK push sent. Check your phone to complete payment.'
    })
  } catch (err) {
    console.error('STK Push error:', err.response?.data || err.message)
    res.status(500).json({
      error: err.response?.data?.errorMessage || 'Failed to initiate payment'
    })
  }
})

// M-PESA CALLBACK
router.post('/callback', async (req, res) => {
  try {
    console.log('M-Pesa callback received:', JSON.stringify(req.body))

    const callback = req.body.Body?.stkCallback
    if (!callback) {
      return res.status(200).json({ message: 'No callback data' })
    }

    const checkoutRequestId = callback.CheckoutRequestID

    const order = await prisma.order.findFirst({
      where: { mpesaCheckoutRequestId: checkoutRequestId }
    })

    if (!order) {
      console.error('Order not found for checkoutRequestId:', checkoutRequestId)
      return res.status(200).json({ message: 'Order not found' })
    }

    if (order.paymentStatus !== 'pending') {
      // Already resolved by an earlier callback/query - avoid reprocessing.
      return res.status(200).json({ message: 'Already processed' })
    }

    // The callback body's ResultCode alone isn't enough to mark an order
    // PAID: the CheckoutRequestID is returned to the frontend in the
    // /stkpush response, so anyone could POST a forged "success" body to
    // this endpoint. So the paid path requires an independent confirmation
    // from Safaricom's own query API before trusting it.
    //
    // The callback reporting its own failure (cancelled, wrong PIN,
    // timeout, insufficient funds) is trusted directly, without a query -
    // there's no way to profit from lying about your own payment failing,
    // so no forgery risk there.
    const callbackResultCode = callback.ResultCode

    if (callbackResultCode !== 0) {
      await markPaymentFailed(order.id)
      console.log(`Order ${order.orderNumber} payment failed. Callback ResultCode: ${callbackResultCode} (${callback.ResultDesc})`)
      return res.status(200).json({ message: 'Callback processed' })
    }

    let verified
    try {
      verified = await queryTransactionStatus(checkoutRequestId)
    } catch (queryErr) {
      console.error('Callback verification query failed:', queryErr.response?.data || queryErr.message)
      // Can't verify right now - leave the order pending rather than
      // trusting the unverified body. The /query fallback can resolve
      // it later.
      return res.status(200).json({ message: 'Verification pending' })
    }

    // Safaricom's query endpoint can briefly return an inconclusive
    // "still processing" result even moments after the callback fires
    // (a known sandbox/production lag). Only a matching success confirms
    // payment; only a recognized terminal failure code confirms failure.
    // Anything else is left pending rather than guessed at, so a real
    // payment is never wrongly marked failed - the /query fallback (or a
    // later retry) resolves it once Safaricom's own systems catch up.
    const verifiedResultCode = Number(verified.ResultCode)
    const TERMINAL_FAILURE_CODES = new Set([1, 1032, 1037, 1025, 2001, 9999])

    if (verifiedResultCode === 0) {
      const metadata = callback.CallbackMetadata?.Item || []
      const mpesaReceiptNumber = metadata.find(i => i.Name === 'MpesaReceiptNumber')?.Value

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'paid',
          status: order.channel === 'in_store' ? 'delivered' : 'confirmed',
          mpesaReceiptNumber: mpesaReceiptNumber?.toString() || null
        }
      })

      console.log(`Order ${order.orderNumber} marked as paid via M-Pesa (verified). Receipt: ${mpesaReceiptNumber}`)
    } else if (TERMINAL_FAILURE_CODES.has(verifiedResultCode)) {
      await markPaymentFailed(order.id)

      console.log(`Order ${order.orderNumber} payment failed. Verified ResultCode: ${verifiedResultCode}`)
    } else {
      console.log(`Order ${order.orderNumber} verification inconclusive (code ${verified.ResultCode}: ${verified.ResultDesc}). Left pending.`)
    }

    res.status(200).json({ message: 'Callback processed' })
  } catch (err) {
    console.error('Callback processing error:', err)
    res.status(200).json({ message: 'Error processed' })
  }
})

// CHECK PAYMENT STATUS
router.get('/status/:orderId', async (req, res) => {
  try {
    if (!req.query.orderNumber) return res.status(400).json({ error: 'orderNumber is required' })
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      select: { orderNumber: true, paymentStatus: true, status: true, mpesaReceiptNumber: true }
    })

    if (!order) return res.status(404).json({ error: 'Order not found' })
    if (order.orderNumber !== req.query.orderNumber) return res.status(404).json({ error: 'Order not found' })

    res.json(order)
  } catch (err) {
    console.error('M-Pesa status check error:', err)
    res.status(500).json({ error: 'Unable to check payment status' })
  }
})

// MANUALLY QUERY STK PUSH STATUS from Safaricom
router.post('/query', async (req, res) => {
  try {
    const { orderId, orderNumber } = req.body
    console.log(`M-Pesa query fallback triggered for order: ${orderId}`)
    if (!orderId || !orderNumber) return res.status(400).json({ error: 'orderId and orderNumber required' })

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    if (order.orderNumber !== orderNumber) return res.status(404).json({ error: 'Order not found' })
    if (!order.mpesaCheckoutRequestId) return res.status(400).json({ error: 'No STK push found for this order' })

    const data = await queryTransactionStatus(order.mpesaCheckoutRequestId)

    console.log(`M-Pesa query response for ${orderId}:`, JSON.stringify(data))

    // Only a matching success confirms payment; only a recognized
    // terminal failure code confirms failure. Safaricom's query endpoint
    // can return an inconclusive "still processing" result while the
    // customer is mid-PIN-entry - that must NOT be treated as a failure,
    // or a payment that succeeds moments later can never be corrected
    // (the callback skips orders that are no longer 'pending').
    const resultCode = Number(data.ResultCode)
    const TERMINAL_FAILURE_CODES = new Set([1, 1032, 1037, 1025, 2001, 9999])

    if (resultCode === 0) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'paid',
          status: order.channel === 'in_store' ? 'delivered' : 'confirmed'
        }
      })
      console.log(`Order ${orderId} marked as paid via query fallback`)
      return res.json({ success: true, message: 'Payment confirmed and order updated', paymentStatus: 'paid' })
    } else if (TERMINAL_FAILURE_CODES.has(resultCode)) {
      const failedOrder = order.paymentStatus === 'pending'
        ? await markPaymentFailed(orderId)
        : order
      return res.json({ success: false, message: data.ResultDesc, paymentStatus: failedOrder.paymentStatus })
    } else {
      // Inconclusive (e.g. still processing) - leave the order pending
      // and tell the frontend to keep waiting/polling rather than
      // reporting a failure that hasn't actually happened.
      return res.json({ success: false, pending: true, message: data.ResultDesc || 'Payment is still being processed', paymentStatus: order.paymentStatus })
    }
  } catch (err) {
    console.error('STK Query error:', err.response?.data || err.message)
    res.status(500).json({ error: err.response?.data?.errorMessage || 'Query failed' })
  }
})

module.exports = router