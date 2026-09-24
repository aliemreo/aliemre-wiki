/* One Resend call, shared by /mail and /guestbook: plain text to MAIL_TO from MAIL_FROM. */
export function sendResend(env, { subject, text, reply_to }) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + env.RESEND_API_KEY },
    body: JSON.stringify({ from: env.MAIL_FROM || 'Site <onboarding@resend.dev>', to: [env.MAIL_TO], subject, text, ...(reply_to ? { reply_to } : {}) }),
  });
}
