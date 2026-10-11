# ForgotPasswordPage.jsx — "Send me a reset link"

---

## 1. One-sentence summary

The user types their email, the page asks Supabase to email them a reset link, and then shows a "Check your email" screen.

## 2. Position in the password-reset flow

```
LoginPage  --"Forgot your password?"-->  ForgotPasswordPage (this file)
      user types email -> Supabase sends an email
      user clicks the link in the email
                         -->  ResetPasswordPage  (/reset-password)
                         user types a new password -> done -> home page
```

## 3. State (what it remembers)

```js
const [email, setEmail] = useState('');
const [error, setError] = useState('');
const [sent, setSent] = useState(false);
const [submitting, setSubmitting] = useState(false);
```

| State | Meaning |
|---|---|
| `email` | what is typed in the box |
| `error` | message if Supabase fails |
| `sent` | `false` until the email request succeeds; then `true` to change the screen |
| `submitting` | `true` while waiting; disables the button so it can't be clicked twice |

## 4. `handleSubmit`

```js
async function handleSubmit(event) {
  event.preventDefault();
  setError('');
  setSubmitting(true);

  const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });

  setSubmitting(false);
  if (resetError) { setError(resetError.message); return; }
  setSent(true);
}
```

1. `preventDefault()` stops the browser from reloading the page on form submit.
2. Clear old error, mark as submitting.
3. **The only real call:** `supabase.auth.resetPasswordForEmail(email, options)`. Supabase sends an email containing a special link.
4. `redirectTo` = where the link will lead. `window.location.origin` is your own site address (e.g. `http://localhost:5173` in development or `https://lyx.dev` in production), so the same code works in both. The final address is `/reset-password`.
5. If Supabase returns an error, show it. Otherwise `sent = true`.

**Supabase setup reminder:** the `redirectTo` URL must be listed in Supabase → Authentication → URL Configuration → *Redirect URLs*, otherwise the link won't redirect correctly.

## 5. Two screens in one component

The component returns different JSX depending on `sent`:

### Screen A — `sent === true`

```jsx
<h1>Check your email</h1>
<p>If an account exists for that email, we sent a link to reset the password.</p>
<Link to="/login">Back to log in</Link>
```

The wording "**If** an account exists" is intentional: it never confirms whether an email is registered. That prevents attackers from discovering who has an account (user enumeration). Supabase also behaves this way.

### Screen B — the form (default)

```jsx
<h1>Forgot your password?</h1>
<label htmlFor="email">Email</label>
<input id="email" type="email" value={email} onChange={...} autoComplete="email" required />
{error && <p className="login-error" role="alert">{error}</p>}
<button type="submit" disabled={submitting}>
  {submitting ? 'Please wait...' : 'Send reset link'}
</button>
<Link to="/login">Back to log in</Link>
```

- `htmlFor="email"` connects the label to the input (click the label → focus the input; better accessibility).
- Early `if (sent) { return (...) }` before the main `return` is a common pattern to show an alternative screen.

## 6. Styles

`import './LoginPage.css'` — reuses the login styles (`login-page`, `login-form`, `login-error`, `login-message`, `login-submit`, `login-switch`). Changing those classes affects all three auth pages.

## 7. Things to remember

- This page does **not** use `useAuth`; it talks to Supabase directly.
- It doesn't check if the email is valid beyond the browser's `type="email"` check.
- Supabase may rate-limit reset emails; the error message is shown as is.
- The email template can be customized in Supabase → Authentication → Email Templates.

## 8. Test checklist

- [ ] Submitting shows "Please wait..." and disables the button
- [ ] Success shows the "Check your email" screen
- [ ] The email arrives and the link opens `/reset-password`
- [ ] A network error shows a message and lets you retry
