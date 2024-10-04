import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom'; // React Router for parsing query params

const SignTransaction = () => {
  const [searchParams] = useSearchParams();
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      const cryptoCode = searchParams.get('cryptoCode');
      const amount = searchParams.get('amount');
      const walletAddress = searchParams.get('walletAddress');

      // Fetch the transaction details from the backend
      const response = await fetch(
        `http://localhost:4000/api/sign?cryptoCode=${cryptoCode}&amount=${amount}&walletAddress=${walletAddress}`
      );
      const data = await response.json();
      setTransactionDetails(data);
    };

    fetchTransactionDetails();
  }, [searchParams]);

  const handleSignTransaction = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const web3 = new window.Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const accounts = await web3.eth.getAccounts();
      const fromAddress = accounts[0];

      const { walletAddress, amount } = transactionDetails;
      const transactionParameters = {
        to: walletAddress,
        from: fromAddress,
        value: web3.utils.toWei(amount, 'ether'),
        gas: '21000',
      };

      try {
        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [transactionParameters],
        });

        setStatus(`Transaction signed! Hash: ${txHash}`);

        // Redirect to the original site or handle the txHash
        window.location.href = `http://localhost:3000/?txHash=${txHash}`;
      } catch (error) {
        console.error('Transaction failed:', error);
        setStatus('Transaction failed!');
      }
    } else {
      alert('MetaMask is not installed');
    }
  };

  if (!transactionDetails) {
    return <p>Loading transaction details...</p>;
  }

  return (
    <div>
      <h1>Sign Transaction</h1>
      <p><strong>Cryptocurrency:</strong> {transactionDetails.cryptoCode}</p>
      <p><strong>Amount:</strong> {transactionDetails.amount}</p>
      <p><strong>Wallet Address:</strong> {transactionDetails.walletAddress}</p>

      <button onClick={handleSignTransaction}>Sign Transaction</button>
      <p>{status}</p>
    </div>
  );
};

export default SignTransaction;
