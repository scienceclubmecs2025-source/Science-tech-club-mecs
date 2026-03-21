const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'Science & Tech Club MECS <onboarding@resend.dev>'

const sendMail = async ({ to, subject, html }) => {
  if (!to) { console.warn('sendMail: no recipient'); return }
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html })
    if (error) throw new Error(error.message)
    console.log(`✅ Mail sent to ${to} — id: ${data.id}`)
  } catch (err) {
    console.error(`❌ Mail send error to ${to}:`, err.message)
    throw err
  }
}

// Account created — sent to new member
const sendProfileCreatedMail = async (user, password) => {
  await sendMail({
    to: user.email,
    subject: '🎉 Your Science & Tech Club Account is Ready',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#0f172a;color:#f1f5f9;padding:32px;border-radius:12px">
        <h2 style="color:#3b82f6;margin-bottom:4px">Welcome to Science & Tech Club, MECS!</h2>
        <p style="color:#94a3b8;margin-top:0">Your profile has been approved by the admin.</p>
        <p>Hi <strong>${user.full_name || user.username}</strong>,</p>
        <p>Here are your login credentials:</p>
        <div style="background:#1e293b;padding:20px;border-radius:8px;margin:16px 0;border-left:4px solid #3b82f6">
          <p style="margin:6px 0"><strong>Username:</strong> <span style="color:#60a5fa;font-family:monospace">${user.username}</span></p>
          <p style="margin:6px 0"><strong>Password:</strong> <span style="color:#60a5fa;font-family:monospace">${password}</span></p>
          <p style="margin:6px 0"><strong>Unique ID:</strong> <span style="color:#60a5fa;font-family:monospace">${user.unique_id || '—'}</span></p>
        </div>
        <p>Login at: <a href="${process.env.FRONTEND_URL}/login" style="color:#3b82f6">${process.env.FRONTEND_URL}/login</a></p>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">Please change your password after first login. If you did not request this account, contact the club administration.</p>
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
        <p>Your Science & Tech Club profile was updated on <strong>${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</strong>.</p>
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

// Password reset — sent to member
const sendPasswordChangedMail = async (user, newPassword) => {
  await sendMail({
    to: user.email,
    subject: '🔑 Your Password Has Been Reset',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#0f172a;color:#f1f5f9;padding:32px;border-radius:12px">
        <h2 style="color:#3b82f6">Password Reset</h2>
        <p>Hi <strong>${user.full_name || user.username}</strong>,</p>
        <p>Your password has been reset by an administrator. Your new credentials are:</p>
        <div style="background:#1e293b;padding:20px;border-radius:8px;margin:16px 0;border-left:4px solid #3b82f6">
          <p style="margin:6px 0"><strong>Username:</strong> <span style="color:#60a5fa;font-family:monospace">${user.username}</span></p>
          <p style="margin:6px 0"><strong>New Password:</strong> <span style="color:#60a5fa;font-family:monospace">${newPassword}</span></p>
        </div>
        <p>Login at: <a href="${process.env.FRONTEND_URL}/login" style="color:#3b82f6">${process.env.FRONTEND_URL}/login</a></p>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">Please change your password after logging in.</p>
      </div>
    `
  })
}

// New profile request — sent to admins/chair
const sendProfileRequestMail = async (adminEmail, requestData) => {
  await sendMail({
    to: adminEmail,
    subject: '📋 New Profile Request — Science & Tech Club',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#0f172a;color:#f1f5f9;padding:32px;border-radius:12px">
        <h2 style="color:#3b82f6">New Profile Request</h2>
        <p>A new member profile request has been submitted and requires your approval.</p>
        <div style="background:#1e293b;padding:20px;border-radius:8px;margin:16px 0;border-left:4px solid #f59e0b">
          <p style="margin:6px 0"><strong>Name:</strong> ${requestData.full_name}</p>
          <p style="margin:6px 0"><strong>Email:</strong> ${requestData.email}</p>
          <p style="margin:6px 0"><strong>Roll No:</strong> ${requestData.roll_number || '—'}</p>
          <p style="margin:6px 0"><strong>Department:</strong> ${requestData.department || '—'}</p>
          <p style="margin:6px 0"><strong>Year:</strong> ${requestData.year || '—'}</p>
          <p style="margin:6px 0"><strong>Phone:</strong> ${requestData.phone || '—'}</p>
        </div>
        <a href="${process.env.FRONTEND_URL}" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;margin-top:8px">Open Admin Panel →</a>
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
