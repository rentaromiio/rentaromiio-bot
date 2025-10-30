# Rent a Romiio WhatsApp Bot 🤖

A WhatsApp chatbot for Rent a Romiio business — deployable locally or on Render.

## Features ✨

- **Easy Menu Navigation** — Numbered customer menu
- **Package Display** — All services + pricing
- **Quick Booking** — Fast, structured customer booking
- **Contact Details** — Easy access
- **24/7 Availability** — Instant response

## Local/Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Start the bot**
   ```bash
   npm start
   # (Runs botexperiment/whatsapp-integration.js)
   ```
   - Scan the WhatsApp QR code in the terminal with your business phone.

## Deploy to Render.com (Free Hosting)

1. **Push your code to GitHub.**
2. **Connect repo to Render and create a new Node.js web service.**
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - Node Version: 18 or higher recommended (set in Render if needed).
3. **Add a persistent disk (optional):** So WhatsApp QR Auth stays across deploys (uses botexperiment/.wwebjs_auth/)
   - Do NOT commit `.wwebjs_auth/` to git.
4. **Set up your `.gitignore`:**
   ```
   node_modules/
   .env
   botexperiment/.wwebjs_auth/
   ```
5. **Redeploy any time you update your code.**

## Menu Options Overview:
1. **Regular Companionship** — Choose a duration
2. **Event Companion**
3. **Specialized Services**
4. **Additional Services**
5. **About Us**
6. **Contact Info**
7. **Book Now**

## Customization 🛠️
- Change services/pricing in `botexperiment/whatsapp-integration.js`
- Update menu or business contact as desired

## Business
- **WhatsApp:** +91 8368235765
- **Email:** rentaromiio@gmail.com
- **Website:** https://rentaromiio.com

---
*Made with ❤️ for Rent a Romiio business*
