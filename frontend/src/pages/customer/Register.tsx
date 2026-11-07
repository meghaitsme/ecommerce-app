
import { useState } from 'react';
import type { FormEvent } from 'react';

import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const Register = () => {

  const navigate = useNavigate();

  const { register } = useAuth();

  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);

  // =====================================
  // HANDLE REGISTRATION
  // =====================================

  const handleRegister = async (
    e: FormEvent<HTMLFormElement>
  ) => {

    e.preventDefault();

    if (password !== confirmPassword) {

      showToast(
        'Passwords do not match!',
        'error'
      );

      return;
    }

    if (password.length < 6) {

      showToast(
        'Password must contain at least 6 characters.',
        'error'
      );

      return;
    }

    setLoading(true);

    try {

      await register(
        name.trim(),
        email.trim(),
        password
      );

      showToast(
        'Registration successful!',
        'success'
      );

      navigate('/');

    } catch (error: unknown) {

      console.error('Registration error:', error);

      const message =
        error instanceof Error
          ? error.message
          : 'Registration failed';

      showToast(message, 'error');

    } finally {

      setLoading(false);

    }
  };

  return (

    <div style={{
      padding: '20px',
      maxWidth: '400px',
      margin: '40px auto',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
    }}>

      <h2 style={{
        textAlign: 'center',
        marginBottom: '25px'
      }}>
        Register for ShopFree
      </h2>

      <form
        onSubmit={handleRegister}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}
      >

        {/* NAME */}

        <div>

          <label>Full Name</label>

          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="Enter your name"
            style={{
              width: '100%',
              padding: '10px',
              marginTop: '5px',
              boxSizing: 'border-box'
            }}
          />

        </div>

        {/* EMAIL */}

        <div>

          <label>Email Address</label>

          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
            style={{
              width: '100%',
              padding: '10px',
              marginTop: '5px',
              boxSizing: 'border-box'
            }}
          />

        </div>

        {/* PASSWORD */}

        <div>

          <label>Password</label>

          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            minLength={6}
            required
            placeholder="Minimum 6 characters"
            style={{
              width: '100%',
              padding: '10px',
              marginTop: '5px',
              boxSizing: 'border-box'
            }}
          />

        </div>

        {/* CONFIRM PASSWORD */}

        <div>

          <label>Confirm Password</label>

          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            minLength={6}
            required
            placeholder="Confirm your password"
            style={{
              width: '100%',
              padding: '10px',
              marginTop: '5px',
              boxSizing: 'border-box'
            }}
          />

        </div>

        {/* SUBMIT */}

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
          {loading ? 'Registering...' : 'Create Account'}
        </button>

        <p style={{
          textAlign: 'center',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          Already have an account?{' '}

          <Link
            to="/login"
            style={{
              color: '#2563eb',
              fontWeight: 'bold',
              textDecoration: 'none'
            }}
          >
            Login
          </Link>

        </p>

      </form>

    </div>
  );
};

export default Register;
