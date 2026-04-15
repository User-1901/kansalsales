import { useState, FormEvent } from 'react';
import api from '../api/axios';

// ── CONTACT FORM ERRORS ─────────────────────────────────────────────────────
// Stores validation errors for individual form fields
interface FieldErrors {
  name?: string;     // Name validation error
  email?: string;    // Email validation error
  message?: string;  // Message validation error
}

// ── CONTACT PAGE COMPONENT ─────────────────────────────────────────────────
// Contact form for users to send messages and feedback
// Validates input locally before sending to server
// Shows success message after submission
// Also displays link to join Telegram community

export default function ContactPage() {
  // ── FORM INPUT STATE ────────────────────────────────────────────────────
  const [name, setName] = useState('');           // User's name
  const [email, setEmail] = useState('');         // User's email
  const [message, setMessage] = useState('');     // Contact message

  // ── ERROR & SUBMISSION STATE ────────────────────────────────────────────
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({}); // Per-field validation errors
  const [success, setSuccess] = useState(false);   // Message sent successfully
  const [loading, setLoading] = useState(false);   // Sending message to server

  // ── FORM VALIDATION ──────────────────────────────────────────────────────
  // Check that all fields are valid before submission
  // Validation rules:
  // - Name: cannot be empty
  // - Email: must be valid format
  // - Message: cannot be empty
  function validate(): boolean {
    const errors: FieldErrors = {};

    // Check name is not empty
    if (!name.trim()) errors.name = 'Name is required.';

    // Check email format with regex
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'A valid email address is required.';
    }

    // Check message is not empty
    if (!message.trim()) errors.message = 'Message is required.';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // ── FORM SUBMISSION HANDLER ──────────────────────────────────────────────
  // Called when user clicks "Send Message" button
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();  // Prevent page reload

    // Validate all fields first
    if (!validate()) return;

    // ── SEND CONTACT MESSAGE VIA API ─────────────────────────────────────
    setLoading(true);
    try {
      // POST /api/contact with { name, email, message }
      // Server will receive the contact message and store it
      await api.post('/api/contact', { name, email, message });
      
      // Message sent successfully
      setSuccess(true);
    } catch (err: unknown) {
      // Handle errors from backend
      const data = (err as { response?: { data?: { errors?: FieldErrors } } })?.response?.data;
      if (data?.errors) {
        setFieldErrors(data.errors);
      }
    } finally {
      setLoading(false);
    }
  }

  // ── RENDER PAGE ──────────────────────────────────────────────────────────
  return (
    <div className="page-container" style={{ maxWidth: 600 }}>
      <h1 style={{ marginBottom: 4 }}>Contact Us</h1>
      <p style={{ color: 'var(--gray-600)', marginTop: 0, marginBottom: 24 }}>
        Have a question or feedback? We'd love to hear from you.
      </p>

      {/* Community link card */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: 'var(--green-pale)',  // Light green background
          border: '1px solid #86efac',
        }}
      >
        <span style={{ fontSize: 28 }}>💬</span>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>Join our community</div>
          {/* Link to Telegram community */}
          <a
            href="https://t.me/+CTrROqUmKkM4MTJl"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--green-dark)', fontWeight: 500 }}
          >
            Join our Telegram community
          </a>
        </div>
      </div>

      {/* Show success message if form submitted */}
      {success ? (
        <div className="alert alert-success" style={{ fontSize: 15 }}>
          Your message has been sent. We will get back to you soon.
        </div>
      ) : (
        // Contact form
        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit} noValidate>
            
            {/* Name input */}
            <div className="form-group">
              <label htmlFor="contact-name">Your name</label>
              <input
                id="contact-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              {fieldErrors.name && <span className="form-error">{fieldErrors.name}</span>}
            </div>

            {/* Email input */}
            <div className="form-group">
              <label htmlFor="contact-email">Email address</label>
              <input
                id="contact-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {fieldErrors.email && <span className="form-error">{fieldErrors.email}</span>}
            </div>

            {/* Message textarea */}
            <div className="form-group">
              <label htmlFor="contact-message">Message</label>
              <textarea
                id="contact-message"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                style={{ resize: 'vertical' }}  // User can resize height
              />
              {fieldErrors.message && <span className="form-error">{fieldErrors.message}</span>}
            </div>

            {/* Submit button — disabled while sending */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px', fontSize: 15 }}
              disabled={loading}
            >
              {loading ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
