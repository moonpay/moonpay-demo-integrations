const express = require('express');
const app = express();
const cors = require('cors');

// Use CORS to allow the frontend to make requests to the backend
app.use(cors());

// API route for signing transaction details
app.get('/api/wallet-sign', (req, res) => {
  const { cryptoCode, amount, walletAddress } = req.query;

  // Return the transaction details as JSON
  res.json({
    cryptoCode,
    amount,
    walletAddress
  });
});

// Start the server on port 4000
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`This backend API is running on http://localhost:${PORT}`);
});
