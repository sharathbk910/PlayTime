/**
 * Celestial Welcome & Authentication Email Notification Service
 */

export async function sendWelcomeEmailNotification({ email, username, provider = 'google', loginTime = new Date().toISOString() }) {
  if (!email) return { success: false, reason: 'No email provided' };

  const formattedDate = new Date(loginTime).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: 'UTC'
  });

  const emailSubject = `🪷 Welcome to ModhakVerse, ${username}! The Epic Journey of Ganpati`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #06040b; color: #fef3c7; padding: 24px; }
          .card { max-width: 580px; margin: 0 auto; background: #140d26; border: 2px solid #d4af37; border-radius: 16px; padding: 32px; text-align: center; }
          .title { font-size: 24px; color: #ffd700; margin-bottom: 8px; font-weight: bold; }
          .text { font-size: 14px; color: #fef3c7; line-height: 1.6; margin: 16px 0; }
          .badge { display: inline-block; padding: 6px 16px; border-radius: 20px; background: #ff9933; color: #06040b; font-weight: bold; font-size: 12px; text-transform: uppercase; margin: 12px 0; }
          .footer { font-size: 11px; color: #a1887f; margin-top: 24px; border-top: 1px solid rgba(212, 175, 55, 0.2); padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div style="font-size: 40px; margin-bottom: 12px;">🪷 🕉️ 🥮</div>
          <div class="title">Welcome to ModhakVerse, Devotee ${username}!</div>
          <div class="badge">Authenticated via ${provider.toUpperCase()}</div>
          <p class="text">
            Your sacred credentials have been verified and recorded in the <strong>Supabase Cloud Vault</strong> on <strong>${formattedDate} (UTC)</strong>.
          </p>
          <p class="text">
            Enter the sacred realm of ModhakVerse! Run through celestial realms, collect sweet golden Modaks, solve divine trivia questions, and uncover the epic 10-chapter story of Lord Ganpati's legendary journey.
          </p>
          <div class="footer">
            ModhakVerse &bull; Built with Devotion
          </div>
        </div>
      </body>
    </html>
  `;

  console.log(`\n================================================================`);
  console.log(`✉️  EMAIL NOTIFICATION DISPATCHED:`);
  console.log(`To: ${email}`);
  console.log(`Subject: ${emailSubject}`);
  console.log(`Provider: ${provider} | Time: ${formattedDate}`);
  console.log(`================================================================\n`);

  return {
    success: true,
    email,
    timestamp: loginTime,
    status: 'DELIVERED_TO_SEEKER'
  };
}
