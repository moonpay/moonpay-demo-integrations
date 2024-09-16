# MoonPay Web SDK - Buy

**IMPORTANT NOTE:** Be sure to follow best practices with regards to the security of your API keys! This integration and the below instructions are for demo purposes only and it is expected that in production builds, API keys will not be exposed directly in 
client-side files. It is the responsibility of the partner to rework and secure any integrations that originate from this directory.

## How to use:
1. Replace the apiKey variable in index.js with your API Key from the MoonPay Dashboard (dashboard.moonpay.com/developers)
2. Replace secretKey in signUrl.mjs with your Secret Key from the MoonPay Dashboard (dashboard.moonpay.com/developers)
3. If running locally, set up your integration on a port.\
    To do this:\
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;a. Navigate to the directory containing index.html and index.js\
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;b. Run python -m http.server 8080\
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;c. You may also run "python3", as well as modify the port on which you deploy.\
4. To view your integration, navigate to 'http://localhost:8080' in your browser
5. If moving to production, along with switching to live API keys and "environment:" to "production" in index.js, make sure that the URL in line 55 of index.js is set to buy.moonpay.com instead of buy-sandbox.moonpay.com
6. Allow-list your production domain on dashboard.moonpay.com/developers

run `npm start` to start index.js\
run `node signUrl.mjs` to start signUrl.mjs