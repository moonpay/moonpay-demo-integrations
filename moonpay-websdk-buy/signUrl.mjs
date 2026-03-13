// URL Signing Server for MoonPay Widget
//
// WHY THIS EXISTS:
// MoonPay requires all widget URLs to be signed with your secret key (HMAC-SHA256)
// before the widget will load. This prevents tampering with parameters like wallet
// addresses and currency amounts on the client side. The secret key must NEVER be
// exposed in frontend code — it stays on this server.
//
// FLOW:
// 1. Frontend builds a widget URL with parameters (apiKey, walletAddress, etc.)
// 2. Frontend sends that URL to this server's /sign-url endpoint
// 3. This server signs the URL's query string with HMAC-SHA256 using the secret key
// 4. The signature is returned to the frontend, which passes it to the MoonPay SDK

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();          // Create an express application instance
app.use(cors());                // Use the cors middleware to allow requests from different origins

const secretKey = 'your_secret_key';  // Define the secret key used for signing URLs

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
