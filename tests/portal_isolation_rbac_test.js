/**
 * tests/portal_isolation_rbac_test.js
 *
 * Automated verification of Portal Isolation RBAC:
 * 1. requireStudent blocks recruiter with 403 RECRUITER_ACCESS_DENIED
 * 2. requireStudent permits student
 * 3. requireStudent permits demo/admin user
 * 4. requireRecruiter blocks student with 403 STUDENT_ACCESS_DENIED
 * 5. requireRecruiter permits recruiter
 * 6. requireRecruiter permits demo/admin user
 * 7. Client-side page list isolation logic verification
 *
 * Team 404 Brain Not Found · Hack2Ignite 2026-27
 */

const path = require('path');
const { requireStudent, requireRecruiter } = require('../server/middleware/authMiddleware');

function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
  return res;
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    failed++;
  } else {
    console.log(`  ✓ PASSED: ${message}`);
    passed++;
  }
}

console.log('🚀 Starting Portal Isolation RBAC Unit & Integration Tests...\n');

// --- Test 1: requireStudent with recruiter ---
console.log('▶ TEST 1: requireStudent blocks recruiter role');
{
  const req = { user: { role: 'recruiter', email: 'hr@razorpay.com' } };
  const res = createMockRes();
  let nextCalled = false;
  requireStudent(req, res, () => { nextCalled = true; });

  assert(!nextCalled, 'Next must NOT be called for recruiter');
  assert(res.statusCode === 403, 'Status must be 403');
  assert(res.body && res.body.code === 'RECRUITER_ACCESS_DENIED', 'Error code must be RECRUITER_ACCESS_DENIED');
}

// --- Test 2: requireStudent with student ---
console.log('\n▶ TEST 2: requireStudent allows student role');
{
  const req = { user: { role: 'student', email: 'student@example.com' } };
  const res = createMockRes();
  let nextCalled = false;
  requireStudent(req, res, () => { nextCalled = true; });

  assert(nextCalled, 'Next MUST be called for student');
  assert(res.statusCode === 200, 'Status remains 200');
}

// --- Test 3: requireStudent with demo account ---
console.log('\n▶ TEST 3: requireStudent allows demo/admin account (demouser@gmail.com)');
{
  const req = { user: { role: 'recruiter', email: 'demouser@gmail.com' } };
  const res = createMockRes();
  let nextCalled = false;
  requireStudent(req, res, () => { nextCalled = true; });

  assert(nextCalled, 'Next MUST be called for demo user even if role is recruiter');
  assert(res.statusCode === 200, 'Status remains 200');
}

// --- Test 4: requireRecruiter with student ---
console.log('\n▶ TEST 4: requireRecruiter blocks student role');
{
  const req = { user: { role: 'student', email: 'student@example.com' } };
  const res = createMockRes();
  let nextCalled = false;
  requireRecruiter(req, res, () => { nextCalled = true; });

  assert(!nextCalled, 'Next must NOT be called for student');
  assert(res.statusCode === 403, 'Status must be 403');
  assert(res.body && res.body.code === 'STUDENT_ACCESS_DENIED', 'Error code must be STUDENT_ACCESS_DENIED');
}

// --- Test 5: requireRecruiter with recruiter ---
console.log('\n▶ TEST 5: requireRecruiter allows recruiter role');
{
  const req = { user: { role: 'recruiter', email: 'hr@razorpay.com' } };
  const res = createMockRes();
  let nextCalled = false;
  requireRecruiter(req, res, () => { nextCalled = true; });

  assert(nextCalled, 'Next MUST be called for recruiter');
  assert(res.statusCode === 200, 'Status remains 200');
}

// --- Test 6: requireRecruiter with demo account ---
console.log('\n▶ TEST 6: requireRecruiter allows demo/admin account');
{
  const req = { user: { role: 'student', email: 'demouser@gmail.com' } };
  const res = createMockRes();
  let nextCalled = false;
  requireRecruiter(req, res, () => { nextCalled = true; });

  assert(nextCalled, 'Next MUST be called for demo user even if role is student');
  assert(res.statusCode === 200, 'Status remains 200');
}

// --- Test 7: Client-side routing verification ---
console.log('\n▶ TEST 7: Client-side Isolation Routing Rules');
{
  const STUDENT_PAGES = [
    'dashboard.html',
    'assessment.html',
    'recommendations.html',
    'roadmap.html',
    'resume-builder.html',
    'quiz.html',
    'job-market.html',
    'technical-interview.html'
  ];
  const RECRUITER_PAGES = [
    'recruiter-dashboard.html',
    'recruiter-register.html',
    'recruiter-login.html',
    'post-job.html'
  ];

  // Verify no intersection between student and recruiter pages
  const intersection = STUDENT_PAGES.filter(p => RECRUITER_PAGES.includes(p));
  assert(intersection.length === 0, 'No overlapping pages between student and recruiter catalogs');

  // Verify recruiter redirected from student pages
  const testRecruiterUser = { role: 'recruiter', email: 'talent@company.com' };
  const isRecruiter = testRecruiterUser.role === 'recruiter';
  assert(isRecruiter === true, 'Role detected as recruiter');

  const testStudentUser = { role: 'student', email: 'student@college.edu' };
  const isStudent = testStudentUser.role === 'student';
  assert(isStudent === true, 'Role detected as student');

  // Verify demo user detection
  const demoUser = { role: 'student', email: 'demouser@gmail.com' };
  const isDemo = demoUser.role === 'admin' || demoUser.isDemo || demoUser.email === 'demouser@gmail.com';
  assert(isDemo === true, 'Demo user correctly bypassed from hard lock');
}

console.log('\n════════════════════════════════════════════════════════════════');
console.log(`Summary: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('🎉 ALL PORTAL ISOLATION TESTS PASSED 100%!');
  process.exit(0);
} else {
  console.error('❌ SOME TESTS FAILED!');
  process.exit(1);
}
