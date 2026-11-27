const nodemailer = require("nodemailer");

module.exports.sendMail = (email, title, content) => {
  const transporter = nodemailer.createTransport({ host: "smtp.gmail.com", port: 587, secure: false,
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS } });
  return transporter.sendMail({ from: process.env.GMAIL_USER, to: email, subject: title, html: content });
};
