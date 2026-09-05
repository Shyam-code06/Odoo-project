process.env.NODE_ENV = 'test';

import http from 'http';
import app from './index.js';
import { db } from './src/config/db.js';

let server;
const PORT = 5099;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Helper for making HTTP requests
function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function parseCookies(header) {
  if (!header) return {};
  const cookies = {};
  const list = Array.isArray(header) ? header : [header];
  for (const item of list) {
    const parts = item.split(';')[0].split('=');
    if (parts.length >= 2) {
      cookies[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  }
  return cookies;
}

async function runTests() {
  console.log('🧪 ================= STARTING AUTH TESTS ================= 🧪\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 0. Clean up previous test user if exists
    await db('users').where('email', 'test.agent@odoo.local').del();

    // TEST 1: Signup Validation Failure (Invalid email & short password)
    console.log('\n--- 1. Signup Validation ---');
    const res1 = await request('POST', '/auth/signup', { email: 'invalid-email', password: '123' });
    assert(res1.status === 400, 'Signup with invalid input returns HTTP 400');
    assert(res1.body?.errors?.length === 2, 'Returns validation error list for email and password');

    // TEST 2: Successful Signup
    console.log('\n--- 2. Successful Signup ---');
    const signupData = {
      email: 'test.agent@odoo.local',
      password: 'StrongPassword123!',
      role_id: 4
    };
    const res2 = await request('POST', '/auth/signup', signupData);
    assert(res2.status === 201, 'Signup returns HTTP 201 Created');
    assert(res2.body?.status === 'success', 'Response status is success');
    assert(res2.body?.data?.user?.email === 'test.agent@odoo.local', 'User email matches');
    assert(!res2.body?.data?.user?.password_hash, 'Password hash is NOT exposed in response');
    assert(Boolean(res2.body?.data?.tokens?.accessToken), 'Access token is returned');
    assert(Boolean(res2.body?.data?.tokens?.refreshToken), 'Refresh token is returned');

    const signupCookies = parseCookies(res2.headers['set-cookie']);
    assert(Boolean(signupCookies.accessToken), 'Access token cookie is set');
    assert(Boolean(signupCookies.refreshToken), 'Refresh token cookie is set');

    let accessToken = res2.body.data.tokens.accessToken;
    let refreshToken = res2.body.data.tokens.refreshToken;

    // TEST 3: Duplicate Signup Rejection
    console.log('\n--- 3. Duplicate Signup Rejection ---');
    const res3 = await request('POST', '/auth/signup', signupData);
    assert(res3.status === 409, 'Duplicate signup returns HTTP 409 Conflict');
    assert(res3.body?.code === 'EMAIL_ALREADY_EXISTS', 'Proper error code returned');

    // TEST 4: Login with Incorrect Password
    console.log('\n--- 4. Login Invalid Credentials ---');
    const res4 = await request('POST', '/auth/login', {
      email: 'test.agent@odoo.local',
      password: 'WrongPassword!'
    });
    assert(res4.status === 401, 'Wrong password returns HTTP 401 Unauthorized');

    // TEST 5: Successful Login
    console.log('\n--- 5. Successful Login ---');
    const res5 = await request('POST', '/auth/login', {
      email: 'test.agent@odoo.local',
      password: 'StrongPassword123!'
    });
    assert(res5.status === 200, 'Login returns HTTP 200 OK');
    assert(Boolean(res5.body?.data?.tokens?.accessToken), 'Access token returned on login');
    assert(Boolean(res5.body?.data?.tokens?.refreshToken), 'Refresh token returned on login');
    accessToken = res5.body.data.tokens.accessToken;
    refreshToken = res5.body.data.tokens.refreshToken;

    // TEST 6: Protected Route `GET /auth/me` with Bearer Token
    console.log('\n--- 6. Protected Route with Bearer Token ---');
    const res6 = await request('GET', '/auth/me', null, {
      Authorization: `Bearer ${accessToken}`
    });
    assert(res6.status === 200, 'GET /auth/me returns HTTP 200 OK with valid token');
    assert(res6.body?.data?.user?.email === 'test.agent@odoo.local', 'Authenticated user profile matches');

    // TEST 7: Protected Route with Cookie
    console.log('\n--- 7. Protected Route with Cookie ---');
    const res7 = await request('GET', '/auth/me', null, {
      Cookie: `accessToken=${accessToken}`
    });
    assert(res7.status === 200, 'GET /auth/me succeeds with cookie authentication');

    // TEST 8: Protected Route Unauthenticated
    console.log('\n--- 8. Protected Route Unauthenticated ---');
    const res8 = await request('GET', '/auth/me');
    assert(res8.status === 401, 'GET /auth/me without token returns HTTP 401');

    // TEST 9: Protected Route with Tampered/Invalid Token
    console.log('\n--- 9. Protected Route with Invalid Token ---');
    const res9 = await request('GET', '/auth/me', null, {
      Authorization: 'Bearer invalid.token.payload'
    });
    assert(res9.status === 401, 'GET /auth/me with fake token returns HTTP 401');

    // TEST 10: Refresh Token Rotation
    console.log('\n--- 10. Refresh Token Rotation ---');
    const res10 = await request('POST', '/auth/refresh', {
      refreshToken
    });
    assert(res10.status === 200, 'Refresh returns HTTP 200 OK');
    assert(Boolean(res10.body?.data?.tokens?.accessToken), 'New access token issued');
    assert(Boolean(res10.body?.data?.tokens?.refreshToken), 'New refresh token issued');
    const oldRefreshToken = refreshToken;
    const newAccessToken = res10.body.data.tokens.accessToken;
    const newRefreshToken = res10.body.data.tokens.refreshToken;

    // Verify new access token works
    const res10Verify = await request('GET', '/auth/me', null, {
      Authorization: `Bearer ${newAccessToken}`
    });
    assert(res10Verify.status === 200, 'New access token from refresh functions correctly');

    // TEST 11: Refresh Token Reuse Detection (Security Mitigation)
    console.log('\n--- 11. Refresh Token Reuse Detection ---');
    const res11 = await request('POST', '/auth/refresh', {
      refreshToken: oldRefreshToken
    });
    assert(res11.status === 403, 'Reusing revoked/old refresh token triggers HTTP 403 Reuse Detection');
    assert(res11.body?.code === 'TOKEN_REUSE_DETECTED', 'Code is TOKEN_REUSE_DETECTED');

    // TEST 12: Logout & Revocation
    console.log('\n--- 12. Logout ---');
    // Log in again to get fresh active tokens
    const loginAgain = await request('POST', '/auth/login', {
      email: 'test.agent@odoo.local',
      password: 'StrongPassword123!'
    });
    const activeRefreshToken = loginAgain.body.data.tokens.refreshToken;

    const res12 = await request('POST', '/auth/logout', {
      refreshToken: activeRefreshToken
    });
    assert(res12.status === 200, 'Logout returns HTTP 200 OK');

    // TEST 13: Attempt to Refresh with Logged Out Token
    console.log('\n--- 13. Refresh after Logout ---');
    const res13 = await request('POST', '/auth/refresh', {
      refreshToken: activeRefreshToken
    });
    assert(res13.status === 403 || res13.status === 401, 'Logged out token cannot be refreshed');

    console.log(`\n======================================================`);
    console.log(`📊 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error('Test run failed with error:', err);
    failed++;
  } finally {
    // Cleanup
    await db('users').where('email', 'test.agent@odoo.local').del();
    await db.destroy();
    server.close(() => {
      process.exit(failed > 0 ? 1 : 0);
    });
  }
}

// Start temporary test server
server = app.listen(PORT, async () => {
  console.log(`🧪 Test Server running on port ${PORT}`);
  await runTests();
});
