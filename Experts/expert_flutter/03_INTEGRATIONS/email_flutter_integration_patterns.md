# Email Service Flutter Integration Patterns
## The Art Deco Bakery - Flutter Application

### Overview
Email delivery via **Nodemailer + SMTP**. All emails triggered through Parse Server Cloud Functions for security and reliability.

---

## 1. Architecture

**Technology Stack**: Nodemailer + SMTP (Gmail, AWS SES, Ethereal, etc.)

```
Flutter App Event      Parse Cloud Function    Nodemailer SMTP      Customer Email
(Order Created)  →     (Validate + Prepare)  →  (Send via SMTP)   →  Inbox
```

---

## 2. Setup

### Environment Variables (.env)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=orders@artdecobakery.com
EMAIL_FROM_NAME=The Gilded Crust
```

### Installation
```javascript
npm install nodemailer dotenv
```

---

## 3. Implementation

### 3.1 Email Service (Backend)

```javascript
// /parse-server/cloud/utils/emailService.js

const nodemailer = require('nodemailer');
require('dotenv').config();

// Create SMTP transporter (reusable)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
});

// Send order confirmation
async function sendOrderConfirmationEmail(orderData) {
  const {
    customerEmail,
    customerName,
    orderNumber,
    total,
    items,
    orderDate,
    estimatedDeliveryStart,
    estimatedDeliveryEnd,
  } = orderData;

  // Build items HTML
  const itemsHTML = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #FFF5CC;">
        <strong>${item.productName || item.name}</strong>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #FFF5CC; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #FFF5CC; text-align: right;">
        £${((item.price || 0) * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  // Build HTML email (branded template)
  const emailHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Order Confirmation</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #FFF9E6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFF9E6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #2C3E50; font-size: 32px; font-weight: bold;">The Gilded Crust</h1>
                    <p style="margin: 10px 0 0 0; color: #2C3E50; font-size: 14px; letter-spacing: 2px;">ARTISAN BAKERY</p>
                  </td>
                </tr>

                <!-- Confirmation -->
                <tr>
                  <td style="padding: 40px 30px; text-align: center;">
                    <h2 style="margin: 0 0 10px 0; color: #2C3E50; font-size: 28px;">Payment Confirmed!</h2>
                    <p style="margin: 0; color: #666; font-size: 16px;">Thank you for your order, ${customerName}</p>
                  </td>
                </tr>

                <!-- Order Number -->
                <tr>
                  <td style="padding: 0 30px 30px 30px; text-align: center;">
                    <div style="background-color: #FFF5CC; padding: 20px; border-radius: 8px; border: 2px dashed #D4AF37;">
                      <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">Order Number</p>
                      <p style="margin: 0; color: #2C3E50; font-size: 24px; font-weight: bold;">${orderNumber}</p>
                    </div>
                  </td>
                </tr>

                <!-- Items Table -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <h3 style="margin: 0 0 15px 0; color: #2C3E50;">Your Order</h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #FFF5CC; border-radius: 8px;">
                      <thead>
                        <tr style="background-color: #FFF5CC;">
                          <th style="padding: 12px; text-align: left; color: #2C3E50;">Item</th>
                          <th style="padding: 12px; text-align: center; color: #2C3E50;">Qty</th>
                          <th style="padding: 12px; text-align: right; color: #2C3E50;">Price</th>
                        </tr>
                      </thead>
                      <tbody>${itemsHTML}</tbody>
                      <tfoot>
                        <tr>
                          <td colspan="2" style="padding: 15px 12px; text-align: right; font-weight: bold;">Total:</td>
                          <td style="padding: 15px 12px; text-align: right; font-weight: bold; color: #D4AF37;">£${total.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #FFF5CC; padding: 30px; text-align: center; border-top: 2px solid #D4AF37;">
                    <p style="margin: 0 0 10px 0; color: #2C3E50; font-weight: bold;">The Gilded Crust</p>
                    <p style="margin: 0; color: #999; font-size: 12px;">© ${new Date().getFullYear()}. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  // Plain text version
  const emailText = `
Order Confirmation - The Gilded Crust
Order Number: ${orderNumber}
Total: £${total.toFixed(2)}

YOUR ORDER:
${items.map(item => `- ${item.productName || item.name} x${item.quantity} - £${((item.price || 0) * item.quantity).toFixed(2)}`).join('\n')}

Thank you for your order!
Contact support@artdecobakery.com for questions.
  `;

  // Send via Nodemailer
  try {
    const info = await transporter.sendMail({
      from: `${process.env.EMAIL_FROM_NAME || 'The Gilded Crust'} <${process.env.EMAIL_FROM}>`,
      to: customerEmail,
      subject: `Order Confirmation - ${orderNumber}`,
      text: emailText,
      html: emailHTML,
    });

    console.log(`✅ Order confirmation email sent to ${customerEmail}`);
    console.log(`📬 Message ID: ${info.messageId}`);

    // For testing (Ethereal testing service), log preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`🔗 Preview URL: ${previewUrl}`);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error(`Email send failed: ${error.message}`);
  }
}

module.exports = { sendOrderConfirmationEmail };
```

---

## 4. Cloud Function Integration

```javascript
// /parse-server/cloud/functions/index.js

const { sendOrderConfirmationEmail } = require('../utils/emailService');

Parse.Cloud.define('sendOrderConfirmation', async (request) => {
  const { orderId } = request.params;

  try {
    // Fetch order with details
    const Order = Parse.Object.extend('Order');
    const query = new Parse.Query(Order);
    const order = await query.get(orderId, { useMasterKey: true });

    if (!order) throw new Error('Order not found');

    // Prepare email data
    const emailData = {
      customerEmail: order.get('customerEmail'),
      customerName: order.get('customerName'),
      orderNumber: order.get('orderNumber'),
      total: order.get('totalInPence') / 100,
      items: order.get('items'),
      orderDate: order.createdAt,
      estimatedDeliveryStart: order.get('estimatedDeliveryStart'),
      estimatedDeliveryEnd: order.get('estimatedDeliveryEnd'),
    };

    // Send email
    const result = await sendOrderConfirmationEmail(emailData);
    return result;
  } catch (error) {
    console.error('Cloud function error:', error);
    throw error;
  }
});
```

---

## 5. Flutter Integration

### 5.1 Trigger from Order Creation

```dart
// lib/features/checkout/data/datasources/order_remote_data_source.dart

class OrderRemoteDataSourceImpl implements OrderRemoteDataSource {
  @override
  Future<OrderModel> createOrder(OrderCreationParams params) async {
    try {
      // Create order in Parse
      final response = await ParseCloud.callFunction(
        'createOrder',
        params: params.toJson(),
      );

      final order = OrderModel.fromJson(response);

      // Trigger confirmation email
      await ParseCloud.callFunction(
        'sendOrderConfirmation',
        params: { 'orderId': order.objectId },
      );

      return order;
    } catch (e) {
      throw ServerException(message: 'Order creation failed: $e');
    }
  }
}
```

---

## 6. Email Templates

Currently supported:
- ✅ Order Confirmation (with branded header, items table, delivery info)
- Extensible for: Order Updates, Delivery Notifications, Invoice Reminders, etc.

---

## 7. Testing

### Local Testing with Ethereal

Ethereal is a fake SMTP service for testing:

```
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<ethereal-account@ethereal.email>
SMTP_PASS=<ethereal-password>
```

Preview URLs logged to console after each send.

### Production (Gmail)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=<app-password>  // NOT your regular password!
```

### Production (AWS SES)

```
SMTP_HOST=email-smtp.<region>.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<ses-username>
SMTP_PASS=<ses-password>
```

---

## 8. Best Practices

✅ Use environment variables for SMTP credentials
✅ Create reusable transporter (connection pooling)
✅ Send HTML + plain text versions
✅ Brand templates with company colors/logo
✅ Log message IDs for tracking
✅ Handle errors gracefully
❌ Don't hardcode email addresses
❌ Don't send from unverified addresses
❌ Don't include sensitive data in emails

---

## 9. Troubleshooting

**Email not sending?**
- Verify SMTP credentials in .env
- Check firewall allows SMTP port 587
- Enable "Less Secure Apps" (Gmail)
- Use app-specific password (not account password)
- Check logs for error details

**Emails going to spam?**
- Use verified sender address
- Add SPF/DKIM records
- Include unsubscribe link for bulk emails
- Avoid spam trigger words

---

## 10. Checklist

- [ ] Nodemailer installed
- [ ] .env variables configured (SMTP_HOST, PORT, USER, PASS, FROM)
- [ ] Email service module created
- [ ] Cloud Function integrated
- [ ] Flutter app triggers emails on order
- [ ] Testing with Ethereal works
- [ ] Production SMTP configured
- [ ] Email templates branded
- [ ] Error handling implemented
- [ ] Message IDs logged for tracking
