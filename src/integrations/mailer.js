const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail({ to, subject, html }) {
    try {
        return await resend.emails.send({
            from: process.env.EMAIL_FROM, // check .env files 
            to,
            subject,
            html,
        });
    } catch (error) {
        console.error("Mailer error:", error);
        throw error;
    }
}
module.exports = { sendEmail };