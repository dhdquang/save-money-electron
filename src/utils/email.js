const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function sendVerifyEmail(email, code) {
  const mailOptions = {
    from: 'quangdao@itrvn.com',
    to: email,
    subject: 'Verify Email Now',
    text: `Thanks for signing up. \n Please verify your email address. Code ${code}`,
    html: `<strong>Thanks for signing up. \n Please verify your email address. Code ${code}</strong>`,
  };
  return sgMail.send(mailOptions);
}

function sendForgotPassword(email, code) {
  const mailOptions = {
    from: 'quangdao@itrvn.com',
    to: email,
    subject: 'Forgot',
    text: `Change Password with Code ${code}`,
    html: `<strong>Change Password with Code ${code}</strong>`,
  };
  return sgMail.send(mailOptions);
}

export default { sendVerifyEmail, sendForgotPassword };
