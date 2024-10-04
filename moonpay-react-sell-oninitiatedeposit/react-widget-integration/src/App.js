// src/App.js
import React from 'react';
import MoonPayWidget from './MoonPayWidget';

const App = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1>MoonPay Off-Ramp (OnInitiateDeposit)</h1>
        <MoonPayWidget />
      </header>
    </div>
  );
};

export default App;