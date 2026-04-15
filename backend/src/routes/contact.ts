import { Router } from 'express';
import { sendContactEmail } from '../services/email.js';

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST / — submit contact form
router.post('/', async (req, res) => {
  const { name, email, message } = req.body as {
    name?: unknown;
    email?: unknown;
    message?: unknown;
  };

  const errors: Record<string, string> = {};

  if (!name || String(name).trim() === '') {
    errors.name = 'Name is required.';
  }

  const emailStr = String(email ?? '').trim();
  if (!email || emailStr === '' || !EMAIL_REGEX.test(emailStr)) {
    errors.email = 'A valid email address is required.';
  }

  if (!message || String(message).trim() === '') {
    errors.message = 'Message is required.';
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ errors });
    return;
  }

  try {
    await sendContactEmail(String(name).trim(), emailStr, String(message).trim());
  } catch (err) {
    console.error('Failed to send contact email:', err);
  }

  res.json({ message: 'Your message has been sent. We will get back to you soon.' });
});

export default router;
