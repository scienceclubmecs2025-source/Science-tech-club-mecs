import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendWelcomeMail = async (to, username) => {
  if (!to) return;
  const html = `
    <h2>Welcome to Science & Tech Club</h2>
    <p>Hi ${username},</p>
    <p>You have been added to the club portal. Use your assigned username and password to login.</p>
    <p>Happy building,<br/>Science & Tech Club</p>
  `;
  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject: "Welcome to Science & Tech Club",
    html
  });
};
