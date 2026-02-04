require('dotenv').config({ path: '.env.local' });
require('dotenv').config(); // also load .env if present

console.log({
  RESEND_API_KEY: !!process.env.RESEND_API_KEY,
  RESEND_FROM: process.env.RESEND_FROM,
  SITE_URL: process.env.SITE_URL,
  ADMIN_TOKEN: !!process.env.ADMIN_TOKEN,
});
