const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;

if (!FAST2SMS_API_KEY) {
  console.warn('FAST2SMS_API_KEY is not set. SMS OTPs will not be sent.');
}

export async function sendSmsOtp(phone: string, otp: string, purpose: string) {
  if (!FAST2SMS_API_KEY) {
    console.warn('Skipping SMS send because FAST2SMS_API_KEY is missing');
    return { success: false, skipped: true, error: 'SMS service configuration (FAST2SMS_API_KEY) is missing.' };
  }

  const message = `Your AgriLink OTP for ${purpose} is ${otp}. It is valid for 10 minutes.`;

  try {
    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'v3',
        sender_id: 'TXTIND',
        message,
        language: 'english',
        numbers: phone,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Fast2SMS error status', res.status, errText);
      return { success: false, error: `Fast2SMS Gateway Error (${res.status}): ${errText}` };
    }
    return { success: true };
  } catch (err) {
    console.error('Fast2SMS request failed', err);
    return { success: false, error: err instanceof Error ? err.message : 'Network error sending SMS.' };
  }
}
