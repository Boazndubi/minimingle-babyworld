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
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Your Aroma Line Order Confirmation</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 600px) {
      .mobile-padding { padding: 20px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
      .mobile-center { text-align: center !important; }
      .mobile-hide { display: none !important; }
      .mobile-full { width: 100% !important; max-width: 100% !important; }
      h1 { font-size: 22px !important; }
      h2 { font-size: 18px !important; }
      .mobile-mb-16 { margin-bottom: 16px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  
  <!-- Preview Text -->
  <div style="display:none;font-size:1px;color:#f3f4f6;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    Order #${orderNo} confirmed! Your baby essentials are being prepared for delivery.
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        
        <!-- Main Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#db2777 0%,#be185d 50%,#9d174d 100%);padding:40px 32px;text-align:center;" class="mobile-padding">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="text-align:center;">
                    <!-- Baby Icon SVG -->
                    <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:16px;margin:0 auto 16px;display:inline-block;line-height:56px;">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;">
                        <path d="M12 2a3 3 0 0 0-3 3v2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3V5a3 3 0 0 0-3-3z"/>
                        <path d="M9 13h6"/>
                        <path d="M9 17h6"/>
                        <circle cx="12" cy="7" r="1"/>
                      </svg>
                    </div>
                    <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Aroma Line</h1>
                    <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;font-weight:500;">Premium Baby Products</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Confirmation Banner -->
          <tr>
            <td style="padding:32px 32px 0;" class="mobile-padding">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="text-align:center;">
                    <div style="width:64px;height:64px;background:#fdf2f8;border-radius:50%;margin:0 auto 20px;display:inline-block;line-height:64px;">
                      <!-- Checkmark Icon SVG -->
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#db2777" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    </div>
                    <h2 style="color:#111827;margin:0 0 8px;font-size:24px;font-weight:700;letter-spacing:-0.3px;">Order Confirmed!</h2>
                    <p style="color:#6b7280;margin:0;font-size:15px;line-height:1.6;">Hi <strong style="color:#111827;">${name}</strong>, thank you for choosing Aroma Line. We've received your order and our team is carefully packing your items.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Order Status Tracker -->
          <tr>
            <td style="padding:32px;" class="mobile-padding">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <!-- Progress Line Background -->
                        <td style="position:relative;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="border-top:3px solid #e5e7eb;padding-top:14px;"></td>
                            </tr>
                          </table>
                          <!-- Active Progress (adjust width for status) -->
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="12%" style="position:absolute;top:0;left:0;">
                            <tr><td style="border-top:3px solid #db2777;padding-top:14px;"></td></tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <!-- Step 1: Ordered -->
                              <td style="text-align:center;width:25%;">
                                <div style="width:32px;height:32px;background:#db2777;border-radius:50%;margin:0 auto 8px;line-height:32px;border:3px solid #fce7f3;">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;">
                                    <polyline points="20 6 9 17 4 12"/>
                                  </svg>
                                </div>
                                <p style="margin:0;font-size:11px;color:#db2777;font-weight:600;">Ordered</p>
                              </td>
                              <!-- Step 2: Packed -->
                              <td style="text-align:center;width:25%;">
                                <div style="width:32px;height:32px;background:#ffffff;border:3px solid #e5e7eb;border-radius:50%;margin:0 auto 8px;line-height:32px;">
                                  <span style="color:#9ca3af;font-size:14px;font-weight:700;">2</span>
                                </div>
                                <p style="margin:0;font-size:11px;color:#9ca3af;">Packed</p>
                              </td>
                              <!-- Step 3: Shipped -->
                              <td style="text-align:center;width:25%;">
                                <div style="width:32px;height:32px;background:#ffffff;border:3px solid #e5e7eb;border-radius:50%;margin:0 auto 8px;line-height:32px;">
                                  <span style="color:#9ca3af;font-size:14px;font-weight:700;">3</span>
                                </div>
                                <p style="margin:0;font-size:11px;color:#9ca3af;">Shipped</p>
                              </td>
                              <!-- Step 4: Delivered -->
                              <td style="text-align:center;width:25%;">
                                <div style="width:32px;height:32px;background:#ffffff;border:3px solid #e5e7eb;border-radius:50%;margin:0 auto 8px;line-height:32px;">
                                  <span style="color:#9ca3af;font-size:14px;font-weight:700;">4</span>
                                </div>
                                <p style="margin:0;font-size:11px;color:#9ca3af;">Delivered</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Order Summary Card -->
          <tr>
            <td style="padding:0 32px 24px;" class="mobile-padding">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#fdf2f8;border-radius:16px;border:1px solid #fce7f3;">
                <tr>
                  <td style="padding:20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom:12px;border-bottom:1px solid #fce7f3;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="width:50%;" class="mobile-stack mobile-center">
                                <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Order Number</p>
                                <p style="margin:0;color:#db2777;font-size:16px;font-weight:700;font-family:'Courier New',monospace;">${orderNo}</p>
                              </td>
                              <td style="width:50%;text-align:right;" class="mobile-stack mobile-center">
                                <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Order Date</p>
                                <p style="margin:0;color:#111827;font-size:14px;font-weight:600;">${new Date().toLocaleDateString('en-GB')}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:12px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="width:50%;" class="mobile-stack mobile-center">
                                <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Payment</p>
                                <p style="margin:0;color:#111827;font-size:14px;font-weight:600;">${order.paymentMethod?.toUpperCase()}</p>
                              </td>
                              <td style="width:50%;text-align:right;" class="mobile-stack mobile-center">
                                <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Total</p>
                                <p style="margin:0;color:#111827;font-size:20px;font-weight:800;">KES ${total}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:0 32px 32px;text-align:center;" class="mobile-padding">
              <a href="#" style="display:inline-block;background:linear-gradient(135deg,#db2777,#be185d);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:15px;font-weight:700;box-shadow:0 4px 12px rgba(219,39,119,0.3);letter-spacing:0.3px;">Track Your Order</a>
              <p style="margin:12px 0 0;color:#9ca3af;font-size:12px;">Or copy: <span style="color:#6b7280;font-family:monospace;">aromaline.co.ke/orders/${orderNo}</span></p>
            </td>
          </tr>

          <!-- Items Section -->
          <tr>
            <td style="padding:0 32px 24px;" class="mobile-padding">
              <h3 style="color:#111827;margin:0 0 16px;font-size:16px;font-weight:700;">Order Items (${order.items?.length || 1})</h3>
              
              <!-- Item Row (Repeat for each item) -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f9fafb;border-radius:12px;margin-bottom:12px;border:1px solid #f3f4f6;">
                <tr>
                  <td style="padding:16px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <!-- Product Image -->
                        <td style="width:72px;vertical-align:top;" class="mobile-hide">
                          <div style="width:72px;height:72px;background:#ffffff;border-radius:10px;border:1px solid #e5e7eb;overflow:hidden;">
                            <img src="${item.image || 'https://via.placeholder.com/72x72/fdf2f8/db2777?text=AL'}" alt="${item.name}" width="72" height="72" style="display:block;width:72px;height:72px;object-fit:cover;">
                          </div>
                        </td>
                        <td style="width:16px;" class="mobile-hide"></td>
                        <!-- Product Details -->
                        <td style="vertical-align:top;">
                          <p style="margin:0 0 4px;color:#111827;font-size:14px;font-weight:700;line-height:1.4;">${item.name || 'Premium Baby Product'}</p>
                          <p style="margin:0 0 8px;color:#9ca3af;font-size:12px;">Qty: ${item.quantity || 1}</p>
                          <p style="margin:0;color:#db2777;font-size:14px;font-weight:700;">KES ${item.price || '0.00'}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Delivery Info -->
          <tr>
            <td style="padding:0 32px 24px;" class="mobile-padding">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="width:48%;vertical-align:top;" class="mobile-stack mobile-mb-16">
                    <h3 style="color:#111827;margin:0 0 12px;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Delivery Address</h3>
                    <div style="background:#f9fafb;border-radius:12px;padding:16px;border:1px solid #f3f4f6;">
                      <p style="margin:0 0 4px;color:#111827;font-size:14px;font-weight:600;">${order.shippingAddress?.name || name}</p>
                      <p style="margin:0 0 4px;color:#6b7280;font-size:13px;line-height:1.5;">${order.shippingAddress?.address_line_1 || ''}${order.shippingAddress?.address_line_2 ? ', ' + order.shippingAddress.address_line_2 : ''}</p>
                      <p style="margin:0 0 4px;color:#6b7280;font-size:13px;">${order.shippingAddress?.city || ''}${order.shippingAddress?.postal_code ? ', ' + order.shippingAddress.postal_code : ''}</p>
                      <p style="margin:8px 0 0;color:#374151;font-size:13px;font-weight:600;">
                        <!-- Phone Icon SVG -->
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:text-bottom;margin-right:4px;">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                        ${order.shippingAddress?.phone || ''}
                      </p>
                    </div>
                  </td>
                  <td style="width:4%;" class="mobile-hide"></td>
                  <td style="width:48%;vertical-align:top;" class="mobile-stack">
                    <h3 style="color:#111827;margin:0 0 12px;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Estimated Delivery</h3>
                    <div style="background:#f0fdf4;border-radius:12px;padding:16px;border:1px solid #dcfce7;text-align:center;">
                      <!-- Truck Icon SVG -->
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:8px;">
                        <rect x="1" y="3" width="15" height="13"/>
                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                        <circle cx="5.5" cy="18.5" r="2.5"/>
                        <circle cx="18.5" cy="18.5" r="2.5"/>
                      </svg>
                      <p style="margin:0 0 4px;color:#166534;font-size:16px;font-weight:700;">${new Date(Date.now() + 3*86400000).toLocaleDateString('en-GB', {weekday:'long', day:'numeric', month:'short'})}</p>
                      <p style="margin:0;color:#22c55e;font-size:12px;font-weight:600;">Standard Delivery (1-3 days)</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- WhatsApp Help Section -->
          <tr>
            <td style="padding:0 32px 32px;" class="mobile-padding">
              <a href="https://wa.me/254712345678?text=Hi%20Aroma%20Line%2C%20I%20need%20help%20with%20order%20%23${orderNo}" style="text-decoration:none;display:block;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f0fdf4;border-radius:16px;border:1px solid #dcfce7;">
                  <tr>
                    <td style="padding:24px;text-align:center;">
                      <!-- WhatsApp Logo SVG -->
                      <div style="width:48px;height:48px;background:#25D366;border-radius:50%;margin:0 auto 12px;line-height:48px;">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="#ffffff" style="vertical-align:middle;">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </div>
                      <p style="margin:0 0 6px;color:#166534;font-size:15px;font-weight:700;">Need Help?</p>
                      <p style="margin:0 0 4px;color:#15803d;font-size:14px;font-weight:600;">WhatsApp us at <span style="color:#166534;">+254 712 345 678</span></p>
                      <p style="margin:12px 0 0;color:#22c55e;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Click to Chat Now &rarr;</p>
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:32px;text-align:center;border-top:1px solid #f3f4f6;" class="mobile-padding">
              <p style="margin:0 0 8px;color:#9ca3af;font-size:12px;line-height:1.6;">
                Aroma Line Premium Baby Products<br>
                Nairobi, Kenya
              </p>
              <p style="margin:16px 0 0;color:#d1d5db;font-size:11px;">
                &copy; 2026 Aroma Line. All rights reserved.<br>
                <a href="#" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a> &middot; 
                <a href="#" style="color:#9ca3af;text-decoration:underline;">Privacy Policy</a>
              </p>
            </td>
          </tr>

        </table>
        
      </td>
    </tr>
  </table>

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
              <a href="https://minimingle-babyworld.vercel.app/orders" style="display:block;background:linear-gradient(135deg,#db2777,#be185d);color:white;text-align:center;padding:12px;border-radius:8px;margin-top:16px;text-decoration:none;font-size:13px;font-weight:600;">View in Admin Dashboard</a>
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