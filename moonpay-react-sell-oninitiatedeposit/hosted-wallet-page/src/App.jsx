import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Web3 from 'web3';

const App = () => {
  const [searchParams] = useSearchParams();
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const fetchTransactionDetails = () => {
      const cryptoCode = searchParams.get('cryptoCode');
      const amount = searchParams.get('amount');
      const walletAddress = searchParams.get('walletAddress');
      

      // Simulate fetching data or just use it from the URL
      setTransactionDetails({ cryptoCode, amount, walletAddress });
    };

    fetchTransactionDetails();
  }, [searchParams]);

  const handleSignTransaction = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const web3 = new Web3(window.ethereum); // Web3 instance creation
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const accounts = await web3.eth.getAccounts();
      const fromAddress = accounts[0]; // User's MetaMask account

      const { walletAddress, amount } = transactionDetails;
      const amountInWei = web3.utils.toWei(Number(amount).toString(), 'ether')
      
      console.log("Original amount:", amount);
      console.log("Amount in Wei:", amountInWei);
      
      const transactionParameters = {
        to: walletAddress,
        from: fromAddress,
        value: amountInWei, 
        gas: '21000',
      };

      console.log("Wallet Address: " + walletAddress)
      console.log("From Address: " + fromAddress)
      console.log("Transaction Parameters:", transactionParameters);
      //console.log("Amount in Wei: " + web3.utils.toWei(amount, 'ether'))

      try {
        const txHash = await web3.eth.sendTransaction(transactionParameters);
        setStatus(`Transaction signed! Hash: ${txHash}`);

        // Redirect back to the widget page with the txHash
        window.location.href = `http://localhost:3001/?txHash=${txHash}`;
      } catch (error) {
        console.error('Transaction failed:', error);
        setStatus('Operation failed! For the sake of this example, please check your console in devtools');
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

export default App;
