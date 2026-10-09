const express = require('express')
const axios = require('axios')
const prisma = require('../prismaClient')
const { normalizeKenyanPhone } = require('../utils/phone')
const { sendPaidOrderEmails } = require('../services/emailService')

const router = express.Router()

const MPESA_ENV = (process.env.MPESA_ENV || 'sandbox').toLowerCase()
const BASE_URL = MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke'

// Limit STK pushes per order so the endpoint can't be used to spam a phone
// with payment prompts. In-memory, so it resets on restart - fine as a guard.
const STK_MAX_ATTEMPTS = 3
const STK_WINDOW_MS = 15 * 60 * 1000
const STK_RETRY_AFTER_MS = 60 * 1000
const stkAttempts = new Map()
const TERMINAL_FAILURE_CODES = new Set([1, 1032, 1037, 1025, 2001, 9999])

function allowStkAttempt(orderId) {
  const now = Date.now()
  const recent = (stkAttempts.get(orderId) || []).filter(t => now - t < STK_WINDOW_MS)
  if (recent.length >= STK_MAX_ATTEMPTS) {
    stkAttempts.set(orderId, recent)
    return false
  }
  recent.push(now)
  stkAttempts.set(orderId, recent)
  return true
}

// Get OAuth access token
async function getAccessToken() {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64')

  const response = await axios.get(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` }, timeout: 10000 }
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
      timeout: 10000,
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

    const order = await prisma.order.findFirst({
      where: { id: orderId, orderNumber },
      select: {
        grandTotal: true,
        paymentStatus: true,
        channel: true,
        paymentMethod: true,
        mpesaCheckoutRequestId: true,
        mpesaAttemptStatus: true,
        updatedAt: true
      }
    })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    if (order.paymentStatus !== 'pending') return res.status(409).json({ error: 'Order is not awaiting payment' })
    if (order.paymentMethod && order.paymentMethod !== 'mpesa') {
      return res.status(409).json({ error: 'This order is not set to pay with M-Pesa' })
    }

    const formattedPhone = normalizeKenyanPhone(phone)
    if (!formattedPhone) {
      return res.status(400).json({ error: 'Enter a valid Safaricom number, e.g. 0712345678' })
    }

    if (order.mpesaCheckoutRequestId && order.mpesaAttemptStatus !== 'failed') {
      const previousAttemptIsStale = Date.now() - order.updatedAt.getTime() >= STK_RETRY_AFTER_MS
      try {
        const previousAttempt = await queryTransactionStatus(order.mpesaCheckoutRequestId)
        const resultCode = Number(previousAttempt.ResultCode)
        if (resultCode === 0) {
          const paid = await prisma.order.updateMany({
            where: { id: orderId, paymentStatus: 'pending' },
            data: {
              paymentStatus: 'paid',
              status: order.channel === 'in_store' ? 'delivered' : 'confirmed',
              mpesaAttemptStatus: 'paid',
              mpesaAttemptMessage: null
            }
          })
          if (paid.count === 1) {
            sendPaidOrderEmails(orderId).catch(err => console.error('Paid order email error:', err))
          }
          return res.status(409).json({ error: 'Payment was already confirmed. Please refresh your order status.' })
        }
        if (TERMINAL_FAILURE_CODES.has(resultCode)) {
          await prisma.order.updateMany({
            where: { id: orderId, paymentStatus: 'pending', mpesaCheckoutRequestId: order.mpesaCheckoutRequestId },
            data: {
              mpesaAttemptStatus: 'failed',
              mpesaAttemptMessage: previousAttempt.ResultDesc || 'The previous M-Pesa request was not completed.'
            }
          })
        } else {
          if (!previousAttemptIsStale) {
            return res.status(409).json({ error: 'The previous M-Pesa request is still processing. Please wait before requesting another prompt.' })
          }
          console.warn(`Previous M-Pesa attempt for order ${orderNumber} is still inconclusive after 60 seconds; allowing retry`)
        }
      } catch (queryErr) {
        const info = describeDarajaError(queryErr)
        console.error('Previous STK verification failed:', info.text)
        if (!previousAttemptIsStale) {
          return res.status(503).json({ error: 'Unable to confirm the previous M-Pesa prompt yet. Please wait and try again.' })
        }
        console.warn(`Previous M-Pesa attempt for order ${orderNumber} is older than 60 seconds; allowing retry despite status-query failure`)
      }
    }

    if (!allowStkAttempt(orderId)) {
      return res.status(429).json({ error: 'Too many payment attempts for this order. Please wait a few minutes and try again.' })
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
        timeout: 15000,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    if (String(response.data.ResponseCode) !== '0' || !response.data.CheckoutRequestID) {
      console.error('Safaricom rejected STK push:', response.data)
      return res.status(502).json({
        error: response.data.CustomerMessage || response.data.ResponseDescription || 'Safaricom did not accept the M-Pesa prompt.'
      })
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        mpesaCheckoutRequestId: response.data.CheckoutRequestID,
        mpesaCheckoutRequestIds: { push: response.data.CheckoutRequestID },
        mpesaAttemptStatus: 'pending',
        mpesaAttemptMessage: null
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
      where: {
        OR: [
          { mpesaCheckoutRequestId: checkoutRequestId },
          { mpesaCheckoutRequestIds: { has: checkoutRequestId } }
        ]
      }
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
    const callbackResultCode = Number(callback.ResultCode)

    if (callbackResultCode !== 0) {
      if (order.mpesaCheckoutRequestId === checkoutRequestId) {
        await prisma.order.updateMany({
          where: { id: order.id, paymentStatus: 'pending', mpesaCheckoutRequestId: checkoutRequestId },
          data: {
            mpesaAttemptStatus: 'failed',
            mpesaAttemptMessage: callback.ResultDesc || 'The M-Pesa request was not completed.'
          }
        })
      }
      console.log(`Order ${order.orderNumber} M-Pesa attempt failed. Callback ResultCode: ${callbackResultCode} (${callback.ResultDesc})`)
      return res.status(200).json({ message: 'Callback processed' })
    }

    let verified
    try {
      verified = await queryTransactionStatus(checkoutRequestId)
    } catch (queryErr) {
      console.error('Callback verification query failed:', describeDarajaError(queryErr).text)
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

      const paid = await prisma.order.updateMany({
        where: { id: order.id, paymentStatus: 'pending' },
        data: {
          paymentStatus: 'paid',
          status: order.channel === 'in_store' ? 'delivered' : 'confirmed',
          mpesaAttemptStatus: 'paid',
          mpesaAttemptMessage: null,
          mpesaReceiptNumber: mpesaReceiptNumber?.toString() || null
        }
      })

      if (paid.count === 1) {
        sendPaidOrderEmails(order.id).catch(err => console.error('Paid order email error:', err))
      }
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
      select: {
        orderNumber: true,
        paymentStatus: true,
        status: true,
        mpesaReceiptNumber: true,
        mpesaAttemptStatus: true,
        mpesaAttemptMessage: true
      }
    })

    if (!order) return res.status(404).json({ error: 'Order not found' })
    if (order.orderNumber !== req.query.orderNumber) return res.status(404).json({ error: 'Order not found' })

    res.json(order)
  } catch (err) {
    console.error('M-Pesa status check error:', err)
    res.status(500).json({ error: 'Unable to check payment status' })
  }
})

// Safaricom's gateway (Imperva/Incapsula) blocks clients that query too often and
// answers with an HTML block page instead of JSON. Keep our own spacing between
// queries for the same order, and report errors in one readable line.
const QUERY_MIN_INTERVAL_MS = 10 * 1000
const lastQueryAt = new Map()

function describeDarajaError(err) {
  const data = err.response?.data
  if (typeof data === 'string' && data.trim().startsWith('<')) {
    return { blocked: true, text: `Safaricom blocked or rate-limited the request (HTTP ${err.response.status}). Slow down STK queries.` }
  }
  if (data && typeof data === 'object') {
    return { code: data.errorCode, text: data.errorMessage || JSON.stringify(data) }
  }
  return { text: err.message }
}

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

    // Already resolved, or asked too recently: answer from our own records.
    const sinceLast = Date.now() - (lastQueryAt.get(orderId) || 0)
    if (order.paymentStatus !== 'pending' || sinceLast < QUERY_MIN_INTERVAL_MS) {
      return res.json({
        success: order.paymentStatus === 'paid',
        pending: order.paymentStatus === 'pending',
        paymentStatus: order.paymentStatus,
        mpesaAttemptStatus: order.mpesaAttemptStatus,
        mpesaAttemptMessage: order.mpesaAttemptMessage
      })
    }
    lastQueryAt.set(orderId, Date.now())

    const data = await queryTransactionStatus(order.mpesaCheckoutRequestId)

    console.log(`M-Pesa query response for ${orderId}:`, JSON.stringify(data))

    // Only a matching success confirms payment; only a recognized
    // terminal failure code confirms failure. Safaricom's query endpoint
    // can return an inconclusive "still processing" result while the
    // customer is mid-PIN-entry - that must NOT be treated as a failure,
    // or a payment that succeeds moments later can never be corrected
    // (the callback skips orders that are no longer 'pending').
    const resultCode = Number(data.ResultCode)
    if (resultCode === 0) {
      const paid = await prisma.order.updateMany({
        where: { id: orderId, paymentStatus: 'pending' },
        data: {
          paymentStatus: 'paid',
          status: order.channel === 'in_store' ? 'delivered' : 'confirmed',
          mpesaAttemptStatus: 'paid',
          mpesaAttemptMessage: null
        }
      })
      if (paid.count === 1) {
        sendPaidOrderEmails(orderId).catch(err => console.error('Paid order email error:', err))
      }
      console.log(`Order ${orderId} marked as paid via query fallback`)
      return res.json({ success: true, message: 'Payment confirmed and order updated', paymentStatus: 'paid' })
    } else if (TERMINAL_FAILURE_CODES.has(resultCode)) {
      const message = data.ResultDesc || 'The M-Pesa request was not completed.'
      await prisma.order.updateMany({
        where: { id: orderId, paymentStatus: 'pending', mpesaCheckoutRequestId: order.mpesaCheckoutRequestId },
        data: { mpesaAttemptStatus: 'failed', mpesaAttemptMessage: message }
      })
      return res.json({
        success: false,
        message,
        paymentStatus: 'pending',
        mpesaAttemptStatus: 'failed',
        mpesaAttemptMessage: message
      })
    } else {
      // Inconclusive (e.g. still processing) - leave the order pending
      // and tell the frontend to keep waiting/polling rather than
      // reporting a failure that hasn't actually happened.
      return res.json({
        success: false,
        pending: true,
        message: data.ResultDesc || 'Payment is still being processed',
        paymentStatus: order.paymentStatus,
        mpesaAttemptStatus: order.mpesaAttemptStatus,
        mpesaAttemptMessage: order.mpesaAttemptMessage
      })
    }
  } catch (err) {
    const info = describeDarajaError(err)
    console.error('STK Query error:', info.text)
    if (info.blocked) {
      return res.status(503).json({ error: 'Safaricom is busy right now. Your payment status will update shortly.', retryable: true })
    }
    // "The transaction does not exist" usually means Safaricom hasn't registered the
    // request yet (or the callback URL/credentials don't match). It is not a failure:
    // keep the order pending and let the next poll or the callback settle it.
    if (info.code === '500.001.1001') {
      return res.json({ success: false, pending: true, message: info.text })
    }
    res.status(500).json({ error: info.text || 'Query failed' })
  }
})

module.exports = router