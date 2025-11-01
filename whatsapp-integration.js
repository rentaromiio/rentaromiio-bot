const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// WhatsApp client setup
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Business information
const BUSINESS_INFO = {
    name: "Rent a Romiio",
    phone: "8368235765",
    website: "https://rentaromiio.com",
    email: "rentaromiio@gmail.com"
};

// Service packages with updated pricing and meaningful descriptions
const PACKAGES = {
    regular: {
        "1hr": { name: "1 Hour", price: "₹1,499", description: "Perfect for coffee, short meet, or casual conversation" },
        "3hr": { name: "3 Hours", price: "₹3,999", description: "A bit longer — events, lunch, or fun hangout" },
        "6hr": { name: "6 Hours", price: "₹7,999", description: "Fully immersive experience — event + day support" }
    },
    event: {
        "1hr": { name: "1 Hour", price: "₹1,899", description: "Professional event presence" },
        "3hr": { name: "3 Hours", price: "₹4,999", description: "Perfect for weddings or parties" },
        "6hr": { name: "6 Hours", price: "₹8,999", description: "Full-day event support & partner experience" }
    },
    special: {
        "bike": { name: "Bike Ride", price: "₹1,999/hr", description: "Adventure rides with your companion" },
        "movie": { name: "Movie Partner", price: "₹2,999/session", description: "Cinema experience together" },
        "travel": { name: "Travel Buddy", price: "₹9,999/day", description: "Full day travel companion" }
    },
    additional: {
        "text": { name: "Texting", price: "₹99/hr", description: "Virtual text companionship" },
        "text8": { name: "Texting (8 hrs)", price: "₹699", description: "Extended text support" },
        "call": { name: "Calls", price: "₹299/hr", description: "Voice call companionship" },
        "latecall": { name: "Late Night Calls", price: "₹499/hr", description: "Night time voice support" }
    }
};

// User sessions
const userSessions = new Map();

// Flexible text matching helpers
function normalizeText(text) {
    return (text || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '') // remove diacritics
        .replace(/[^a-z0-9\s]/g, ' ') // remove punctuation/emojis
        .replace(/\s+/g, ' ') // collapse spaces
        .trim();
}

function containsAny(text, patterns) {
    for (const p of patterns) {
        if (p instanceof RegExp) {
            if (p.test(text)) return true;
        } else if (text.includes(p)) {
            return true;
        }
    }
    return false;
}

function isGreeting(text) {
    const t = normalizeText(text);
    const tokens = ['hi','hii','hello','helo','hey','heyy','start','menu','namaste','namaskar','salaam','salam','yo','sup'];
    return tokens.some(tok => new RegExp(`(^|\\b)${tok}(\\b|$)`).test(t));
}

function detectCommand(text) {
    const t = normalizeText(text);
    if (containsAny(t, ['menu', 'start', 'help', 'options'])) return 'menu';
    if (containsAny(t, ['contact', 'support', 'phone', 'number', 'reach'])) return 'contact';
    if (containsAny(t, ['about', 'info', 'information', 'services', 'company'])) return 'about';
    if (containsAny(t, ['book', 'booking', 'reserve', 'schedule', 'appointment', 'book now', 'quick book'])) return 'book';
    return null;
}

function detectCategory(text) {
    const t = normalizeText(text);
    if (/\b1\b/.test(t) || containsAny(t, ['regular'])) return 'regular';
    if (/\b2\b/.test(t) || containsAny(t, ['event'])) return 'event';
    // Only match category words or number, not inner options like bike/movie/travel/weekend
    if (/\b3\b/.test(t) || containsAny(t, ['special', 'specialized'])) return 'special';
    if (/\b4\b/.test(t) || containsAny(t, ['additional', 'extra', 'text', 'call'])) return 'additional';
    return null;
}

function mapToPackageKey(text, lastCategory) {
    const t = normalizeText(text);
    if (lastCategory === 'regular' || lastCategory === 'event') {
        if (/(^|\b)1(\s*hour|\s*hr|\b)/.test(t)) return '1hr';
        if (/(^|\b)3(\s*hours?|\s*hr|\b)/.test(t)) return '3hr';
        if (/(^|\b)6(\s*hours?|\s*hr|\b)/.test(t)) return '6hr';
    }
    if (lastCategory === 'special') {
        if (containsAny(t, ['bike', 'ride'])) return 'bike';
        if (containsAny(t, ['movie', 'film', 'cinema'])) return 'movie';
        if (containsAny(t, ['travel', 'trip', 'tour'])) return 'travel';
        if (containsAny(t, ['weekend', 'saturday', 'sunday'])) return 'weekend';
    }
    if (lastCategory === 'additional') {
        if (containsAny(t, ['text8', '8 hour text', '8 hr text', 'text 8'])) return 'text8';
        if (containsAny(t, ['text', 'chat'])) return 'text';
        if (containsAny(t, ['late call', 'late night', 'night call'])) return 'latecall';
        if (containsAny(t, ['call', 'voice'])) return 'call';
    }
    // Try direct key
    return t;
}

// Helper functions
function getMainMenu() {
    return `👋 Welcome to Rent A Romiio!
Because sometimes, all you need is good company and a better mood 💖

Choose your vibe and let the moment begin 👇
1️⃣ Regular Companionship
2️⃣ Event Companionship
3️⃣ Specialized Services
4️⃣ Additional Services
5️⃣ About Us
6️⃣ Contact Info
7️⃣ Book Now

⚠️ Note: You must be 18+ to use our services.`;
}

function showPackages(packageType) {
    let message = '';
    const packages = PACKAGES[packageType];
    
    if (packageType === 'regular') {
        message = `Choose your duration, beautiful 💕\n\n`;
        message += `🕐 1 Hour — ₹1,499\n`;
        message += `(Perfect for coffee, short meet, or casual conversation)\n\n`;
        message += `🕒 3 Hours — ₹3,999\n`;
        message += `(A bit longer — events, lunch, or fun hangout)\n\n`;
        message += `🌅 6 Hours — ₹7,999\n`;
        message += `(Fully immersive experience — event + day support)\n\n`;
        message += `Companion service is available as an add-on. Pricing may fluctuate and will be higher on weekends to match demand.\n\n`;
        message += `*Type your choice: 1hr / 3hr / 6hr*`;
    }
    else if (packageType === 'event') {
        message = `Choose your event duration 🎭\n\n`;
        message += `⏰ 1 Hour — ₹1,899\n`;
        message += `(Professional event presence)\n\n`;
        message += `🕒 3 Hours — ₹4,999\n`;
        message += `(Perfect for weddings or parties)\n\n`;
        message += `🌅 6 Hours — ₹8,999\n`;
        message += `(Full-day event support & partner experience)\n\n`;
        message += `*Type your choice: 1hr / 3hr / 6hr*`;
    }
    else if (packageType === 'special') {
        message = `Pick your vibe ✨\n\n`;
        message += `🏍️ Bike Ride — ₹1,999/hr\n`;
        message += `🎬 Movie Partner — ₹2,999/session\n`;
        message += `✈️ Travel Buddy — ₹9,999/day\n`;
        message += `*Type your choice: bike / movie / travel*`;
    }
    else if (packageType === 'additional') {
        message = `Need a virtual connection? 💫\n\n`;
        message += `💬 Texting — ₹99/hr\n`;
        message += `📱 Texting (8 hrs) — ₹699\n`;
        message += `📞 Calls — ₹299/hr\n`;
        message += `🌙 Late Night Calls — ₹499/hr\n\n`;
        message += `*Type your choice: text / text8 / call / latecall*`;
    }
    
    return message;
}

function handleBooking(packageNumber, packageType, from) {
    const selectedPackage = PACKAGES[packageType][packageNumber];
    
    if (!selectedPackage) {
        return "❌ Invalid package number. Please try again or type 'menu' for main menu.";
    }
    
    // Store booking info in user session
    const session = userSessions.get(from);
    session.state = 'collecting_info';
    session.userInfo = {};
    session.selectedPackage = selectedPackage;
    session.packageType = packageType;
    session.packageNumber = packageNumber;
    
    return `💌 Great choice! Let's get a few quick details to book your Romiio 💖

📅 Please enter your preferred booking date (DD-MM-YYYY or DD/MM/YYYY):`;
}

function handleUserInfo(message, from) {
    const session = userSessions.get(from);
    if (!session.userInfo) {
        session.userInfo = {};
    }
    const body = message.body.trim();
    
    const isValidFutureDate = (input) => {
        if (typeof input !== 'string') return false;
        const s = input.replace(/\./g,'/').replace(/-/g,'/').trim();
        const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(s);
        if (!m) return false;
        let d = parseInt(m[1],10), mo = parseInt(m[2],10)-1, y = parseInt(m[3],10);
        if (y < 100) y += 2000;
        const date = new Date(y, mo, d);
        if (date.getFullYear() !== y || date.getMonth() !== mo || date.getDate() !== d) return false;
        const today = new Date(); today.setHours(0,0,0,0);
        return date.getTime() > today.getTime();
    };
    const validCities = ['delhi','noida','greater noida','gurugram','ghaziabad'];

    // Step 3: Booking Date (DD-MM-YYYY, must be future)
    if (!session.userInfo.date) {
        if (isValidFutureDate(body)) {
            session.userInfo.date = body;
            return `⏰ Please enter your preferred time slot (e.g., 2 PM - 5 PM):`;
        } else {
            return `❌ Invalid date! Please enter a valid future date in DD-MM-YYYY format.`;
        }
    }
    // Step 4: Preferred Time
    else if (!session.userInfo.time) {
        if (body.length > 1) {
            session.userInfo.time = body;
            if (session.packageType === 'additional') {
                session.state = 'awaiting_confirmation_done';
                return `📩 Great! We’ve captured your booking details.\nNow, please complete your payment to confirm your Romiio.\n👇 Scan the QR code below to proceed.`;
            }
            return `🏙️ Please choose your city (type exactly one):\n- Delhi\n- Noida\n- Greater Noida\n- Gurugram\n- Ghaziabad`;
        } else {
            return `⏰ Please enter your preferred time slot (e.g., 2 PM - 5 PM):`;
        }
    }
    // Step 5: City Selection
    else if (!session.userInfo.city) {
        const city = body.toLowerCase();
        if (validCities.includes(city)) {
            session.userInfo.city = message.body.trim();
            session.state = 'awaiting_confirmation_done';
            return `📩 Great! We’ve captured your booking details.\nNow, please complete your payment to confirm your Romiio.\n👇 Scan the QR code below to proceed.`;
        } else {
            return `❌ Please type exactly one city from the list:\nDelhi, Noida, Greater Noida, Gurugram, Ghaziabad`;
        }
    }
    
    return "Please provide the requested information.";
}

function getAboutUs() {
    return `🤝 *ABOUT RENT A ROMIIO* 🤝

*Your Perfect Companion for Every Occasion*

✨ *Why Choose Us?*
• Friendly Companionship 👥
• Event Partner 🎭  
• Emotional Support 💭
• Verified Service ✅

🛡️ *Trust & Safety*
• Complete Privacy 🔒
• Secure Communication 🔐
• Professional Conduct 🤝

*This is NOT an escort service*
*Clean, verified, friendly companionship only*

Type 'menu' to go back to main menu.`;
}

function getContactInfo() {
    return `📞 *CONTACT INFORMATION* 📞

*Business Details:*
🏢 ${BUSINESS_INFO.name}
📱 WhatsApp: +91 ${BUSINESS_INFO.phone}
🌐 Website: ${BUSINESS_INFO.website}
📧 Email: ${BUSINESS_INFO.email}

*Business Hours:*
🕐 Available 24/7 for bookings
📅 Quick response guaranteed

*Ready to book? Type 'menu' to see our packages!*`;
}

// Main message handler
client.on('message', async message => {
  try {
    const from = message.from;
    const rawBody = message.body || '';
    const body = normalizeText(rawBody);
    
    // Initialize user session if not exists
    if (!userSessions.has(from)) {
        userSessions.set(from, { state: 'main', lastActivity: Date.now() });
    }
    
    const session = userSessions.get(from);
    session.lastActivity = Date.now();
    
    // Global 'done' handler (case-insensitive), prioritized; only once per conversation
    if (/\bdone\b/.test(body)) {
        if (session.finalMessageSent) {
            // ignore repeats
            return;
        }
        if (session.state === 'awaiting_confirmation_done' || session.state === 'verifying' || session.state === 'payment_pending') {
            session.finalMessageSent = true;
            await message.reply('✅ We are verifying your payment.\nPlease wait while we finalize your booking details... 💫');
            // reset session so user can start again
        userSessions.set(from, { state: 'main', lastActivity: Date.now() });
            return;
        }
    }
    // Treat image/screenshot as payment confirmation during QR step
    if (session.state === 'awaiting_confirmation_done' && (message.hasMedia || message.type === 'image')) {
        session.finalMessageSent = true;
        await message.reply('✅ We are verifying your payment.\nPlease wait while we finalize your booking details... 💫');
        userSessions.set(from, { state: 'main', lastActivity: Date.now() });
        return;
    }

    // PRIORITY: Handle info collection first to avoid number-based misrouting (e.g., dates triggering categories)
    if (session.state === 'collecting_info') {
        const response = handleUserInfo(message, from);
        await message.reply(response);
        return;
    }

    // Specialized flows: step-wise info collection
    if (session.state === 'special_bike_location') {
        if (rawBody.trim().length > 2) {
            session.userInfo = session.userInfo || {};
            session.userInfo.pickupLocation = rawBody.trim();
            session.state = 'special_bike_date';
            await message.reply('📅 Please share your preferred date for the bike ride (any format is fine).');
        } else {
            await message.reply('📍 Please provide a pickup point location.');
        }
        return;
    }
    if (session.state === 'special_bike_date') {
        session.userInfo = session.userInfo || {};
        session.userInfo.date = rawBody.trim();
        session.state = 'payment_pending';
        await message.reply(`✅ Details captured

🚲 Bike Ride
📍 Pickup: ${session.userInfo.pickupLocation}
📅 Date: ${session.userInfo.date}

💰 Please complete payment to confirm your booking. Reply 'done' after payment.`);
        return;
    }
    if (session.state === 'special_movie_date') {
        session.userInfo = session.userInfo || {};
        session.userInfo.date = rawBody.trim();
        session.state = 'special_movie_details';
        await message.reply('🎬 Please share cinema hall location and preferred show timing.');
        return;
    }
    if (session.state === 'special_movie_details') {
        session.userInfo = session.userInfo || {};
        session.userInfo.cinemaDetails = rawBody.trim();
        session.state = 'payment_pending';
        await message.reply(`✅ Details captured

🎬 Movie Partner
📅 Date: ${session.userInfo.date}
📍 Cinema & Timing: ${session.userInfo.cinemaDetails}

💰 Please complete payment to confirm. Reply 'done' after payment.`);
        return;
    }
    if (session.state === 'travel_start_date') {
        session.userInfo = session.userInfo || {};
        session.userInfo.travelFrom = rawBody.trim();
        session.state = 'travel_end_date';
        await message.reply('📅 Great! Now share your return/end date.');
        return;
    }
    if (session.state === 'travel_end_date') {
        session.userInfo = session.userInfo || {};
        session.userInfo.travelTo = rawBody.trim();
        session.state = 'payment_pending';
        await message.reply(`✅ Details captured

✈️ Travel Buddy
📅 Travel Dates: ${session.userInfo.travelFrom} → ${session.userInfo.travelTo}

💰 Please complete payment to confirm. Reply 'done' after payment.`);
        return;
    }
    if (session.state === 'weekend_date') {
        session.userInfo = session.userInfo || {};
        session.userInfo.date = rawBody.trim();
        session.state = 'weekend_time';
        await message.reply('⏰ Please share your preferred timings for the weekend session.');
        return;
    }
    if (session.state === 'weekend_time') {
        session.userInfo = session.userInfo || {};
        session.userInfo.time = rawBody.trim();
        session.state = 'payment_pending';
        await message.reply(`✅ Details captured

💕 Weekend Romiio
📅 Date: ${session.userInfo.date}
⏰ Timings: ${session.userInfo.time}

💰 Please complete payment to confirm. Reply 'done' after payment.`);
        return;
    }
    if (session.state === 'payment_pending' && (/(done|paid)/.test(body) || /(payment|upi|qr)/.test(body))) {
        session.state = 'completed';
        await message.reply('✅ Payment received. Your booking is confirmed. Our team will share details shortly.');
        return;
    }
    
    // Step 1: Welcome / menu / greeting
    const cmd = detectCommand(body);
    if (isGreeting(body) || cmd === 'menu') {
        userSessions.set(from, { state: 'main', lastActivity: Date.now() });
        await message.reply(getMainMenu());
    }
    // Direct numeric quick actions
    else if (body === '5') {
        await message.reply(getAboutUs());
    }
    else if (body === '6') {
        await message.reply(getContactInfo());
    }
    else if (body === '7') {
        await message.reply(`🎯 *QUICK BOOKING* 🎯

*Popular Packages:*
1️⃣ Regular 1 Hour - ₹1,499
2️⃣ Regular 3 Hours - ₹3,999  
3️⃣ Event 1 Hour - ₹1,899
4️⃣ Movie Partner - ₹2,999

*Reply with package number (1-4) to book instantly!*

Or type 'menu' for all packages.`);
    }
    // Package selection if already in a category (preference over generic commands)
    else if (session.lastCategory) {
        const key = mapToPackageKey(body, session.lastCategory);
        if (PACKAGES[session.lastCategory][key]) {
            await message.reply(handleBooking(key, session.lastCategory, from));
        } else {
            // fall through to commands/category
            // no reply here
        }
    }
    // Quick commands (fallback)
    else if (cmd === 'about') {
        await message.reply(getAboutUs());
    }
    else if (cmd === 'contact') {
        await message.reply(getContactInfo());
    }
    else if (cmd === 'book') {
        await message.reply(`🎯 *QUICK BOOKING* 🎯
        
*Popular Packages:*
1️⃣ Regular 1 Hour - ₹1,499
2️⃣ Regular 3 Hours - ₹3,999  
3️⃣ Event 1 Hour - ₹1,899
4️⃣ Movie Partner - ₹2,999
        
*Reply with package number (1-4) to book instantly!*
        
Or type 'menu' for all packages.`);
    }
    // Step 2: Category selection (numbers or keywords)
    else if (!session.lastCategory && detectCategory(body)) {
        const cat = detectCategory(body);
        session.lastCategory = cat;
        await message.reply(showPackages(cat));
    }
    // Step 3: Package selection and info collection (kept for safety, typically handled earlier)
    else if (session.state === 'collecting_info') {
        const response = handleUserInfo(message, from);
        await message.reply(response);
        return;
    }
    else if (session.state === 'awaiting_confirmation_done' && /\bdone\b/.test(body)) {
        session.finalMessageSent = true;
        await message.reply(`✅ We are verifying your payment.\nPlease wait while we finalize your booking details... 💫`);
        userSessions.set(from, { state: 'main', lastActivity: Date.now() });
    }
    // Handle package booking if still unmatched and in category
    else if (session.lastCategory) {
        const key = mapToPackageKey(body, session.lastCategory);
        if (PACKAGES[session.lastCategory][key]) {
            await message.reply(handleBooking(key, session.lastCategory, from));
        } else {
            await message.reply("Please select a valid option for this category or type 'menu'.");
        }
    }
    // Step 6: Payment confirmation
    else if (session.state === 'payment_pending' && (containsAny(body, ['done', 'paid']) || /payment|upi|qr/.test(body))) {
        await message.reply('✅ Payment received. Your booking is confirmed. Our team will share details shortly.');
    }
    // Handle unrecognized messages
    else {
        await message.reply(`🤔 I didn't understand that message.

Please choose from the options below:

*Quick Actions:*
• Type 'menu' - See all services
• Type 'book' - Quick booking
• Type 'contact' - Contact info
• Type 'about' - About us

*Or just say 'hi' to start fresh!*

We're here to help you find the perfect companion! 🤝`);
    }
  } catch (err) {
    console.error('Message handler error:', err);
    try { await message.reply('Sorry, something went wrong while processing your input. Please try again.'); } catch (_) {}
    }
});

// QR Code generation
client.on('qr', (qr) => {
    console.log('QR Code generated! Scan with WhatsApp to connect your bot.');
    qrcode.generate(qr, {small: true});
});

// Bot ready
client.on('ready', () => {
    console.log('🤖 Rent a Romiio WhatsApp Bot is ready!');
    console.log('📱 Bot is now active and ready to receive messages');
    console.log(`🌐 Website: ${BUSINESS_INFO.website}`);
    console.log('✅ Customers can now message your WhatsApp Business number!');
});

// Error handling
client.on('auth_failure', msg => {
    console.error('Authentication failed:', msg);
});

client.on('disconnected', (reason) => {
    console.log('Bot disconnected:', reason);
});

// Initialize the bot
client.initialize();

// Keep the process running
process.on('SIGINT', () => {
    console.log('Shutting down bot...');
    client.destroy();
    process.exit();
});

// ---------- Render keep-alive fix ----------
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("🤖 Rent a Romiio WhatsApp Bot is live and connected ✅");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Server running on http://0.0.0.0:${PORT}`);
});
