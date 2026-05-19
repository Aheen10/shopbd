const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Order Confirmation Email
const sendOrderConfirmation = async (to, orderDetails) => {
  const { orderId, customerName, items, total } = orderDetails;

  const itemsList = items.map(item => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #2a2a3a">${item.emoji} ${item.name}</td>
      <td style="padding:8px;border-bottom:1px solid #2a2a3a;text-align:center">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #2a2a3a;text-align:right">৳${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `✅ Order Confirmed - ShopBD #${orderId}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#f0f0f5;padding:20px;border-radius:16px">
        <div style="text-align:center;margin-bottom:24px">
          <h1 style="color:#ff6b35;font-size:28px;margin:0">Shop<span style="color:#ffd166">BD</span></h1>
        </div>
        
        <div style="background:#13131a;border-radius:12px;padding:24px;margin-bottom:20px;border:1px solid #2a2a3a">
          <h2 style="color:#06d6a0;margin:0 0 8px">✅ Order Confirmed!</h2>
          <p style="color:#9090a8;margin:0">Hi ${customerName}, your order has been placed successfully!</p>
        </div>

        <div style="background:#13131a;border-radius:12px;padding:24px;margin-bottom:20px;border:1px solid #2a2a3a">
          <h3 style="margin:0 0 16px;color:#ff6b35">Order #${orderId}</h3>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="color:#9090a8;font-size:12px">
                <th style="text-align:left;padding:8px;border-bottom:1px solid #2a2a3a">Product</th>
                <th style="text-align:center;padding:8px;border-bottom:1px solid #2a2a3a">Qty</th>
                <th style="text-align:right;padding:8px;border-bottom:1px solid #2a2a3a">Price</th>
              </tr>
            </thead>
            <tbody>${itemsList}</tbody>
          </table>
          <div style="text-align:right;margin-top:16px;font-size:20px;font-weight:bold;color:#ff6b35">
            Total: ৳${total.toLocaleString()}
          </div>
        </div>

        <div style="text-align:center;color:#9090a8;font-size:12px">
          <p>Thank you for shopping with ShopBD! 🛒</p>
          <p>© 2025 ShopBD. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOrderConfirmation };