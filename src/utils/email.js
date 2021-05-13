const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function sendVerifyEmail(email, token) {
  const baseUrl = process.env.SENDGRID_API_KEY;
  const link = `${baseUrl}/auth/verify?code=${token}`;
  const mailOptions = {
    from: 'quangdao@itrvn.com',
    to: email,
    subject: 'Verify Email Now',
    text: 'Thanks for signing up. \n Please verify your email address',
    html: `<strong>Thanks for signing up. \n Please verify your email address.<a href=${link}>link</a></strong>`,
  };
  return sgMail.send(mailOptions);
}

function sendForgotPassword(email, token) {
  const baseUrl = process.env.SENDGRID_API_KEY;
  const link = `${baseUrl}/auth/verify?code=${token}`;
  const mailOptions = {
    from: 'quangdao@itrvn.com',
    to: email,
    subject: 'Forgot',
    text: 'Change Password',
    html: `<strong>Change Password<a href=${link}>link</a></strong>`,
  };
  return sgMail.send(mailOptions);
}

export default { sendVerifyEmail, sendForgotPassword };
