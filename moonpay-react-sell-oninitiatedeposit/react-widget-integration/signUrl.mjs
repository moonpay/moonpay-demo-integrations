// This is an endpoint used to sign an attached MoonPay widget URL when called

import express from 'express';  // Import the express framework for building the web server
import cors from 'cors';        // Import the cors middleware to enable Cross-Origin Resource Sharing
import crypto from 'crypto';    // Import the crypto module for cryptographic functions

const app = express();          // Create an express application instance
app.use(cors());                // Use the cors middleware to allow requests from different origins

const secretKey = 'Replace with your secret key';  // Define the secret key used for signing URLs

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
  console.log("the req.query: " + JSON.stringify(req.query))
  console.log("the url 2:" + url)
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });  // Validate the presence of the URL parameter
  }

  try {
    const signature = generateSignature(url);  // Generate the signature
    console.log("signature is " + signature);
    res.send(signature);                   // Return the signature as a string response
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
