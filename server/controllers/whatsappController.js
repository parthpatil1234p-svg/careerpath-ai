/**
 * controllers/whatsappController.js — Unified WhatsApp Automation Controller
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
const { generateNeuralVoiceNote } = require('../services/ttsService');

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
            `📞 *CareerPath AI — Automated Assistant Notice*\n\nNamaste! Yeh hamara 24x7 automated AI Career Assistant number hai. Hum live voice calls attend nahi kar sakte.\n\nKripya apna sawal ya career doubt yahan *WhatsApp text message* me bhejiye ya hamari website par visit karein:\n👉 https://careerpath.is-local.org\n\nHum turant aapko verified roadmap aur guidance reply bhej denge! 🚀`
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

    // 2. Locate student in database by phone number
    let student = null;
    try {
      student = await User.findOne({
        phone: { $in: [senderPhone, `+91${last10Digits}`, last10Digits] }
      });
    } catch (dbErr) {
      console.warn('[WhatsApp Controller] User phone lookup warning:', dbErr.message);
    }

    // 3. Construct AI Mentor Context
    const userContext = {
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
- Keep response under 150 words — concise, actionable, and encouraging.
- If asking for next steps, specifically guide them on their Week ${userContext.activeWeek} milestones.
- Sign off with: "🚀 CareerPath AI · Your 24x7 Career GPS"`;

    let aiReply = '';
    try {
      aiReply = await getGroqMentorReply(
        `${promptSystemPrefix}\n\nStudent Query: "${incomingText}"`,
        userContext,
        []
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

🚀 CareerPath AI · 24x7 Autonomous Career GPS`;
      }
    }

        // 5. Dispatch text reply back to student's WhatsApp
    await whatsappService.sendTextMessage(senderPhone, aiReply, {
      context: 'AI_CAREER_MENTOR',
      studentName: userContext.name
    });

    // 6. Voice Mail AI: Dispatch spoken Voice Note (PTT audio) with energetic neural voice
    try {
      const { base64, url } = await generateNeuralVoiceNote(aiReply, {
        voice: 'hi-IN-MadhurNeural',
        rate: '+22%',
        pitch: '+2Hz',
        maxLength: 350
      });

      const audioPayload = base64 || url;
      if (audioPayload) {
        await whatsappService.sendVoiceNote(senderPhone, audioPayload);
        console.log(`[WhatsApp Voice Mail] Energetic neural voice note dispatched to ${senderPhone}`);
      }
    } catch (voiceErr) {
      console.warn('[WhatsApp Voice Mail] Neural voice dispatch warning:', voiceErr.message);
    }

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
`🗺️ *CareerPath AI — Week ${weekNumber} Study Notes*
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
  testWhatsAppOtp
};
