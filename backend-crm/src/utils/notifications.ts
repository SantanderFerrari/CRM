interface OtpEmailParams {
  email: string;
  otp:   string;
  name:  string;
}

interface OtpSmsParams {
  phone: string;
  otp:   string;
  name:  string;
}

export const sendOtpEmail = async ({ email, otp, name }: OtpEmailParams): Promise<void> => {
  // TODO: replace with real email provider (Nodemailer / Resend / SendGrid)
  console.log(`\n📧 [OTP EMAIL] To: ${email} | Name: ${name} | OTP: ${otp}\n`);
};

export const sendOtpSms = async ({ phone, otp, name }: OtpSmsParams): Promise<void> => {
  // TODO: replace with real SMS provider (Africa's Talking / Twilio)
  console.log(`\n📱 [OTP SMS]   To: ${phone} | Name: ${name} | OTP: ${otp}\n`);
};