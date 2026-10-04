import { useState } from 'react';
import { Link } from 'react-router';
import { supabase } from '../../../lib/supabase';
import './LoginPage.css'; // reuses the login page styles

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    // Supabase emails a link. When clicked, it brings the user to /reset-password
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    setSubmitting(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="login-page">
        <div className="login-form">
          <h1>Check your email</h1>
          <p className="login-message">
            If an account exists for that email, we sent a link to reset the password.
          </p>
          <Link className="login-switch" to="/login">Back to log in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Forgot your password?</h1>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        {error && <p className="login-error" role="alert">{error}</p>}

        <button type="submit" className="login-submit" disabled={submitting}>
          {submitting ? 'Please wait...' : 'Send reset link'}
        </button>

        <Link className="login-switch" to="/login">Back to log in</Link>
      </form>
    </div>
  );
}

/*
This page basically says to SupaBase to send a reset link to the mail we had
There's a few useStates that half this page to rememeber a few things like for example:

    Line 7-10   
    First one is emaail, this basically saves what u typed in the box
    Second, error, message if something fails
    Third, sent: false, this basically is false until the message is send then it becomes true
    Fourth, submitting: true, while we wait, the submit button is disabled so u can't click it twice


    In the line 12 we have something called HandledSubmit
    the event.preventDefault(), this basically stops the website from reloading (which is usually what forms do)
    then we clear the old error messages and we set the submittion to true
    And finally we make one call:

        supabase.auth.resetPasswordForEmail(email, {
     redirectTo: `${window.location.origin}/reset-password`
   });


   The Window.location... bla bla is our site adress, so the link in the email brings the user to reset-password

   If an error comes, it shows, But if all goes well then sent becomes true


*/