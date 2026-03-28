import { useState, FormEvent } from 'react';
import api from '../api/axios';

interface FieldErrors {
  name?: string;
  email?: string;
  message?: string;
}

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!name.trim()) errors.name = 'Name is required.';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'A valid email address is required.';
    }
    if (!message.trim()) errors.message = 'Message is required.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/api/contact', { name, email, message });
      setSuccess(true);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { errors?: FieldErrors } } })?.response?.data;
      if (data?.errors) {
        setFieldErrors(data.errors);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: 600 }}>
      <h1 style={{ marginBottom: 4 }}>Contact Us</h1>
      <p style={{ color: 'var(--gray-600)', marginTop: 0, marginBottom: 24 }}>
        Have a question or feedback? We'd love to hear from you.
      </p>

      {/* Telegram link */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: 'var(--green-pale)',
          border: '1px solid #86efac',
        }}
      >
        <span style={{ fontSize: 28 }}>💬</span>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>Join our community</div>
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

      {success ? (
        <div className="alert alert-success" style={{ fontSize: 15 }}>
          Your message has been sent. We will get back to you soon.
        </div>
      ) : (
        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit} noValidate>
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

            <div className="form-group">
              <label htmlFor="contact-message">Message</label>
              <textarea
                id="contact-message"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                style={{ resize: 'vertical' }}
              />
              {fieldErrors.message && <span className="form-error">{fieldErrors.message}</span>}
            </div>

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
