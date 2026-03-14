// This is an endpoint used to sign an attached MoonPay widget URL when called

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001'] }));

const secretKey = process.env.MOONPAY_SECRET_KEY;
if (!secretKey) {
  console.error('MOONPAY_SECRET_KEY is not set. Copy .env.example to .env and fill in your key.');
  process.exit(1);
}

const generateSignature = (url) => {
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(new URL(url).search)
    .digest('base64');

  const urlWithSignature = `${url}&signature=${encodeURIComponent(signature)}`;
  const sig = signature
  console.log(sig)
  return sig
};

// Define an endpoint to generate the signature
app.get('/sign-url', (req, res) => {
  const { url } = req.query  // Set 'url' to 'req'
  console.log("The url after being imported into signUrl.mjs: " + url)
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });  // Validate the presence of the URL parameter
  }

  try {
    const signature = generateSignature(url);  // Generate the signature
    console.log("The standalone signature is " + signature);
    res.json({ signature }); // Return the signature as a JSON response
  } catch (error) {
    console.error('Error generating the signature:', error);  // Log any errors that occur during signing
    res.status(500).json({ error: 'Internal server error' });  // Return a 500 status code for server errors
  }
});

// Start the server on the specified port
const PORT = process.env.PORT || 5000;  // Use the port from environment variables or default to 4000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
