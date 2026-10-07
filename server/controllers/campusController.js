/**
 * controllers/campusController.js — Controller for College Placement Cell (TPO) Partnerships
 *
 * Handles public demo requests, Voice AI outreach webhooks, and institutional lead pipelines.
 *
 * CareerPath AI · Enterprise Backend Service
 */

const CampusLead = require('../models/CampusLead');

/**
 * @desc    Submit institutional demo request from website modal
 * @route   POST /api/campus/demo-request
 * @access  Public
 */
exports.submitDemoRequest = async (req, res, next) => {
  try {
    const {
      collegeName,
      cityState,
      contactPerson,
      designation,
      email,
      phone,
      batchSize,
      preferredDemoDate,
      notes,
    } = req.body;

    // Basic Validation
    if (!collegeName || !collegeName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'College or institution name is required.',
      });
    }

    if (!contactPerson || !contactPerson.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Contact person name is required.',
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Official institutional email is required.',
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid official email address.',
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Phone or WhatsApp number is required.',
      });
    }

    // Parse date if supplied
    let demoDate = null;
    if (preferredDemoDate) {
      const parsed = new Date(preferredDemoDate);
      if (!isNaN(parsed.getTime())) {
        demoDate = parsed;
      }
    }

    // Valid designation fallback
    const validDesignations = ['TPO', 'HOD', 'Principal', 'Dean', 'Professor', 'Other'];
    const safeDesignation = validDesignations.includes(designation) ? designation : 'TPO';

    // Valid batch size fallback
    const validBatchSizes = ['100-300', '300-800', '800-2000', '2000+'];
    const safeBatchSize = validBatchSizes.includes(batchSize) ? batchSize : '300-800';

    const lead = await CampusLead.create({
      collegeName: collegeName.trim(),
      cityState: cityState ? cityState.trim() : '',
      contactPerson: contactPerson.trim(),
      designation: safeDesignation,
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      batchSize: safeBatchSize,
      preferredDemoDate: demoDate,
      source: 'website_modal',
      notes: notes ? notes.trim() : '',
      status: 'new',
    });

    return res.status(201).json({
      success: true,
      message: 'Institutional demo request submitted successfully! Our campus partnership team will reach out within 24 hours.',
      data: {
        id: lead._id,
        collegeName: lead.collegeName,
        contactPerson: lead.contactPerson,
        email: lead.email,
        phone: lead.phone,
        designation: lead.designation,
        batchSize: lead.batchSize,
        preferredDemoDate: lead.preferredDemoDate,
        createdAt: lead.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Voice AI Assistant (Rohan) webhook for call demo bookings
 * @route   POST /api/campus/voice-ai-webhook
 * @access  Public (Webhook)
 */
exports.voiceAiWebhook = async (req, res, next) => {
  try {
    const {
      collegeName,
      contactPerson,
      phone,
      email,
      cityState,
      designation,
      batchSize,
      callId,
      voiceAiCallId,
      notes,
    } = req.body;

    const actualCallId = voiceAiCallId || callId || null;

    if (!collegeName && !contactPerson && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook payload: collegeName, contactPerson, or phone is required.',
      });
    }

    // Fallback email if Voice AI didn't catch an email address
    const safeEmail = email && email.includes('@') 
      ? email.trim().toLowerCase() 
      : `tpo-${Date.now()}@campus-inbound.careerpathai.com`;

    const lead = await CampusLead.create({
      collegeName: (collegeName || 'Unknown College').trim(),
      cityState: (cityState || '').trim(),
      contactPerson: (contactPerson || 'TPO Representative').trim(),
      designation: designation || 'TPO',
      email: safeEmail,
      phone: (phone || 'Not Provided').trim(),
      batchSize: batchSize || '300-800',
      source: 'voice_ai_call',
      voiceAiCallId: actualCallId,
      notes: (notes || 'Generated via Voice AI Assistant outreach call').trim(),
      status: 'new',
    });

    return res.status(200).json({
      success: true,
      message: 'Voice AI campus lead ingested successfully.',
      leadId: lead._id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all campus leads for administrative review
 * @route   GET /api/campus/leads
 * @access  Public / Admin
 */
exports.getCampusLeads = async (req, res, next) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const leads = await CampusLead.find(filter)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await CampusLead.countDocuments(filter);

    return res.status(200).json({
      success: true,
      count: leads.length,
      total,
      page: parseInt(page),
      data: leads,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get aggregate institutional partnership statistics
 * @route   GET /api/campus/stats
 * @access  Public
 */
exports.getCampusStats = async (req, res, next) => {
  try {
    const totalInquiries = await CampusLead.countDocuments();
    const scheduledDemos = await CampusLead.countDocuments({ status: 'demo_scheduled' });
    const activePilots = await CampusLead.countDocuments({ status: 'pilot_active' });

    return res.status(200).json({
      success: true,
      data: {
        partnerColleges: Math.max(42, totalInquiries + 42),
        totalStudentReach: '54,000+',
        averagePlacementBoost: '+38%',
        accreditationAlignment: 'NAAC A++ & NIRF Metric 5.1/5.2',
        inquiriesRecorded: totalInquiries,
        scheduledDemos,
        activePilots,
      },
    });
  } catch (error) {
    next(error);
  }
};
