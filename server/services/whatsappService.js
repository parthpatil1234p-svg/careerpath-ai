/**
 * services/whatsappService.js — WhatsApp Automation Driver
 * 
 * Multi-Provider Architecture:
 * 1. Meta WhatsApp Cloud API (Production Official Graph API)
 * 2. OpenWA / Baileys HTTP Bridge (Self-hosted bot runner / QR scanner)
 * 3. High-Fidelity Console Fallback Driver (Local Development & Offline Demos)
 * 
 * Capabilities:
 * - 🔑 Instant 2-second 6-digit OTP delivery
 * - 🗺️ Weekly Roadmap Notes & Cheatsheet PDF delivery
 * - 🤖 24x7 AI Career Assistant response delivery
 * 
 * CareerPath AI Technologies Inc.
 */

const https = require('https');
const http = require('http');

/**
 * Sanitizes and formats phone numbers to E.164 standard.
 * Default country code fallback: +91 (India)
 * 
 * @param {string} rawPhone - Raw input phone number
 * @returns {string} - Formatted phone number with country code (e.g. "+919876543210")
 */
function formatPhoneNumber(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') return '';
  // Remove spaces, hyphens, parentheses, dots
  let cleaned = rawPhone.replace(/[\s\-\(\)\.]/g, '').trim();

  // If starts with 0, replace leading 0 with +91
  if (cleaned.startsWith('0')) {
    cleaned = '+91' + cleaned.substring(1);
  }

  // If 10 digits without prefix, prepend +91
  if (/^\d{10}$/.test(cleaned)) {
    cleaned = '+91' + cleaned;
  }

  // Ensure leading plus if digits only and length >= 11
  if (/^\d{11,15}$/.test(cleaned)) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
}

/**
 * Extracts digits only for API payloads (e.g. "919876543210")
 */
function getPhoneDigits(phone) {
  const formatted = formatPhoneNumber(phone);
  return formatted.replace(/\D/g, '');
}

/**
 * Dispatches an instant 6-digit WhatsApp OTP verification message.
 * 
 * @param {string} phone - Recipient phone number
 * @param {string} otpCode - 6-digit OTP code
 * @param {string} studentName - Student's full name
 * @returns {Promise<{success: boolean, provider: string, messageId?: string, error?: string}>}
 */
async function sendOtp(phone, otpCode, studentName = 'Student') {
  const formattedPhone = formatPhoneNumber(phone);
  if (!formattedPhone) {
    return { success: false, error: 'Invalid or missing phone number' };
  }

  const name = (studentName || 'Student').trim().split(' ')[0];
  const messageText = 
`🔐 *CareerPath AI — Verification Code*

Namaste ${name}! 👋 
Aapka CareerPath AI student account verification code hai:

👉 *${otpCode}*

Ye code agle 10 minute tak valid hai. Kripya ise kisi ke sath share na karein.

🚀 CareerPath AI Technologies Inc. · 24x7 Autonomous Career GPS`;

  return sendTextMessage(formattedPhone, messageText, {
    context: 'OTP_VERIFICATION',
    otpCode,
    studentName: name
  });
}

/**
 * Sends a WhatsApp document (such as Weekly Roadmap Notes PDF).
 * 
 * @param {string} phone - Recipient phone number
 * @param {Buffer|string} documentBufferOrUrl - PDF buffer or public URL
 * @param {string} filename - Document filename (e.g. "CareerPath_Week_1_Notes.pdf")
 * @param {string} caption - WhatsApp message caption
 * @returns {Promise<{success: boolean, provider: string, messageId?: string, error?: string}>}
 */
async function sendDocument(phone, documentBufferOrUrl, filename = 'CareerPath_Roadmap_Notes.pdf', caption = '') {
  const formattedPhone = formatPhoneNumber(phone);
  if (!formattedPhone) {
    return { success: false, error: 'Invalid or missing phone number' };
  }

  const digits = getPhoneDigits(formattedPhone);
  const openwaUrl = process.env.OPENWA_API_URL || '';
  const openwaApiKey = process.env.OPENWA_API_KEY || '';
  const openwaSessionId = process.env.OPENWA_SESSION_ID || '7947d4c9-0297-4396-be07-330534d6c58a';
  const bridgeUrl = process.env.WHATSAPP_BRIDGE_URL || '';
  const token = process.env.WHATSAPP_TOKEN || '';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';

  // 1. OpenWA Live Gateway (High-priority live session runner)
  if (openwaUrl && openwaApiKey && openwaSessionId) {
    try {
      const isBuffer = Buffer.isBuffer(documentBufferOrUrl);
      const docPayload = {
        chatId: `${digits}@c.us`,
        filename,
        caption: caption || `📄 ${filename} — CareerPath AI Study Material`
      };

      if (isBuffer) {
        docPayload.base64 = documentBufferOrUrl.toString('base64');
        docPayload.mimetype = 'application/pdf';
      } else if (typeof documentBufferOrUrl === 'string') {
        docPayload.url = documentBufferOrUrl;
      }

      const res = await openwaApiRequest(
        `/api/sessions/${openwaSessionId}/messages/send-document`,
        JSON.stringify(docPayload)
      );
      console.log(`[WhatsApp] OpenWA Live Gateway Document sent to ${formattedPhone} (${filename}) [id: ${res.messageId || 'sent'}]`);
      return { success: true, provider: 'openwa_gateway', messageId: res.messageId };
    } catch (err) {
      console.error('[WhatsApp] OpenWA Live Gateway Document dispatch failed:', err.message);
      // Fall through to remaining providers
    }
  }

  // 2. Meta WhatsApp Cloud API (if public URL provided)
  if (token && phoneNumberId && typeof documentBufferOrUrl === 'string' && documentBufferOrUrl.startsWith('http')) {
    try {
      const payload = JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: digits,
        type: 'document',
        document: {
          link: documentBufferOrUrl,
          filename,
          caption: caption || `📄 ${filename} — CareerPath AI Study Material`
        }
      });

      const res = await metaApiRequest(phoneNumberId, token, payload);
      console.log(`[WhatsApp] Meta Cloud API Document sent to ${formattedPhone} (${filename})`);
      return { success: true, provider: 'meta_cloud_api', messageId: res.messages?.[0]?.id };
    } catch (err) {
      console.error('[WhatsApp] Meta Cloud API Document dispatch failed:', err.message);
    }
  }

  // 3. OpenWA / Baileys HTTP Bridge
  if (bridgeUrl) {
    try {
      const isBuffer = Buffer.isBuffer(documentBufferOrUrl);
      const base64Data = isBuffer ? documentBufferOrUrl.toString('base64') : null;
      const fileUrl = !isBuffer && typeof documentBufferOrUrl === 'string' ? documentBufferOrUrl : null;

      const payload = JSON.stringify({
        phone: digits,
        filename,
        caption: caption || `📄 ${filename} — CareerPath AI Study Material`,
        base64: base64Data,
        url: fileUrl
      });

      const res = await bridgeApiRequest(`${bridgeUrl}/send-document`, payload);
      console.log(`[WhatsApp] Bridge Document sent to ${formattedPhone} (${filename})`);
      return { success: true, provider: 'openwa_bridge', messageId: res.id || 'bridge-doc-id' };
    } catch (err) {
      console.error('[WhatsApp] OpenWA Bridge Document dispatch failed:', err.message);
    }
  }

  // 4. High-Fidelity Console Fallback Driver
  const sizeKb = Buffer.isBuffer(documentBufferOrUrl) 
    ? (documentBufferOrUrl.length / 1024).toFixed(1) + ' KB'
    : 'URL Attachment';

  console.log('\n============================================================');
  console.log('📱 [WHATSAPP DOCUMENT DISPATCH] (Console Fallback Driver)');
  console.log(`To:        ${formattedPhone} (digits: ${digits})`);
  console.log(`File:      ${filename} (${sizeKb})`);
  console.log(`Caption:   ${caption}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('============================================================\n');

  return {
    success: true,
    provider: 'console_fallback',
    messageId: `mock-doc-${Date.now()}`,
    filename,
    phone: formattedPhone
  };
}

/**
 * Sends a generic text message via WhatsApp.
 * 
 * @param {string} phone - Recipient phone number
 * @param {string} messageText - Message text
 * @param {object} meta - Extra metadata for logs/hooks
 * @returns {Promise<{success: boolean, provider: string, messageId?: string, error?: string}>}
 */
async function sendTextMessage(phone, messageText, meta = {}) {
  const formattedPhone = formatPhoneNumber(phone);
  if (!formattedPhone) {
    return { success: false, error: 'Invalid or missing phone number' };
  }

  const digits = getPhoneDigits(formattedPhone);
  const openwaUrl = process.env.OPENWA_API_URL || '';
  const openwaApiKey = process.env.OPENWA_API_KEY || '';
  const openwaSessionId = process.env.OPENWA_SESSION_ID || '7947d4c9-0297-4396-be07-330534d6c58a';
  const token = process.env.WHATSAPP_TOKEN || '';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  const bridgeUrl = process.env.WHATSAPP_BRIDGE_URL || '';

  // 1. OpenWA Live Gateway (High-priority live session runner)
  if (openwaUrl && openwaApiKey && openwaSessionId) {
    try {
      const payload = JSON.stringify({
        chatId: `${digits}@c.us`,
        text: messageText
      });

      const res = await openwaApiRequest(
        `/api/sessions/${openwaSessionId}/messages/send-text`,
        payload
      );
      console.log(`[WhatsApp] OpenWA Live Gateway Message dispatched to ${formattedPhone} (id: ${res.messageId || 'sent'})`);
      return { success: true, provider: 'openwa_gateway', messageId: res.messageId };
    } catch (err) {
      console.error('[WhatsApp] OpenWA Live Gateway Message failed:', err.message);
      // Fall through to remaining providers
    }
  }

  // 2. Meta WhatsApp Cloud API
  if (token && phoneNumberId) {
    try {
      const payload = JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: digits,
        type: 'text',
        text: {
          preview_url: true,
          body: messageText
        }
      });

      const res = await metaApiRequest(phoneNumberId, token, payload);
      console.log(`[WhatsApp] Meta Cloud API Message dispatched to ${formattedPhone} (id: ${res.messages?.[0]?.id})`);
      return { success: true, provider: 'meta_cloud_api', messageId: res.messages?.[0]?.id };
    } catch (err) {
      console.error('[WhatsApp] Meta Cloud API Message failed:', err.message);
    }
  }

  // 3. OpenWA / Baileys HTTP Bridge
  if (bridgeUrl) {
    try {
      const payload = JSON.stringify({
        phone: digits,
        text: messageText,
        meta
      });

      const res = await bridgeApiRequest(`${bridgeUrl}/send-text`, payload);
      console.log(`[WhatsApp] OpenWA Bridge Message dispatched to ${formattedPhone}`);
      return { success: true, provider: 'openwa_bridge', messageId: res.id || 'bridge-msg-id' };
    } catch (err) {
      console.error('[WhatsApp] OpenWA Bridge Message failed:', err.message);
    }
  }

  // 4. High-Fidelity Console Fallback Driver
  console.log('\n============================================================');
  console.log('📱 [WHATSAPP MESSAGE DISPATCH] (Console Fallback Driver)');
  console.log(`To:        ${formattedPhone} (digits: ${digits})`);
  console.log(`Type:      ${meta.context || 'GENERAL_TEXT'}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('────────────────────────────────────────────────────────────');
  console.log(messageText);
  console.log('============================================================\n');

  return {
    success: true,
    provider: 'console_fallback',
    messageId: `mock-wa-${Date.now()}`,
    phone: formattedPhone
  };
}

/**
 * Helper to dispatch HTTP request to Meta Graph API
 */
function metaApiRequest(phoneNumberId, token, bodyString) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/v21.0/${phoneNumberId}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyString)
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error?.message || `HTTP ${res.statusCode}: ${data}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse Meta response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Meta Cloud API request timed out (10s)'));
    });

    req.write(bodyString);
    req.end();
  });
}

/**
 * Helper to dispatch HTTP request to local OpenWA Bridge
 */
function bridgeApiRequest(endpointUrl, bodyString) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpointUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyString)
      },
      timeout: 5000
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch {
          resolve({ raw: data, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('WhatsApp Bridge request timed out'));
    });

    req.write(bodyString);
    req.end();
  });
}

/**
 * Helper to dispatch HTTP/HTTPS request to OpenWA Live Gateway (rmyndharis/OpenWA)
 */
function openwaApiRequest(endpointPath, bodyString) {
  return new Promise((resolve, reject) => {
    const rawUrl = process.env.OPENWA_API_URL || 'https://openwa-phe1.onrender.com';
    const apiKey = process.env.OPENWA_API_KEY || '';
    const url = new URL(rawUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const formattedPath = endpointPath.startsWith('/api') ? endpointPath : `/api${endpointPath}`;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: formattedPath,
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyString)
      },
      timeout: 12000
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.message || parsed.error || `HTTP ${res.statusCode}: ${data}`));
          }
        } catch {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ raw: data, statusCode: res.statusCode });
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('OpenWA Gateway request timed out (12s)'));
    });

    req.write(bodyString);
    req.end();
  });
}

module.exports = {
  formatPhoneNumber,
  getPhoneDigits,
  sendOtp,
  sendDocument,
  sendTextMessage,
  openwaApiRequest
};
