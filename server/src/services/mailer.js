const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD  // Gmail App Password (not account password)
  }
});

const sendMail = async ({ to, subject, html }) => {
  if (!to) return
  try {
    await transporter.sendMail({
      from: `"Science & Tech Club MECS" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html
    })
    console.log(`✅ Mail sent to ${to}`)
  } catch (err) {
    console.error('❌ Mail send error:', err.message)
  }
}

// Profile created
const sendProfileCreatedMail = async (user, password) => {
  await sendMail({
    to: user.email,
    subject: '🎉 Your Science & Tech Club Account is Ready',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#0f172a;color:#f1f5f9;padding:32px;border-radius:12px">
        <h2 style="color:#3b82f6">Welcome to Science & Tech Club, MECS!</h2>
        <p>Hi <strong>${user.full_name || user.username}</strong>,</p>
        <p>Your profile has been created. Here are your login credentials:</p>
        <div style="background:#1e293b;padding:16px;border-radius:8px;margin:16px 0">
          <p><strong>Username:</strong> ${user.username}</p>
          <p><strong>Password:</strong> ${password}</p>
        </div>
        <p>Login at: <a href="${process.env.FRONTEND_URL}/login" style="color:#3b82f6">${process.env.FRONTEND_URL}/login</a></p>
        <p style="color:#94a3b8;font-size:12px">Please change your password after first login.</p>
      </div>
    `
  })
}

// Profile updated
const sendProfileUpdatedMail = async (user) => {
  await sendMail({
    to: user.email,
    subject: '✏️ Your Profile Has Been Updated',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#0f172a;color:#f1f5f9;padding:32px;border-radius:12px">
        <h2 style="color:#3b82f6">Profile Updated</h2>
        <p>Hi <strong>${user.full_name || user.username}</strong>,</p>
        <p>Your Science & Tech Club profile was updated on <strong>${new Date().toLocaleString()}</strong>.</p>
        <p>If you didn't request this change, contact the administrator immediately.</p>
      </div>
    `
  })
}

// Profile deleted
const sendProfileDeletedMail = async (user) => {
  await sendMail({
    to: user.email,
    subject: '❌ Your Profile Has Been Removed',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#0f172a;color:#f1f5f9;padding:32px;border-radius:12px">
        <h2 style="color:#ef4444">Account Removed</h2>
        <p>Hi <strong>${user.full_name || user.username}</strong>,</p>
        <p>Your Science & Tech Club account has been removed by an administrator.</p>
        <p>If you believe this was a mistake, please contact the club administration.</p>
      </div>
    `
  })
}

// Password changed
const sendPasswordChangedMail = async (user, newPassword) => {
  await sendMail({
    to: user.email,
    subject: '🔑 Your Password Has Been Changed',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#0f172a;color:#f1f5f9;padding:32px;border-radius:12px">
        <h2 style="color:#3b82f6">Password Changed</h2>
        <p>Hi <strong>${user.full_name || user.username}</strong>,</p>
        <p>Your password has been reset. Your new password is:</p>
        <div style="background:#1e293b;padding:16px;border-radius:8px;margin:16px 0">
          <p><strong>New Password:</strong> ${newPassword}</p>
        </div>
        <p>Login at: <a href="${process.env.FRONTEND_URL}/login" style="color:#3b82f6">${process.env.FRONTEND_URL}/login</a></p>
      </div>
    `
  })
}

// Profile request received (for admin/chair)
const sendProfileRequestMail = async (adminEmail, requestData) => {
  await sendMail({
    to: adminEmail,
    subject: '📋 New Profile Request',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#0f172a;color:#f1f5f9;padding:32px;border-radius:12px">
        <h2 style="color:#3b82f6">New Profile Request</h2>
        <p>A new profile request has been submitted:</p>
        <div style="background:#1e293b;padding:16px;border-radius:8px;margin:16px 0">
          <p><strong>Name:</strong> ${requestData.full_name}</p>
          <p><strong>Email:</strong> ${requestData.email}</p>
          <p><strong>Roll No:</strong> ${requestData.roll_number}</p>
          <p><strong>Department:</strong> ${requestData.department}</p>
          <p><strong>Year:</strong> ${requestData.year}</p>
        </div>
        <p>Login to the admin panel to accept or reject this request.</p>
      </div>
    `
  })
}

module.exports = {
  sendProfileCreatedMail,
  sendProfileUpdatedMail,
  sendProfileDeletedMail,
  sendPasswordChangedMail,
  sendProfileRequestMail
}
