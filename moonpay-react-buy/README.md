# MoonPay React SDK Demo - Buy

## How to use:

**IMPORTANT NOTE:** Be sure to follow best practices with regards to the security of your API keys! This integration and the below instructions are for demo purposes only and it is expected that in production builds, API keys will not be exposed directly in 
client-side files. It is the responsibility of the partner to rework and secure any integrations that originate from this directory.

### Installing Dependencies
**If you are using npm:**
1. Navigate to the project directory after cloning
```
cd /path/to/your/repo
```
2. Run the following command to install all the dependencies listed in package.json:
```
npm install
```

**If you are using Yarn**
1. Navigate to the project directory after cloning
```
cd /path/to/your/repo
```
2. Run the following command to install all the dependencies listed in package.json:
```
yarn install
```

### Setting up your code:
1. Replace the apiKey variable in MoonPayWidget.js with your API Key from the MoonPay Dashboard (dashboard.moonpay.com/developers).
2. Replace secretKey in signUrl.mjs with your Secret Key from the MoonPay Dashboard (dashboard.moonpay.com/developers)
3. If in production, allow-list your production domain on dashboard.moonpay.com/developers.
4. If in production, you will need to change your fetch in line 13 of MoonPayWidget.js to reflect the URL of your signature endpoint.

run `npm start` to start MoonPayWidget.js in the /src folder
run `node signUrl.mjs` to start signUrl.mjs