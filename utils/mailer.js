const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

module.exports.sendBookingConfirmation = async (toEmail, booking, listing) => {
  const checkIn = new Date(booking.checkIn).toLocaleDateString("en-IN");
  const checkOut = new Date(booking.checkOut).toLocaleDateString("en-IN");

  const mailOptions = {
    from: `"WanderList" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "🏠 Booking Confirmed — WanderList",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0;">🏠 WanderList</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0;">Booking Confirmation</p>
        </div>

        <!-- Body -->
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 16px 16px;">
          
          <h2 style="color: #333;">✅ Booking Confirmed!</h2>
          <p style="color: #666;">Tumhari booking successfully ho gayi hai!</p>

          <!-- Booking Details -->
          <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <h3 style="color: #764ba2; margin-top: 0;">📋 Booking Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; width: 40%;">🏠 Property</td>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">${listing.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">📍 Location</td>
                <td style="padding: 8px 0; color: #333;">${listing.location}, ${listing.country}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">📅 Check-in</td>
                <td style="padding: 8px 0; color: #333;">${checkIn}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">📅 Check-out</td>
                <td style="padding: 8px 0; color: #333;">${checkOut}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">👥 Guests</td>
                <td style="padding: 8px 0; color: #333;">${booking.guests}</td>
              </tr>
              <tr style="border-top: 2px solid #f0f0f0;">
                <td style="padding: 12px 0; color: #666; font-weight: bold;">💰 Total Price</td>
                <td style="padding: 12px 0; font-weight: bold; color: #764ba2; font-size: 1.2rem;">
                  ₹ ${booking.totalPrice.toLocaleString("en-IN")}
                </td>
              </tr>
            </table>
          </div>

          <!-- Footer -->
          <p style="color: #999; font-size: 0.85rem; text-align: center; margin-top: 20px;">
            Koi problem? <a href="mailto:${process.env.EMAIL_USER}" style="color: #764ba2;">Contact karo</a><br>
            © WanderList — Happy Traveling! 🌍
          </p>

        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports.sendCancellationEmail = async (toEmail, booking, listing) => {
  const mailOptions = {
    from: `"WanderList" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "❌ Booking Cancelled — WanderList",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0;">🏠 WanderList</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 16px 16px;">
          <h2 style="color: #e74c3c;">❌ Booking Cancelled</h2>
          <p style="color: #666;">Tumhari <b>${listing.title}</b> ki booking cancel ho gayi hai.</p>
          <p style="color: #999; font-size: 0.85rem; text-align: center;">
            © WanderList — Happy Traveling! 🌍
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};