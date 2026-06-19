# Parse Server Integrations

**ID**: parse-server-integrations
**Category**: Backend / External Services
**Phase**: P5 (Generation)
**Robot**: Reena

## Purpose

Integrate Parse Server with email services, webhooks, payments (Stripe), and external APIs

## Inputs

- tech-stack.md (integration requirements)
- use-cases.md (integration scenarios)

## Outputs

- Custom email adapter (SMTP)
- Webhook handlers (Stripe, etc.)
- Payment processing cloud functions
- Migration and bootstrap utilities

## Email Adapter Pattern

```javascript
// cloud/adapters/smtpAdapter.js
const nodemailer = require('nodemailer');

class SMTPAdapter {
  constructor(options) {
    this.options = options;
    this.transporter = nodemailer.createTransport({
      host: options.host,
      port: options.port || 587,
      secure: options.secure || false,
      auth: {
        user: options.auth.user,
        pass: options.auth.pass
      }
    });
  }

  async sendMail(mail) {
    try {
      const info = await this.transporter.sendMail({
        from: this.options.fromAddress,
        to: mail.to,
        subject: mail.subject,
        html: mail.html
      });
      console.log(`✅ Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('❌ Email failed:', error);
      throw error;
    }
  }
}
```

## Webhook Handler Pattern

```javascript
// index.js - Webhook endpoint
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const payload = req.body;

  try {
    await Parse.Cloud.run('handleStripeWebhook', {
      payload: payload.toString(),
      signature: signature
    }, { useMasterKey: true });

    res.json({ received: true });
  } catch (error) {
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// Cloud function handler
Parse.Cloud.define('handleStripeWebhook', async (request) => {
  const { payload } = request.params;
  const event = JSON.parse(payload);

  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;
  }

  return { success: true };
});
```

## Migration Pattern

```javascript
Parse.Cloud.define('migrateAdminFields', async (request) => {
  let updated = 0;

  const query = new Parse.Query('ClassName');
  query.limit(1000);
  const objects = await query.find({ useMasterKey: true });

  for (const obj of objects) {
    if (obj.get('newField') === undefined) {
      obj.set('newField', defaultValue);
      await obj.save(null, { useMasterKey: true });
      updated++;
    }
  }

  return { success: true, updated };
});
```

## Bootstrap Admin Pattern

```javascript
Parse.Cloud.define('bootstrapAdmin', async (request) => {
  const { email, password, fullName } = request.params;

  if (!email || !password || password.length < 8) {
    throw new Parse.Error(400, 'Invalid credentials');
  }

  const user = new Parse.User();
  user.set('username', email.toLowerCase());
  user.set('email', email.toLowerCase());
  user.set('password', password);
  user.set('isAdmin', true);
  user.set('permissions', ['orders', 'products', 'users']);

  await user.signUp(null, { useMasterKey: true });
  const loggedIn = await Parse.User.logIn(email.toLowerCase(), password);

  return {
    success: true,
    sessionToken: loggedIn.getSessionToken()
  };
});
```

## Expert References

**Primary Guide** (see Experts/expert_parse_server/):
- `parse-server-expert.md` (Sections 7, 8, 9)

---

**Version**: 1.0
**Based on**: Experts/expert_parse_server/parse-server-expert.md
**Last Updated**: 2026-01-29
