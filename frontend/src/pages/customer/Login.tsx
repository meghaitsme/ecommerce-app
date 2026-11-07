
import { useState } from 'react';
import type { FormEvent } from 'react';

import { useNavigate, Link } from 'react-router-dom';

import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../data/firebase';

import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function Login() {

  const navigate = useNavigate();

  const { showToast } = useToast();

  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  // =====================================
  // HANDLE LOGIN
  // =====================================

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {

    e.preventDefault();

    setLoading(true);

    try {

      await login(email.trim(), password);

      showToast('Logged in successfully!', 'success');

      navigate('/');

    } catch (err: unknown) {

      console.error('Login error:', err);

      const message =
        err instanceof Error
          ? err.message
          : 'Failed to login';

      showToast(message, 'error');

    } finally {

      setLoading(false);

    }
  };

  // =====================================
  // HANDLE PASSWORD RESET
  // =====================================

  const handleResetPassword = async (
    e: FormEvent<HTMLFormElement>
  ) => {

    e.preventDefault();

    if (!email.trim()) {

      showToast(
        'Please enter your email address first.',
        'error'
      );

      return;
    }

    setLoading(true);

    try {

      await sendPasswordResetEmail(
        auth,
        email.trim()
      );

      showToast(
        'Password reset email sent! Check your inbox.',
        'success'
      );

      setResetMode(false);

    } catch (err: unknown) {

      console.error('Password reset error:', err);

      const message =
        err instanceof Error
          ? err.message
          : 'Failed to send reset email';

      showToast(message, 'error');

    } finally {

      setLoading(false);

    }
  };

  return (

    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      padding: '20px'
    }}>

      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px',
        fontFamily: 'sans-serif'
      }}>

        <h2 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          textAlign: 'center',
          margin: '0 0 24px 0'
        }}>
          {resetMode ? 'Reset Password' : 'Login'}
        </h2>

        {/* PASSWORD RESET FORM */}

        {resetMode ? (

          <form
            onSubmit={handleResetPassword}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >

            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              textAlign: 'center'
            }}>
              Enter your email and we'll send you a link
              to reset your password.
            </p>

            <div>

              <label>Email Address</label>

              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '6px'
                }}
              />

            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px',
                backgroundColor: loading ? '#9ca3af' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              onClick={() => setResetMode(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer'
              }}
            >
              Back to Login
            </button>

          </form>

        ) : (

          /* LOGIN FORM */

          <form
            onSubmit={handleLogin}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >

            <div>

              <label>Email Address</label>

              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '6px'
                }}
              />

            </div>

            <div>

              <label>Password</label>

              <input
                required
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '6px'
                }}
              />

            </div>

            <div style={{ textAlign: 'right' }}>

              <button
                type="button"
                onClick={() => setResetMode(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Forgot Password?
              </button>

            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px',
                backgroundColor: loading ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <p style={{
              textAlign: 'center',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Don't have an account?{' '}

              <Link
                to="/register"
                style={{
                  color: '#2563eb',
                  fontWeight: 'bold',
                  textDecoration: 'none'
                }}
              >
                Register
              </Link>

            </p>

          </form>

        )}

      </div>

    </div>
  );
}
