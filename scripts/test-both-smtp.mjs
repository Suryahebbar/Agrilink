import nodemailer from 'nodemailer';

async function testCredentials(user, pass, label) {
  console.log(`\n--- Testing ${label}: ${user} ---`);
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: user.trim(),
      pass: pass.trim(),
    },
  });

  try {
    await transporter.verify();
    console.log(`✅ SUCCESS! ${label} (${user}) connects perfectly!`);
  } catch (err) {
    console.log(`❌ FAILED for ${label} (${user}):`, err.message);
  }
}

async function run() {
  // Test 1: suryasrinathys@gmail.com
  await testCredentials('suryasrinathys@gmail.com', 'nhhjoiy568gbhnki', 'Top SMTP block');

  // Test 2: suryahebbar21@gmail.com (clean app password spaces)
  const pass2 = 'najg iutw uoyp zwbg'.split('#')[0].replace(/\s+/g, '');
  await testCredentials('suryahebbar21@gmail.com', pass2, 'Bottom SMTP block');
}

run();
