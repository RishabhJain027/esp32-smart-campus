const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

console.log('Initializing WhatsApp Client...');
console.log('NOTE: This uses Chromium. First startup might take a few moments.');

// Use LocalAuth to save the session locally so you don't have to scan every time
const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'admin-number' }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let isReady = false;

client.on('qr', (qr) => {
    console.log('\n========================================================================');
    console.log('Action Required: Scan this QR Code with your WhatsApp App (7208416569)');
    console.log('Go to WhatsApp > Linked Devices > Link a Device');
    console.log('========================================================================\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    isReady = true;
    console.log('\n✅ WhatsApp Client is Ready! Successfully linked.');
    console.log(`Server is listening for messages on port ${PORT}...`);
});

client.on('authenticated', () => {
    console.log('✅ WhatsApp Authenticated successfully!');
});

client.on('auth_failure', msg => {
    console.error('❌ Authentication failure:', msg);
});

client.on('disconnected', (reason) => {
    console.log('❌ Client was logged out or disconnected:', reason);
    isReady = false;
});

client.initialize();

// API Endpoint for Next.js to call
app.post('/send', async (req, res) => {
    if (!isReady) {
        return res.status(503).json({ success: false, error: 'WhatsApp client is not ready yet. Please scan the QR code in the terminal.' });
    }

    const { phone, message } = req.body;
    if (!phone || !message) {
        return res.status(400).json({ success: false, error: 'Phone and message are required' });
    }

    try {
        // Format phone number to WhatsApp ID format (e.g., 919876543210@c.us)
        // Ensure it only contains digits and optional leading plus
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        // Default to India +91 if no country code provided and it's 10 digits
        const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        const chatId = `${finalPhone}@c.us`;

        await client.sendMessage(chatId, message);
        console.log(`📩 Sent message to ${finalPhone}: ${message.substring(0, 30)}...`);
        
        return res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Failed to send WhatsApp message:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 Internal WhatsApp API Microservice running on http://localhost:${PORT}`);
});
