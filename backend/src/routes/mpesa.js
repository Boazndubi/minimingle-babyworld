const express = require('express')
const axios = require('axios')
const prisma = require('../prismaClient')

const router = express.Router()

const BASE_URL = 'https://sandbox.safaricom.co.ke'

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

// INITIATE STK PUSH
router.post('/stkpush', async (req, res) => {
  try {
    const { phone, amount, orderId, orderNumber } = req.body

    if (!phone || !amount || !orderId) {
      return res.status(400).json({ error: 'Phone, amount and orderId are required' })
    }

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
        Amount: Math.round(amount),
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
    const resultCode = callback.ResultCode

    const order = await prisma.order.findFirst({
      where: { mpesaCheckoutRequestId: checkoutRequestId }
    })

    if (!order) {
      console.error('Order not found for checkoutRequestId:', checkoutRequestId)
      return res.status(200).json({ message: 'Order not found' })
    }

    if (resultCode === 0) {
      const metadata = callback.CallbackMetadata?.Item || []
      const mpesaReceiptNumber = metadata.find(i => i.Name === 'MpesaReceiptNumber')?.Value

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'paid',
          status: 'confirmed',
          mpesaReceiptNumber: mpesaReceiptNumber?.toString() || null
        }
      })

      console.log(`Order ${order.orderNumber} marked as paid via M-Pesa. Receipt: ${mpesaReceiptNumber}`)
    } else {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'failed' }
      })

      console.log(`Order ${order.orderNumber} payment failed. ResultCode: ${resultCode}`)
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
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      select: { paymentStatus: true, status: true, mpesaReceiptNumber: true }
    })

    if (!order) return res.status(404).json({ error: 'Order not found' })

    res.json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router