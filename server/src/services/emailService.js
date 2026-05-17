const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
});

const templates = {
  verifyEmail: {
    en: (name, link) => ({
      subject: 'Verify your ZEAL account',
      html: `<h2>Hi ${name}!</h2><p>Please verify your email: <a href="${link}">Verify now</a></p>`,
    }),
    es: (name, link) => ({
      subject: 'Verifica tu cuenta ZEAL',
      html: `<h2>Â¡Hola ${name}!</h2><p>Verifica tu email: <a href="${link}">Verificar ahora</a></p>`,
    }),
  },
  shiftConfirmed: {
    en: (name, shiftTitle, date) => ({
      subject: `Shift confirmed: ${shiftTitle}`,
      html: `<h2>Hi ${name},</h2><p>Your shift <strong>${shiftTitle}</strong> on ${date} is confirmed!</p>`,
    }),
    es: (name, shiftTitle, date) => ({
      subject: `Turno confirmado: ${shiftTitle}`,
      html: `<h2>Hola ${name},</h2><p>Tu turno <strong>${shiftTitle}</strong> el ${date} estÃ¡ confirmado.</p>`,
    }),
  },
  shiftReminder: {
    en: (name, shiftTitle, time) => ({
      subject: `Reminder: Shift tomorrow â€“ ${shiftTitle}`,
      html: `<h2>Hi ${name},</h2><p>Reminder: your shift <strong>${shiftTitle}</strong> starts at ${time} tomorrow.</p>`,
    }),
    es: (name, shiftTitle, time) => ({
      subject: `Recordatorio: Turno maÃ±ana â€“ ${shiftTitle}`,
      html: `<h2>Hola ${name},</h2><p>Recordatorio: tu turno <strong>${shiftTitle}</strong> empieza a las ${time} maÃ±ana.</p>`,
    }),
  },
  passwordReset: {
    en: (name, link) => ({
      subject: 'Reset your ZEAL password',
      html: `<h2>Hi ${name},</h2><p><a href="${link}">Reset your password</a> (expires in 1 hour).</p>`,
    }),
    es: (name, link) => ({
      subject: 'Restablece tu contraseÃ±a ZEAL',
      html: `<h2>Hola ${name},</h2><p><a href="${link}">Restablecer contraseÃ±a</a> (expira en 1 hora).</p>`,
    }),
  },
};

const send = async ({ to, templateKey, lang = 'en', templateVars }) => {
  try {
    const templateFn = templates[templateKey]?.[lang] ?? templates[templateKey]?.en;
    if (!templateFn) throw new Error(`Unknown email template: ${templateKey}`);

    const { subject, html } = templateFn(...templateVars);
    await transporter.sendMail({
      from: `ZEAL <${process.env.EMAIL_FROM || 'noreply@zeal.com'}>`,
      to,
      subject,
      html,
    });
    logger.info(`Email [${templateKey}] sent to ${to}`);
  } catch (err) {
    logger.error(`Email send failed: ${err.message}`);
    // Non-blocking â€” log but don't crash
  }
};

module.exports = { send };
