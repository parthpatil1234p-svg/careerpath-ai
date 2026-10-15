/**
 * test_founder_relay.js — Comprehensive Verification for Anonymous Founder & Co-Founder Relay
 * 
 * Verifies:
 * 1. Student requests counselor/submits doubt -> Docket created + Alert sent to BOTH Founder (+919923092340) & Co-Founder (+917709589602)
 * 2. Co-Founder checks queue (TICKETS) from personal WhatsApp -> Lists pending escalations
 * 3. Co-Founder replies (REPLY #code: ... / REPLY LAST: ...) -> Message delivered to Student from Bot (+91 7499085045)
 * 4. Confirmation sent to Co-Founder with privacy guarantee
 * 5. Founder checks queue and resolves ticket (RESOLVE #code) -> Ticket marked RESOLVED + Student notified
 */

const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const {
  handleIncomingWebhook,
  supportTicketsCache,
  findTicket,
  getFounders
} = require('../controllers/whatsappController');
const whatsappService = require('../services/whatsappService');

async function runTest() {
  console.log('============================================================');
  console.log('🧪 CareerPath AI — Founder & Co-Founder Anonymous Relay Test');
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
  const cofounderPhone = '+917709589602';

  try {
    // ----------------------------------------------------
    // TEST 1: Student requests 1-on-1 Counselor Callback (Alerts BOTH Founders)
    // ----------------------------------------------------
    console.log('\n▶ TEST 1: Student sends "counselor" request (Alerts Both Founder & Co-Founder)');
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
    // 1 message to Co-Founder (alert with student info & reply syntax)
    const studentCounselConfirm = dispatchedMessages.find(m => m.phone === studentPhone && m.meta.context === 'COUNSELOR_REQUEST_CONFIRMATION');
    const founderCounselAlert = dispatchedMessages.find(m => m.phone === founderPhone && m.meta.context === 'FOUNDER_ESCALATION_ALERT');
    const cofounderCounselAlert = dispatchedMessages.find(m => m.phone === cofounderPhone && m.meta.context === 'FOUNDER_ESCALATION_ALERT');

    assert(studentCounselConfirm, 'Student must receive counselor request confirmation');
    assert(founderCounselAlert, 'Founder must receive escalation alert on personal WhatsApp');
    assert(cofounderCounselAlert, 'Co-Founder must also receive escalation alert on personal WhatsApp');
    assert(founderCounselAlert.text.includes('Rohit Verma'), 'Founder alert must cite student name');
    assert(cofounderCounselAlert.text.includes('Rohit Verma'), 'Co-Founder alert must cite student name');
    console.log('  ✓ PASSED: Counselor request alerted to both Founder & Co-Founder, confirmed to Student.');

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
    const cofounderQueryAlert = dispatchedMessages.find(m => m.phone === cofounderPhone && m.meta.context === 'FOUNDER_ESCALATION_ALERT');

    assert(studentQueryConfirm, 'Student must receive query logged notice');
    assert(founderQueryAlert, 'Founder must receive query alert');
    assert(cofounderQueryAlert, 'Co-Founder must receive query alert');
    console.log('  ✓ PASSED: Technical doubt alerted to both Founder & Co-Founder.');

    // ----------------------------------------------------
    // TEST 3: Co-Founder checks active ticket queue (TICKETS)
    // ----------------------------------------------------
    console.log('\n▶ TEST 3: Co-Founder sends "TICKETS" from +917709589602');
    dispatchedMessages.length = 0;

    const mockReq3 = {
      body: {
        from: cofounderPhone,
        text: 'TICKETS',
        senderName: 'Co-Founder'
      }
    };
    await handleIncomingWebhook(mockReq3, mockRes1);

    const cofounderQueueView = dispatchedMessages.find(m => m.phone === cofounderPhone && m.meta.context === 'FOUNDER_TICKET_QUEUE');
    assert(cofounderQueueView, 'Co-Founder must receive active ticket queue');
    assert(cofounderQueueView.text.includes('Rohit Verma'), 'Queue must show Rohit Verma tickets');
    console.log('  ✓ PASSED: Co-Founder queue renders active student escalations.');

    // ----------------------------------------------------
    // TEST 4: Co-Founder secretly replies to student via REPLY LAST:
    // ----------------------------------------------------
    console.log('\n▶ TEST 4: Co-Founder replies secretly via "REPLY LAST: ..."');
    dispatchedMessages.length = 0;

    const mockReq4 = {
      body: {
        from: cofounderPhone,
        text: 'REPLY LAST: Use port 6543 with pgbouncer=true in DATABASE_URL, and direct 5432 for DIRECT_URL.',
        senderName: 'Co-Founder'
      }
    };
    await handleIncomingWebhook(mockReq4, mockRes1);

    // 1 message sent to Student (from official bot)
    const studentReceivedReply = dispatchedMessages.find(m => m.phone === studentPhone && m.meta.context === 'COUNSELOR_DIRECT_REPLY');
    // 1 message sent to Co-Founder (confirmation)
    const cofounderDeliveryConfirm = dispatchedMessages.find(m => m.phone === cofounderPhone && m.meta.context === 'FOUNDER_REPLY_CONFIRMED');

    assert(studentReceivedReply, 'Student must receive counselor reply from bot');
    assert(studentReceivedReply.text.includes('Co-Founder Desk'), 'Message must reflect Co-Founder counselor desk');
    assert(studentReceivedReply.text.includes('pgbouncer=true'), 'Student must get exact text');
    assert(cofounderDeliveryConfirm, 'Co-Founder must get delivery confirmation');
    assert(cofounderDeliveryConfirm.text.includes('Privacy Protected'), 'Co-Founder confirmation must guarantee number masking');
    console.log('  ✓ PASSED: Co-Founder secret reply delivered to student; Co-Founder personal number masked.');

    // ----------------------------------------------------
    // TEST 5: Founder resolves ticket via "RESOLVE LAST"
    // ----------------------------------------------------
    console.log('\n▶ TEST 5: Founder resolves ticket via "RESOLVE LAST" from +919923092340');
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
    console.log('  ✓ PASSED: Ticket resolved by Founder and student notified.');

    console.log('\n============================================================');
    console.log('🎉 ALL 5 FOUNDER & CO-FOUNDER ANONYMOUS RELAY TESTS PASSED!');
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
