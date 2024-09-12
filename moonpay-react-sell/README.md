#MoonPay React SDK Demo - Sell

##How to use:

1.) Replace the apiKey variable in MoonPatWidget.js with your API Key from the MoonPay Dashboard (dashboard.moonpay.com/developers)
2.) Replace secretKey in signUrl.mjs with your Secret Key from the MoonPay Dashboard (dashboard.moonpay.com/developers)
3.) If in production, allow-list your production domain on dashboard.moonpay.com/developers.
4.) If in production, you will need to change your fetch in line 13 of MoonPayWidget.js to reflect the URL of your signature endpoint.

run `npm start` to start MoonPayWidget.js in the /src folder
run `node signUrl.mjs` to start signUrl.mjs