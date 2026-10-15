/**
 * controllers/whatsappController.js  -  Unified WhatsApp Automation Controller
 * 
 * Capabilities:
 * 1. Meta & OpenWA Webhook Receiver (24x7 Context-Aware AI Career Mentor)
 * 2. On-Demand Weekly Roadmap & Cheatsheet PDF WhatsApp Delivery
 * 3. WhatsApp OTP Test & Healthcheck Gateway
 * 
 * CareerPath AI Technologies Inc.
 */

const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const Career = require('../models/Career');
const whatsappService = require('../services/whatsappService');
const { generateWeeklyRoadmapPdf } = require('../services/pdfStudyMaterialService');
const { getGroqMentorReply } = require('../services/groqService');
const { getGeminiMentorReply } = require('../services/geminiService');

// In-Memory Student Context Cache (15 min TTL) to eliminate repetitive DB queries
const userContextCache = new Map();
const USER_CACHE_TTL_MS = 15 * 60 * 1000;

// In-Memory Support Tickets Registry for instant tracking & Grievance SLA
const supportTicketsCache = new Map();

/**
 * GET /api/whatsapp/webhook
 * Meta WhatsApp Cloud API verification handshake.
 */
const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'careerpath_ai_whatsapp_token_2026';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WhatsApp Webhook] Handshake verified successfully.');
    return res.status(200).send(challenge);
  }

  console.warn('[WhatsApp Webhook] Verification token mismatch.');
  return res.status(403).json({ error: 'Verification token mismatch' });
};

/**
 * POST /api/whatsapp/webhook
 * Unified message receiver for both Meta Cloud API & OpenWA / Baileys bridge.
 * Evaluates student query, enriches with active roadmap context, and dispatches AI guidance.
 */
const handleIncomingWebhook = async (req, res) => {
  // Acknowledge webhook immediately to prevent gateway timeouts
  res.status(200).json({ status: 'received' });

  try {
    const body = req.body || {};
    const event = body.event || 'message.received';

    // ── EVENT HANDLER 1: Voice Call Auto-Responder (call.received / call.missed) ──
    if (event === 'call.received' || event === 'call.missed') {
      const caller = body.data?.senderPhone || body.data?.from || body.from || body.phone;
      if (caller) {
        const formattedCaller = whatsappService.formatPhoneNumber(caller);
        console.log(`[WhatsApp Webhook] Incoming call event (${event}) from ${formattedCaller}. Dispatching automated guidance notice.`);
        try {
          await whatsappService.sendTextMessage(
            formattedCaller,
            `📞 *CareerPath AI  -  Automated Assistant Notice*\n\nNamaste! Yeh hamara 24x7 automated AI Career Assistant number hai. Hum live voice calls attend nahi kar sakte.\n\nKripya apna sawal ya career doubt yahan *WhatsApp text message* me bhejiye ya hamari website par visit karein:\n👉 https://careerpath.is-local.org\n\nHum turant aapko verified roadmap aur guidance reply bhej denge! 🚀`
          );
        } catch (callReplyErr) {
          console.warn('[WhatsApp Webhook] Failed to dispatch call auto-response:', callReplyErr.message);
        }
      }
      return;
    }

    // ── EVENT HANDLER 2: Delivery Failure Alert & Fallback Hook (message.failed) ──
    if (event === 'message.failed') {
      console.warn('⚠️ [WhatsApp Webhook] Outbound message delivery failed:', {
        to: body.data?.to || body.to,
        error: body.data?.error || body.error,
        messageId: body.data?.messageId || body.messageId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // ── EVENT HANDLER 3: Session Disconnection Monitor (session.disconnected) ──
    if (event === 'session.disconnected') {
      console.error('🚨 [CRITICAL ALERT] WhatsApp Gateway Session Disconnected:', {
        sessionId: body.sessionId,
        reason: body.data?.reason || body.reason || 'Unknown',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // ── EVENT HANDLER 4: Delivery Receipts & Read Ticks (message.ack) ──
    if (event === 'message.ack') {
      console.log(`[WhatsApp Webhook] Delivery receipt ACK: ${body.data?.messageId || body.messageId} | Status: ${body.data?.ack || body.ack}`);
      return;
    }

    // 1. Extract message & sender phone from Meta or OpenWA payload
    let rawSender = '';
    let incomingText = '';
    let pushSenderName = '';
    let isVoiceInput = false;

    // A. OpenWA standard webhook envelope: { event: "message.received", data: { from, body, fromMe, senderPhone, chatId, senderName } }
    if (body.event === 'message.received' && body.data) {
      if (body.data.fromMe === true) {
        return; // Ignore outbound echoes to prevent infinite reply loops
      }
      rawSender = body.data.senderPhone || body.data.from || body.data.chatId || '';
      
      const msgType = String(body.data.type || body.data.messageType || body.data.kind || body.data.mediaType || body.data.lastMessageType || '').toLowerCase();
      const msgMime = String(body.data.mimetype || '').toLowerCase();
      
      isVoiceInput = msgType === 'audio' || 
                     msgType === 'ptt' || 
                     msgType === 'voice' || 
                     msgType.includes('audio') || 
                     msgType.includes('voice') || 
                     msgMime.includes('audio') || 
                     msgMime.includes('ogg') || 
                     Boolean(body.data.isVoice) ||
                     Boolean(body.data.ptt);

      incomingText = body.data.body || body.data.text || body.data.caption || '';
      if (!incomingText.trim()) {
        if (isVoiceInput) {
          incomingText = 'Student sent a WhatsApp Voice Note asking for personalized career advice, roadmap guidance, and high-demand skills to learn.';
        } else {
          incomingText = 'Student connected via WhatsApp asking for personalized career guidance and roadmap milestones.';
        }
      }
      pushSenderName = body.data.senderName || body.data.name || '';
    }
    // B. Meta WhatsApp Cloud API structure
    else if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const msg = body.entry[0].changes[0].value.messages[0];
      rawSender = msg.from; // e.g. "919876543210"
      if (msg.type === 'text') {
        incomingText = msg.text?.body || '';
      } else if (msg.type === 'audio' || msg.type === 'voice') {
        isVoiceInput = true;
        incomingText = 'Student sent a WhatsApp Voice Note asking for personalized career guidance and next steps.';
      } else {
        incomingText = `Student sent a ${msg.type || 'media'} message asking for career mentorship.`;
      }
    } 
    // C. OpenWA / Baileys bridge flat structure
    else if (body.from || body.phone) {
      if (body.fromMe === true) {
        return;
      }
      rawSender = body.from || body.phone;
      const msgType = String(body.type || body.messageType || body.kind || body.lastMessageType || '').toLowerCase();
      const msgMime = String(body.mimetype || '').toLowerCase();
      isVoiceInput = msgType === 'audio' || 
                     msgType === 'ptt' || 
                     msgType === 'voice' || 
                     msgType.includes('audio') || 
                     msgType.includes('voice') || 
                     msgMime.includes('audio') || 
                     msgMime.includes('ogg') || 
                     Boolean(body.isVoice) ||
                     Boolean(body.ptt);

      incomingText = body.text || body.body || body.message || body.caption || '';
      if (!incomingText.trim()) {
        if (isVoiceInput) {
          incomingText = 'Student sent a WhatsApp Voice Note asking for personalized career guidance and roadmap milestones.';
        } else {
          incomingText = 'Student connected via WhatsApp asking for career mentorship.';
        }
      }
      pushSenderName = body.senderName || body.name || '';
    }

    if (!rawSender) {
      return; // Ignore notifications without sender
    }

    const senderPhone = whatsappService.formatPhoneNumber(rawSender);
    const digitsOnly = whatsappService.getPhoneDigits(senderPhone);
    const last10Digits = digitsOnly.slice(-10);

    console.log(`[WhatsApp Incoming] From: ${senderPhone} | Voice Note: ${isVoiceInput} | Query: "${incomingText}"`);

    // 2. Locate student in database (with in-memory cache to eliminate repetitive DB latency)
    let userContext = null;
    const cachedContext = userContextCache.get(senderPhone);
    if (cachedContext && (Date.now() - cachedContext.timestamp < USER_CACHE_TTL_MS)) {
      userContext = cachedContext.data;
      console.log(`[WhatsApp Context] Cache HIT for ${senderPhone} (0ms DB latency)`);
    } else {
      let student = null;
      try {
        student = await User.findOne({
          phone: { $in: [senderPhone, `+91${last10Digits}`, last10Digits] }
        });
      } catch (dbErr) {
        console.warn('[WhatsApp Controller] User phone lookup warning:', dbErr.message);
      }

      // 3. Construct AI Mentor Context
      userContext = {
        name: student ? student.name : (pushSenderName || 'Ambitious Candidate'),
        isRegistered: Boolean(student),
        degree: student?.education?.degree || student?.education?.course || 'Student',
        targetCareer: 'Full Stack Engineer',
        activeWeek: 1,
        skills: student?.skills?.map(s => s.name || s) || []
      };

      // If student exists, fetch their active roadmap for rich contextual grounding
      if (student) {
        try {
          const activeRoadmap = await Roadmap.findOne({
            user: student._id || student.id,
            status: 'active'
          });

          if (activeRoadmap) {
            userContext.activeWeek = activeRoadmap.currentWeek || 1;
            if (activeRoadmap.career) {
              const careerDoc = await Career.findById(activeRoadmap.career);
              if (careerDoc) {
                userContext.targetCareer = careerDoc.title;
              }
            }
          }
        } catch (rmErr) {
          console.warn('[WhatsApp Controller] Roadmap context lookup warning:', rmErr.message);
        }
      }

      // Store in memory cache
      userContextCache.set(senderPhone, {
        data: userContext,
        timestamp: Date.now()
      });
    }

    // ── VOICE FEATURE REMOVAL: Graceful Text Notice for Audio/Voice Messages ──
    if (isVoiceInput) {
      console.log(`[WhatsApp Incoming] Audio message received from ${senderPhone}. Dispatching text support notice.`);
      const voiceNotice = 
`🎙️ *Audio Message Received*

Namaste ${userContext.name}! 👋
Yeh automated WhatsApp service voice notes ya audio messages process nahi karti.

Kripya apna sawal ya issue yahan *WhatsApp text message* me bhejiye:
• Type *SUPPORT* ➔ Grievance Desk & Ticket Reference
• Type *ROADMAP* ➔ Current Week ${userContext.activeWeek} Milestones
• Type *NOTES* ➔ Download Weekly Study Notes PDF

📞 Official WhatsApp Support: +91 74990 85045 (Chat Only)
✉️ Official Grievance: parthpatil@careerpath.is-local.org
🌐 Portal: https://careerpath.is-local.org

🚀 CareerPath AI · Your 24x7 Career GPS`;

      await whatsappService.sendTextMessage(senderPhone, voiceNotice, {
        context: 'AUDIO_INPUT_NOTICE',
        studentName: userContext.name
      });
      return;
    }

    const trimmed = (incomingText || '').trim();
    const cleanLower = trimmed.toLowerCase();

    // ── SUPPORT SYSTEM ROUTER: Instant Human & Grievance Support Desk ──
    const isSupportKeyword = /^(support|help|madad|contact|grievance|complaint|issue|problem|human|agent|officer|admin|customercare|customer\s*care|ticket|helpline|desk)\b/i.test(cleanLower) ||
                             cleanLower.startsWith('/support') ||
                             cleanLower.startsWith('!support') ||
                             cleanLower.includes('contact support') ||
                             cleanLower.includes('help desk') ||
                             cleanLower.includes('parth patil') ||
                             cleanLower.includes('support chahiye');

    const isTicketCreation = cleanLower.startsWith('ticket:') || 
                             cleanLower.startsWith('issue:') || 
                             cleanLower.startsWith('problem:') || 
                             cleanLower.startsWith('complaint:') ||
                             cleanLower === '5';

    // 1. Support Ticket Registration
    if (isTicketCreation) {
      const issueDetails = trimmed.replace(/^(ticket|issue|problem|complaint):\s*/i, '').trim();
      const ticketId = 'CP-TKT-' + Math.floor(100000 + Math.random() * 900000);
      
      const ticketRecord = {
        ticketId,
        studentName: userContext.name,
        phone: senderPhone,
        issue: issueDetails || 'General Support & Grievance Request',
        targetCareer: userContext.targetCareer,
        activeWeek: userContext.activeWeek,
        createdAt: new Date().toISOString(),
        status: 'OPEN_ESCALATED'
      };

      supportTicketsCache.set(ticketId, ticketRecord);
      console.log(`[Support Desk] New Ticket Registered: ${ticketId} for ${senderPhone}: "${issueDetails}"`);

      const ticketReply = 
`🎫 *CareerPath AI  -  Support Ticket Registered*

• *Ticket ID:* #${ticketId}
• *Student:* ${userContext.name} (${senderPhone})
• *Status:* Priority Open · Dispatched to Grievance Desk
• *Assigned Officer:* Parth Patil (Technical & Grievance Lead)
• *Official WhatsApp:* +91 74990 85045 (Chat Only)
• *Grievance Email:* parthpatil@careerpath.is-local.org
• *Statutory SLA:* Within 24 Hours (DPDP Act 2023 & IT Rules 2021)
• *Campus Location:* GHRCEM, Jalgaon, Maharashtra, India

${issueDetails ? `📝 *Logged Issue:* "${issueDetails}"\n\n` : ''}Aapka ticket confirm ho gaya hai. Grievance Officer review karke jald hi revert karenge!

🌐 *Web Portal:* https://careerpath.is-local.org
🚀 *CareerPath AI · 24x7 Verified Talent OS*`;

      await whatsappService.sendTextMessage(senderPhone, ticketReply, {
        context: 'SUPPORT_TICKET_CONFIRMATION',
        studentName: userContext.name
      });
      return;
    }

    // 2. Instant Category Quick Responders (Option 1, 2, 3, 4)
    if (cleanLower === '1' || cleanLower === 'otp' || cleanLower === 'login') {
      const otpHelpReply = 
`🔐 *CareerPath AI  -  Login & Dual-OTP Support*

Namaste ${userContext.name}! Agar aapko OTP ya login me issue aa raha hai:

1. *Dual Verification Check:*
   • Platform par Gmail aur WhatsApp *dono* par alag 6-digit codes aate hain.
   • Dono codes enter karna required hai.

2. *WhatsApp OTP Delivery:*
   • Kripya 10-digit number bina leading 0 ke enter karein.
   • WhatsApp par code instantly (< 2 seconds) deliver hota hai.

3. *Gmail OTP Delivery:*
   • Apne Gmail ke *Spam* ya *Promotions* folder check karein.
   • Agar 60 seconds me na mile, toh "Resend OTP" click karein.

💬 *Still stuck?*
Bas reply karein: *TICKET: [Aapka issue]* (e.g. *TICKET: OTP nahi mila*)
Hum priority review shuru kar denge!

📞 Support WhatsApp: +91 74990 85045
✉️ Email: parthpatil@careerpath.is-local.org`;

      await whatsappService.sendTextMessage(senderPhone, otpHelpReply, {
        context: 'SUPPORT_OTP_GUIDE',
        studentName: userContext.name
      });
      return;
    }

    if (cleanLower === '2' || cleanLower === 'test' || cleanLower === 'proctor' || cleanLower === 'strike') {
      const testHelpReply = 
`⏱️ *CareerPath AI  -  Milestone Test & Anti-Cheat Support*

Namaste ${userContext.name}! Weekly milestone tests strict server proctoring ke saath aate hain:

1. *Pass Threshold:* 70% passing score is required to unlock subsequent weeks.
2. *Proctoring Rules:*
   • Fullscreen mode is mandatory.
   • Strike 1: -2 min penalty.
   • Strike 2: -3 min penalty.
   • Strike 3: Test termination & 24-hour lockout.
3. *Emergency Reset Request:*
   • Agar genuine technical disconnect hua tha, apna registered email *parthpatil@careerpath.is-local.org* par bhejiye with subject "Milestone Test Reset".

💬 *Raise Ticket:* Reply with *TICKET: Milestone reset request*
📞 WhatsApp: +91 74990 85045`;

      await whatsappService.sendTextMessage(senderPhone, testHelpReply, {
        context: 'SUPPORT_TEST_GUIDE',
        studentName: userContext.name
      });
      return;
    }

    if (cleanLower === '3' || cleanLower === 'certificate' || cleanLower === 'cert') {
      const certHelpReply = 
`📜 *CareerPath AI  -  Certificate & Verification Support*

Namaste ${userContext.name}! Verified digital certificates se judi jaankari:

1. *Unlock Criteria:* Complete all weekly milestone roadmaps with passing scores.
2. *Tamper-Proof Verification:* Every certificate carries an immutable SHA-256 hash.
3. *Verify Online:* Anyone can verify credentials at:
   👉 https://careerpath.is-local.org/verify.html
4. *Corrections:* Name ya degree details update karne ke liye reply karein:
   *TICKET: Certificate name correction [Aapka name]*

📞 Grievance Desk WhatsApp: +91 74990 85045
✉️ parthpatil@careerpath.is-local.org`;

      await whatsappService.sendTextMessage(senderPhone, certHelpReply, {
        context: 'SUPPORT_CERT_GUIDE',
        studentName: userContext.name
      });
      return;
    }

    if (cleanLower === '4' || cleanLower === 'recruiter' || cleanLower === 'hiring') {
      const recruiterHelpReply = 
`🏢 *CareerPath AI  -  Corporate Recruiter & Job Radar Support*

Namaste ${userContext.name}!
Corporate hiring & talent radar support:

1. *Recruiter Verification:* Free webmail (Gmail/Yahoo) is blocked; corporate work email is mandatory.
2. *4-Tier Anti-Fraud Gate:* DNS MX resolution, HTTP live probe, and OTP verification.
3. *Direct Talent Radar:* Recruiters search students based on real, verified skill badges.
4. *Campus / TPO Partnerships:* placement@careerpath.is-local.org

💬 *Support Escalation:*
Reply *TICKET: Recruiter onboarding assistance*
📞 WhatsApp: +91 74990 85045`;

      await whatsappService.sendTextMessage(senderPhone, recruiterHelpReply, {
        context: 'SUPPORT_RECRUITER_GUIDE',
        studentName: userContext.name
      });
      return;
    }

    // 3. Human Career Counselor & 1-on-1 Callback Desk
    const isCounselorKeyword = cleanLower === '6' ||
                               /^(counselor|counsellor|counseling|career\s*counselor|human\s*counselor|academic\s*counselor|callback|call\s*me|call\s*back|phone\s*support|talk\s*to\s*human|live\s*agent|expert|mentor\s*call)\b/i.test(cleanLower) ||
                               cleanLower.includes('talk to human') ||
                               cleanLower.includes('human counselor') ||
                               cleanLower.includes('human support') ||
                               cleanLower.includes('call request') ||
                               cleanLower.includes('counselor chahiye') ||
                               cleanLower.includes('counselor se baat');

    if (isCounselorKeyword) {
      const counselTicketId = 'CP-COUNSEL-' + Math.floor(100000 + Math.random() * 900000);
      const counselRecord = {
        ticketId: counselTicketId,
        studentName: userContext.name,
        phone: senderPhone,
        type: 'HUMAN_COUNSELOR_CALLBACK',
        issue: '1-on-1 Human Career Counseling & Callback Request',
        targetCareer: userContext.targetCareer,
        activeWeek: userContext.activeWeek,
        skills: userContext.skills,
        createdAt: new Date().toISOString(),
        status: 'PENDING_COUNSELOR_CALLBACK'
      };

      supportTicketsCache.set(counselTicketId, counselRecord);
      console.log(`[Support Desk] Human Counselor Request Logged: #${counselTicketId} for ${senderPhone} (${userContext.name})`);

      const counselReply = 
`🧑‍🏫 *CareerPath AI  -  Human Career Counselor Desk*

Namaste ${userContext.name}! 👋
Aapki *1-on-1 Human Academic & Career Counseling* request register ho gayi hai:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎫 *Counseling Docket:* #${counselTicketId}
👤 *Student:* ${userContext.name} (${senderPhone})
🎯 *Target Track:* ${userContext.targetCareer} (Roadmap Week ${userContext.activeWeek})
👨‍💼 *Lead Counselor:* Parth Patil & GHRCEM Senior Mentors
🕒 *Callback Window:* Within 2 to 4 business hours (10 AM – 7 PM IST)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 *What happens next?*
1. Hamare senior academic advisor aapke WhatsApp number par directly connect karenge.
2. Agar aapko koi specific question, portfolio link, ya resume review karwana hai, toh bas reply karein:
   👉 *QUERY: [Aapka doubt ya portfolio link]*

✉️ *Direct Counselor Email:*
parthpatil@careerpath.is-local.org

🌐 *Web Portal:* https://careerpath.is-local.org
🚀 *CareerPath AI · 24x7 Verified Talent OS*`;

      await whatsappService.sendTextMessage(senderPhone, counselReply, {
        context: 'COUNSELOR_REQUEST_CONFIRMATION',
        studentName: userContext.name
      });
      return;
    }

    // 4. Student Counselor Query Logger (QUERY: ... / DOUBT: ...)
    const isQueryLogging = cleanLower.startsWith('query:') || cleanLower.startsWith('doubt:') || cleanLower.startsWith('sawal:');
    if (isQueryLogging) {
      const queryContent = trimmed.replace(/^(query|doubt|sawal):\s*/i, '').trim();
      const queryTicketId = 'CP-QRY-' + Math.floor(100000 + Math.random() * 900000);

      const queryRecord = {
        ticketId: queryTicketId,
        studentName: userContext.name,
        phone: senderPhone,
        type: 'STUDENT_COUNSELOR_QUERY',
        issue: queryContent || 'Student Counseling Doubt',
        targetCareer: userContext.targetCareer,
        activeWeek: userContext.activeWeek,
        createdAt: new Date().toISOString(),
        status: 'LOGGED_FOR_COUNSELOR_REVIEW'
      };

      supportTicketsCache.set(queryTicketId, queryRecord);
      console.log(`[Support Desk] Student Query Logged: #${queryTicketId} for ${senderPhone}: "${queryContent}"`);

      const queryReply = 
`📝 *CareerPath AI  -  Counselor Query Docketed*

Namaste ${userContext.name}! 
Aapka doubt hamare lead career counselor ke priority review docket me add kar diya gaya hai:

• *Docket ID:* #${queryTicketId}
• *Logged Doubt:* "${queryContent}"
• *Assigned Officer:* Parth Patil (Technical & Grievance Lead)
• *Status:* Priority Review Active

Hum is query ka specific roadmap solution lekar aapse WhatsApp par revert karenge!

🚀 *CareerPath AI · 24x7 Verified Talent OS*`;

      await whatsappService.sendTextMessage(senderPhone, queryReply, {
        context: 'COUNSELOR_QUERY_LOGGED',
        studentName: userContext.name
      });
      return;
    }

    // 5. Active Tickets & Status Inquiries
    const isStatusKeyword = cleanLower === '7' || 
                            cleanLower === 'status' || 
                            cleanLower === 'my ticket' || 
                            cleanLower === 'ticket status' ||
                            cleanLower === 'check ticket';

    if (isStatusKeyword) {
      const userTickets = [];
      for (const [id, record] of supportTicketsCache.entries()) {
        if (record.phone === senderPhone) {
          userTickets.push(record);
        }
      }

      let statusReply = '';
      if (userTickets.length === 0) {
        statusReply = 
`🔍 *CareerPath AI  -  Support Ticket Status*

Namaste ${userContext.name}!
Aapke phone number (${senderPhone}) se koi open support ticket ya counselor request pending nahi hai.

📋 *Quick Actions:*
• Support menu ke liye type karein: *SUPPORT*
• Naya ticket raise karne ke liye: *TICKET: [Aapka issue]*
• Human counselor callback ke liye: *COUNSELOR*

🌐 *Web Portal:* https://careerpath.is-local.org
🚀 *CareerPath AI · 24x7 Verified Talent OS*`;
      } else {
        const ticketListStr = userTickets.slice(-3).map(t => 
          `• *#${t.ticketId}* (${t.type || 'SUPPORT'})\n  Issue: "${t.issue}"\n  Status: ${t.status || 'ACTIVE'}\n  Date: ${new Date(t.createdAt).toLocaleDateString('en-IN')}`
        ).join('\n\n');

        statusReply = 
`🔍 *CareerPath AI  -  Aapke Active Tickets*

Namaste ${userContext.name}! 
Aapke phone (${senderPhone}) se associated active requests:

${ticketListStr}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Grievance Officer (Parth Patil) in sabhi requests par actively work kar rahe hain. Urgent escalation ke liye email karein: *parthpatil@careerpath.is-local.org*.

🚀 *CareerPath AI · 24x7 Verified Talent OS*`;
      }

      await whatsappService.sendTextMessage(senderPhone, statusReply, {
        context: 'TICKET_STATUS_INQUIRY',
        studentName: userContext.name
      });
      return;
    }

    // 6. General Support Protocol Menu
    if (isSupportKeyword) {
      const supportMenuReply = 
`🛠️ *CareerPath AI  -  Official Support & Grievance Desk*

Namaste ${userContext.name}! 👋
CareerPath AI Support System me aapka swagat hai:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *OFFICIAL SUPPORT CHANNELS:*
• *WhatsApp Support:* +91 74990 85045
  _(Chat Only · 24x7 Active Ticket Logging · No Voice Calls)_
• *Grievance Email:* parthpatil@careerpath.is-local.org
• *Grievance Officer:* Parth Patil
• *Location:* GHRCEM, Jalgaon, Maharashtra, India
• *Response SLA:* Within 24 Hours (DPDP Act 2023 & IT Rules 2021)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 *REPLY WITH A NUMBER FOR INSTANT HELP:*

*1* ➔ *Login & Dual-OTP Help* (Gmail / WhatsApp verification)
*2* ➔ *Milestone Test & Anti-Cheat* (Strikes, retakes & lockout)
*3* ➔ *Certificate & SHA-256 Ledger* (Verification & corrections)
*4* ➔ *Recruiter Portal & Hiring Radar* (Company verification)
*5* ➔ *Raise Priority Support Ticket* (Direct escalation to Parth Patil)
*6* ➔ *Human Career Counselor & 1-on-1 Callback* (Direct call with senior mentor)
*7* ➔ *Check My Active Tickets & Status* (Review your logged requests)

💬 _Or send a direct command anytime:_
• *COUNSELOR* ➔ Request 1-on-1 human guidance callback
• *TICKET: [your issue]* ➔ Open instant priority ticket
• *QUERY: [your doubt]* ➔ Docket technical question for mentor

🌐 *Web Portal:* https://careerpath.is-local.org
🚀 *CareerPath AI · 24x7 Verified Talent OS*`;

      await whatsappService.sendTextMessage(senderPhone, supportMenuReply, {
        context: 'SUPPORT_MENU',
        studentName: userContext.name
      });
      return;
    }

    // 4. Generate Context-Aware AI Guidance (Groq Llama 3.3 / Qwen with Gemini fallback)
    const promptSystemPrefix = 
`You are CareerPath AI's official 24x7 WhatsApp Career Mentor.
You are chatting with a student on WhatsApp.
Student Context:
- Name: ${userContext.name}
- Target Career Track: ${userContext.targetCareer}
- Current Active Roadmap: Week ${userContext.activeWeek}
- Logged Skills: ${userContext.skills.length ? userContext.skills.join(', ') : 'Not yet logged'}

WHATSAPP FORMATTING GUIDELINES:
- Greet warmly by name in Hinglish or English (e.g., "Namaste ${userContext.name}! 👋").
- Use WhatsApp markdown syntax: *bold* for emphasis, • for bullet points.
- Keep response under 150 words  -  concise, actionable, and encouraging.
- If asking for next steps, specifically guide them on their Week ${userContext.activeWeek} milestones.
- Sign off with:
"🚀 CareerPath AI · Your 24x7 Career GPS
💡 _Need help? Type *SUPPORT* for official Grievance Desk (+91 74990 85045)_"`;

    let aiReply = '';
    try {
      aiReply = await getGroqMentorReply(
        `${promptSystemPrefix}\n\nStudent Query: "${incomingText}"`,
        userContext,
        [],
        { maxTokens: 350 }
      );
    } catch (groqError) {
      console.warn('[WhatsApp AI] Groq fallback to Gemini:', groqError.message);
      try {
        aiReply = await getGeminiMentorReply(
          `${promptSystemPrefix}\n\nStudent Query: "${incomingText}"`,
          userContext,
          []
        );
      } catch (geminiError) {
        console.error('[WhatsApp AI] Both engines failed:', geminiError.message);
        aiReply = 
`Namaste ${userContext.name}! 👋

Aapka sawal mil gaya hai! CareerPath AI Mentor abhi heavy load handle kar raha hai. 
Aap apne roadmap ke *Week ${userContext.activeWeek}* tasks aur verified quiz web portal par access kar sakte hain:
👉 https://careerpath-ai-bdbt.onrender.com/roadmap.html

💡 _Need help? Type *SUPPORT* for official Grievance Desk (+91 74990 85045)_
🚀 CareerPath AI · 24x7 Autonomous Career GPS`;
      }
    }

    // 5. Clean, Fast Text-Only Dispatch (Zero Voice Notes)
    console.log(`[WhatsApp Mentor] Dispatching text mentorship reply to ${senderPhone}...`);

    await whatsappService.sendTextMessage(senderPhone, aiReply, {
      context: 'AI_CAREER_MENTOR',
      studentName: userContext.name
    });

  } catch (err) {
    console.error('[WhatsApp Controller] Error processing incoming webhook:', err);
  }
};

/**
 * POST /api/whatsapp/send-roadmap-pdf
 * Dispatches the weekly study notes and cheatsheet PDF directly to student's WhatsApp.
 * Supports download-only query param (?download=true) for instant browser preview.
 */
const sendRoadmapPdf = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const weekNumber = parseInt(req.body.weekNumber || req.query.week || '1', 10);
    const isDownloadOnly = req.query.download === 'true' || req.body.downloadOnly === true;

    // 1. Fetch active roadmap & career metadata
    let careerTitle = 'Software Engineer';
    let roadmapData = null;
    let weekTasks = [];

    const activeRoadmap = await Roadmap.findOne({
      user: user._id || user.id,
      status: 'active'
    });

    if (activeRoadmap) {
      roadmapData = activeRoadmap;
      if (activeRoadmap.career) {
        const c = await Career.findById(activeRoadmap.career);
        if (c) careerTitle = c.title;
      }

      // Extract tasks for requested week
      if (Array.isArray(activeRoadmap.weeks) && activeRoadmap.weeks[weekNumber - 1]) {
        weekTasks = activeRoadmap.weeks[weekNumber - 1].tasks || [];
      }
    }

    // 2. Generate PDF Buffer via PDFKit
    const pdfBuffer = await generateWeeklyRoadmapPdf({
      careerTitle,
      weekNumber,
      studentName: user.name || 'Student',
      roadmapData,
      tasks: weekTasks
    });

    const filename = `CareerPath_${careerTitle.replace(/\s+/g, '_')}_Week_${weekNumber}_Notes.pdf`;

    // 3. If direct download requested, stream PDF buffer
    if (isDownloadOnly) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(pdfBuffer);
    }

    // 4. WhatsApp Dispatch
    const targetPhone = req.body.phone || user.phone;
    if (!targetPhone) {
      return res.status(400).json({
        success: false,
        requiresPhone: true,
        message: 'No WhatsApp number provided. Please enter your WhatsApp number or update your profile.'
      });
    }

    const caption = 
`🗺️ *CareerPath AI  -  Week ${weekNumber} Study Notes*
Career: *${careerTitle}*
Student: *${user.name}*

Aapka weekly roadmap cheatsheet, key concepts, aur Focus Chamber video lessons PDF me attached hain. 
All the best for your milestone quiz! 🚀`;

    const dispatchResult = await whatsappService.sendDocument(
      targetPhone,
      pdfBuffer,
      filename,
      caption
    );

    return res.status(200).json({
      success: true,
      message: `Week ${weekNumber} study material and cheatsheet PDF sent to your WhatsApp!`,
      data: {
        provider: dispatchResult.provider,
        phone: whatsappService.formatPhoneNumber(targetPhone),
        filename
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/whatsapp/test-otp
 * Admin / Developer testing endpoint for WhatsApp OTP formatting.
 */
const testWhatsAppOtp = async (req, res, next) => {
  try {
    const { phone, code, name } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const otpCode = code || '482910';
    const studentName = name || req.user?.name || 'Parth';

    const result = await whatsappService.sendOtp(phone, otpCode, studentName);

    return res.status(200).json({
      success: true,
      message: `Test OTP sent to WhatsApp (${phone})`,
      provider: result.provider,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyWebhook,
  handleIncomingWebhook,
  sendRoadmapPdf,
  testWhatsAppOtp,
  supportTicketsCache
};
