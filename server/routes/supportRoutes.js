/**
 * routes/supportRoutes.js  -  Official Support & Grievance Redressal Endpoints
 * 
 * Mounted at: /api/support (in server.js)
 * 
 * Endpoints:
 *   POST /api/support/ticket            → Register new support ticket
 *   GET  /api/support/officer           → Official Grievance Officer details
 *   GET  /api/support/ticket/:ticketId  → Look up ticket status
 * 
 * CareerPath AI Technologies Inc.
 */

const express = require('express');
const router = express.Router();
const {
  createTicket,
  getGrievanceDetails,
  getTicketStatus,
  handleVoiceCallAgent
} = require('../controllers/supportController');

router.post('/ticket', createTicket);
router.get('/officer', getGrievanceDetails);
router.get('/ticket/:ticketId', getTicketStatus);
router.post('/voice-agent', handleVoiceCallAgent);

module.exports = router;
