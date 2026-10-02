/**
 * test_otp_flow.js
 * End-to-end verification test for OTP generation, delivery metadata,
 * backup code fallback, resend capabilities, and activation.
 */

const http = require('http');

function postJson(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('🧪 Starting OTP Flow & Delivery Verification Tests...\n');
  const testEmail = `test_otp_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  // Test 1: Register User
  console.log(`▶ TEST 1: Register user with email: ${testEmail}`);
  const regRes = await postJson('/api/auth/register', {
    name: 'Test OTP User',
    email: testEmail,
    password: testPassword,
  });

  console.log('  Status:', regRes.status);
  console.log('  Response:', JSON.stringify(regRes.body, null, 2));

  if (regRes.status !== 201 || !regRes.body.success) {
    throw new Error(`Registration failed: ${JSON.stringify(regRes.body)}`);
  }
  if (!regRes.body.requiresOtp) {
    throw new Error('Expected requiresOtp to be true');
  }
  if (!regRes.body.backupOtp || regRes.body.backupOtp.length !== 6) {
    throw new Error(`Expected valid 6-digit backupOtp, got: ${regRes.body.backupOtp}`);
  }
  console.log('  ✓ PASSED: Registration returned requiresOtp: true and 6-digit backupOtp!\n');

  // Test 2: Resend OTP
  console.log('▶ TEST 2: Resend OTP');
  const resendRes = await postJson('/api/auth/resend-otp', { email: testEmail });
  console.log('  Status:', resendRes.status);
  console.log('  Response:', JSON.stringify(resendRes.body, null, 2));

  if (resendRes.status !== 200 || !resendRes.body.success) {
    throw new Error(`Resend OTP failed: ${JSON.stringify(resendRes.body)}`);
  }
  if (!resendRes.body.backupOtp) {
    throw new Error('Expected backupOtp in resend response');
  }
  console.log('  ✓ PASSED: Resend returned fresh backupOtp successfully!\n');

  // Test 3: Verify OTP using the backup code
  console.log(`▶ TEST 3: Verify OTP using backupOtp: ${resendRes.body.backupOtp}`);
  const verifyRes = await postJson('/api/auth/verify-otp', {
    email: testEmail,
    otp: resendRes.body.backupOtp,
  });
  console.log('  Status:', verifyRes.status);
  console.log('  Response:', JSON.stringify(verifyRes.body, null, 2));

  if (verifyRes.status !== 200 || !verifyRes.body.success) {
    throw new Error(`OTP Verification failed: ${JSON.stringify(verifyRes.body)}`);
  }
  if (!verifyRes.body.data || !verifyRes.body.data.token) {
    throw new Error('Expected JWT token upon successful verification');
  }
  if (!verifyRes.body.data.user || !verifyRes.body.data.user.isVerified) {
    throw new Error('Expected user to be marked as isVerified: true');
  }
  console.log('  ✓ PASSED: User verified successfully and JWT token issued!\n');

  // Test 4: Verify existing user login
  console.log('▶ TEST 4: Login as newly verified user');
  const loginRes = await postJson('/api/auth/login', {
    email: testEmail,
    password: testPassword,
  });
  console.log('  Status:', loginRes.status);
  console.log('  Response:', JSON.stringify(loginRes.body, null, 2));

  if (loginRes.status !== 200 || !loginRes.body.success) {
    throw new Error(`Login failed for verified user: ${JSON.stringify(loginRes.body)}`);
  }
  console.log('  ✓ PASSED: Verified user logged in successfully without any OTP block!\n');

  console.log('════════════════════════════════════════════════════════════════');
  console.log('🎉 ALL OTP & VERIFICATION TESTS PASSED 100%!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
