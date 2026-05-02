const https = require('https');

async function sendEmail({ to, subject, html }) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      to: to,
      subject: subject,
      html: html,
      apikey: process.env.RESEND_API_KEY
    });

    const options = {
      hostname: process.env.MAILER_URL, // example: your-domain.com
      path: '/sendEmailAPI',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        console.log('Mailer status:', res.statusCode);
        console.log('Mailer response:', body);

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            statusCode: res.statusCode,
            body
          });
        } else {
          reject(new Error(`Mailer API failed with status ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

module.exports = { sendEmail };