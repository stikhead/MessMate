import "dotenv/config";
import Mailjet from "node-mailjet";

const mailjet = new Mailjet({
  apiKey: `${process.env.MJ_APIKEY_PUBLIC}`,
  apiSecret: `${process.env.MJ_APIKEY_PRIVATE}`
});

const sendVerificationEmail = async (email, otp) => {
  try {
    const request = await mailjet.post("send", { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: process.env.MJ_SENDER_EMAIL,
            Name: "MessMate Support"
          },
          To: [
            {
              Email: email,
              Name: "User"
            }
          ],
          Subject: "Verify your Account",
          TextPart: `Your verification code is: ${otp}`,
          HTMLPart: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #2563eb;">Welcome!</h2>
              <p>Your 6-digit verification code is:</p>
              <h1 style="background: #f3f4f6; padding: 10px; border-radius: 5px; text-align: center; letter-spacing: 5px; color: #1e40af;">
                ${otp}
              </h1>
              <p style="color: #666; font-size: 12px;">This code will expire shortly. If you didn't request this, please ignore this email.</p>
            </div>
          `
        }
      ]
    });

    console.log("Email sent successfully!");
    console.log("Status:", request.response.status);
    
  } catch (error) {
    console.error(`Mailjet Error: ${error.statusCode || error.message}`);
    throw error;
  }
};

export {sendVerificationEmail}

