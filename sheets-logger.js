const https = require('https');
const url = require('url');

function postJson(webhookUrl, payload) {
    try {
        const parsed = url.parse(webhookUrl);
        const data = Buffer.from(JSON.stringify(payload));
        const options = {
            hostname: parsed.hostname,
            path: parsed.path,
            protocol: parsed.protocol,
            method: 'POST',
            port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            // drain
            res.on('data', () => {});
        });
        req.on('error', () => {});
        req.write(data);
        req.end();
    } catch (_) {}
}

function logToSheet(event) {
    const webhookUrl = process.env.SHEETS_WEBHOOK_URL;
    if (!webhookUrl) return;

    const nowIso = new Date().toISOString();
    const payload = {
        timestamp: nowIso,
        ...event
    };
    postJson(webhookUrl, payload);
}

module.exports = { logToSheet };


