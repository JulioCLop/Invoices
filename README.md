# Tri-Tech Invoice Creator

Single-page React app for creating invoices, printing/exporting them, logging history, and reviewing every transaction in an Excel-style grid at `/transactions`. When configured with EmailJS it can also send a polished invoice email (with an auto-generated PDF attachment) that mirrors the web view.

## Email + Payment Configuration

1. Copy `.env.example` to `.env` and fill in the EmailJS values:
   - `REACT_APP_EMAILJS_SERVICE_ID` – e.g. `service_ryjjm0m`.
   - `REACT_APP_EMAILJS_TEMPLATE_ID` – find this in EmailJS → Email Templates.
   - `REACT_APP_EMAILJS_PUBLIC_KEY` – EmailJS Account → API Keys (this is safe to expose to the browser).
   - Optional: update `REACT_APP_PAYPAL_LINK` so the outgoing email shows accurate payment instructions.
2. In EmailJS, edit your invoice template so the “To email” field is set to `{{to_email}}` (otherwise every send is delivered only to the address configured in EmailJS). While there, ensure the body uses the same variable names referenced in `src/Pages/InvoicePage.jsx` (`client_name`, `invoice_number`, `invoice_date`, `invoice_total`, `work_completed`, `paypal_link`, etc.).
3. Restart `npm start` so Create React App reloads the environment variables. When all three EmailJS vars are present the “Print & Send Invoice” button will automatically dispatch via the EmailJS REST API (including a generated PDF summary attachment); otherwise it will fall back to opening your mail client.

## Local Development

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
