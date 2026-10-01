import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../context/AuthContext';
import './LoginPage.css';

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isLogin = mode === 'login';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    const { data, error: authError } = isLogin
      ? await signIn(email, password)
      : await signUp(email, password);

    setSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    // If "Confirm email" is on in Supabase, registering doesn't log you in yet.
    if (!isLogin && !data.session) {
      setMessage('Account created. Check your email and click the link to confirm it, then log in.');
      setMode('login');
      return;
    }

    navigate('/');
  }

  function switchMode() {
    setMode(isLogin ? 'register' : 'login');
    setError('');
    setMessage('');
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>{isLogin ? 'Log in' : 'Create account'}</h1>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          minLength={6}
          required
        />

        {error && <p className="login-error" role="alert">{error}</p>}
        {message && <p className="login-message">{message}</p>}

        <button type="submit" className="login-submit" disabled={submitting}>
          {submitting ? 'Please wait...' : isLogin ? 'Log in' : 'Create account'}
        </button>

        <button type="button" className="login-switch" onClick={switchMode}>
          {isLogin ? 'No account yet? Create one' : 'Already have an account? Log in'}
        </button>
      </form>
    </div>
  );
}
