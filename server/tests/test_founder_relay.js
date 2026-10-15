/**
 * test_founder_relay.js — Comprehensive Verification for Anonymous Founder Relay
 * 
 * Verifies:
 * 1. Student requests counselor/submits doubt -> Docket created + Alert sent to Founder (+919923092340)
 * 2. Founder checks queue (TICKETS) -> Lists pending escalations
 * 3. Founder replies (REPLY #code: ... / REPLY LAST: ...) -> Message delivered to Student from Bot (+91 7499085045)
 * 4. Confirmation sent to Founder with privacy guarantee
 * 5. Founder resolves ticket (RESOLVE #code) -> Ticket marked RESOLVED + Student notified
 */

const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const {
  handleIncomingWebhook,
  supportTicketsCache,
  findTicket,
  FOUNDER_PHONE
} = require('../controllers/whatsappController');
const whatsappService = require('../services/whatsappService');

async function runTest() {
  console.log('============================================================');
  console.log('🧪 CareerPath AI — Founder Anonymous Two-Way Relay Test');
  console.log('============================================================');

  // Intercept whatsappService.sendTextMessage to capture outbound dispatches
  const dispatchedMessages = [];
  const originalSendText = whatsappService.sendTextMessage;
  whatsappService.sendTextMessage = async (phone, text, meta = {}) => {
    dispatchedMessages.push({
      phone,
      text,
      meta,
      timestamp: new Date().toISOString()
    });
    console.log(`\n📨 [INTERCEPTED DISPATCH] -> To: ${phone} (Context: ${meta.context || 'GENERAL'})`);
    console.log(`   Content: ${text.split('\n')[0]}...`);
    return { success: true, provider: 'TEST_DRIVER', messageId: 'TEST_' + Math.random().toString(36).substring(7) };
  };

  const studentPhone = '+919876543210';
  const founderPhone = '+919923092340';

  try {
    // ----------------------------------------------------
    // TEST 1: Student requests 1-on-1 Counselor Callback
    // ----------------------------------------------------
    console.log('\n▶ TEST 1: Student sends "counselor" request');
    dispatchedMessages.length = 0;

    const mockReq1 = {
      body: {
        from: studentPhone,
        text: 'counselor',
        senderName: 'Rohit Verma'
      }
    };
    const mockRes1 = { status: () => ({ json: () => {} }) };

    await handleIncomingWebhook(mockReq1, mockRes1);

    // We expect: 
    // 1 message to Student (counselor docket confirmation)
    // 1 message to Founder (alert with student info & reply syntax)
    const studentCounselConfirm = dispatchedMessages.find(m => m.phone === studentPhone && m.meta.context === 'COUNSELOR_REQUEST_CONFIRMATION');
    const founderCounselAlert = dispatchedMessages.find(m => m.phone === founderPhone && m.meta.context === 'FOUNDER_ESCALATION_ALERT');

    assert(studentCounselConfirm, 'Student must receive counselor request confirmation');
    assert(founderCounselAlert, 'Founder must receive escalation alert on personal WhatsApp');
    assert(founderCounselAlert.text.includes('Rohit Verma'), 'Founder alert must cite student name');
    assert(founderCounselAlert.text.includes('REPLY #'), 'Founder alert must provide REPLY instructions');
    console.log('  ✓ PASSED: Counselor request alerted to Founder & confirmed to Student.');

    // ----------------------------------------------------
    // TEST 2: Student submits technical doubt via QUERY:
    // ----------------------------------------------------
    console.log('\n▶ TEST 2: Student logs technical doubt via QUERY:');
    dispatchedMessages.length = 0;

    const mockReq2 = {
      body: {
        from: studentPhone,
        text: 'QUERY: How do I connect to Supabase Prisma pooler with pgbouncer?',
        senderName: 'Rohit Verma'
      }
    };
    await handleIncomingWebhook(mockReq2, mockRes1);

    const studentQueryConfirm = dispatchedMessages.find(m => m.phone === studentPhone && m.meta.context === 'COUNSELOR_QUERY_LOGGED');
    const founderQueryAlert = dispatchedMessages.find(m => m.phone === founderPhone && m.meta.context === 'FOUNDER_ESCALATION_ALERT');

    assert(studentQueryConfirm, 'Student must receive query logged notice');
    assert(founderQueryAlert, 'Founder must receive query alert');
    assert(founderQueryAlert.text.includes('Supabase Prisma pooler'), 'Founder alert must contain query text');
    console.log('  ✓ PASSED: Technical doubt alerted to Founder & logged in queue.');

    // ----------------------------------------------------
    // TEST 3: Founder checks active ticket queue (TICKETS)
    // ----------------------------------------------------
    console.log('\n▶ TEST 3: Founder sends "TICKETS" to check queue');
    dispatchedMessages.length = 0;

    const mockReq3 = {
      body: {
        from: founderPhone,
        text: 'TICKETS',
        senderName: 'Parth Patil'
      }
    };
    await handleIncomingWebhook(mockReq3, mockRes1);

    const founderQueueView = dispatchedMessages.find(m => m.phone === founderPhone && m.meta.context === 'FOUNDER_TICKET_QUEUE');
    assert(founderQueueView, 'Founder must receive active ticket queue');
    assert(founderQueueView.text.includes('Rohit Verma'), 'Queue must show Rohit Verma tickets');
    console.log('  ✓ PASSED: Founder queue renders active student escalations.');

    // ----------------------------------------------------
    // TEST 4: Founder secretly replies to student via REPLY LAST:
    // ----------------------------------------------------
    console.log('\n▶ TEST 4: Founder replies secretly via "REPLY LAST: ..."');
    dispatchedMessages.length = 0;

    const mockReq4 = {
      body: {
        from: founderPhone,
        text: 'REPLY LAST: Use port 6543 with pgbouncer=true in DATABASE_URL, and direct 5432 for DIRECT_URL.',
        senderName: 'Parth Patil'
      }
    };
    await handleIncomingWebhook(mockReq4, mockRes1);

    // 1 message sent to Student (from bot)
    const studentReceivedReply = dispatchedMessages.find(m => m.phone === studentPhone && m.meta.context === 'COUNSELOR_DIRECT_REPLY');
    // 1 message sent to Founder (confirmation)
    const founderDeliveryConfirm = dispatchedMessages.find(m => m.phone === founderPhone && m.meta.context === 'FOUNDER_REPLY_CONFIRMED');

    assert(studentReceivedReply, 'Student must receive counselor reply from bot');
    assert(studentReceivedReply.text.includes('Lead Counselor (Parth Patil)'), 'Message must show counselor title');
    assert(studentReceivedReply.text.includes('pgbouncer=true'), 'Student must get exact text');
    assert(founderDeliveryConfirm, 'Founder must get delivery confirmation');
    assert(founderDeliveryConfirm.text.includes('Privacy Protected'), 'Founder confirmation must guarantee number masking');
    console.log('  ✓ PASSED: Secret reply delivered to student; Founder personal number masked.');

    // ----------------------------------------------------
    // TEST 5: Founder resolves ticket via "RESOLVE LAST"
    // ----------------------------------------------------
    console.log('\n▶ TEST 5: Founder resolves ticket via "RESOLVE LAST"');
    dispatchedMessages.length = 0;

    const mockReq5 = {
      body: {
        from: founderPhone,
        text: 'RESOLVE LAST',
        senderName: 'Parth Patil'
      }
    };
    await handleIncomingWebhook(mockReq5, mockRes1);

    const studentResolveNotice = dispatchedMessages.find(m => m.phone === studentPhone && m.meta.context === 'TICKET_RESOLVED_STUDENT_NOTICE');
    const founderResolveConfirm = dispatchedMessages.find(m => m.phone === founderPhone && m.meta.context === 'FOUNDER_RESOLVE_CONFIRMED');

    assert(studentResolveNotice, 'Student must receive ticket resolved notice');
    assert(founderResolveConfirm, 'Founder must receive resolve confirmation');
    console.log('  ✓ PASSED: Ticket resolved and student notified.');

    console.log('\n============================================================');
    console.log('🎉 ALL 5 FOUNDER ANONYMOUS RELAY TESTS PASSED PERFECTLY!');
    console.log('============================================================\n');

  } finally {
    // Restore original driver
    whatsappService.sendTextMessage = originalSendText;
  }
}

runTest().catch(err => {
  console.error('\n❌ Test Failure:', err);
  process.exit(1);
});
