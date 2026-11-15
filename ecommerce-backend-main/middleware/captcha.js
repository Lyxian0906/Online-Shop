// Checks the Cloudflare Turnstile token sent by the frontend.
//
// Put this file in:  ecommerce-backend-main/middleware/captcha.js
// Use it on a route:  router.post('/register', verifyCaptcha, registerHandler)
//
// The frontend must send the token in the request body as "captchaToken".

export async function verifyCaptcha(req, res, next) {
  const token = req.body?.captchaToken;

  if (!token) {
    return res.status(400).json({ error: 'Please complete the captcha' });
  }

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: req.ip,
        }),
      }
    );

    const data = await response.json();

    if (!data.success) {
      return res.status(400).json({ error: 'Captcha failed, please try again' });
    }

    next();
  } catch (err) {
    // If Cloudflare can't be reached we block the request instead of letting it through
    console.error('Captcha check failed:', err.message);
    return res.status(503).json({ error: 'Could not check the captcha, try again later' });
  }
}