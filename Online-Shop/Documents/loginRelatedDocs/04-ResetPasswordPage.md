# ResetPasswordPage.jsx — Choose a new password

---

## 1. One-sentence summary

The page the user lands on **after clicking the link in the reset email**. It lets them type a new password twice and saves it with Supabase.

## 2. How the user arrives here

```
ForgotPasswordPage -> Supabase sends email -> user clicks link
-> Supabase verifies the link and creates a TEMPORARY "recovery" session
-> browser opens  /reset-password  (this page)
```

You are only supposed to reach this page through that link. If someone just types `/reset-password` in the address bar, there is no session and they get "Link not valid".

## 3. The key line: `useAuth()`

```js
const { isLoggedIn, loading } = useAuth();
```

This is the page's security check and the part that is easiest to forget later.

- Clicking the email link logs the user in with a temporary recovery session.
- So **`isLoggedIn === true` means the link was valid**. `false` means it was already used, expired or invalid (or the user typed the URL manually).
- **`loading`** exists because Supabase needs a moment to read the link and create the session. During that moment `isLoggedIn` is `false`. Without `loading` the page would flash "Link not valid" for a second even for good links.

## 4. State

```js
const [password, setPassword] = useState("");
const [confirm, setConfirm] = useState("");
const [error, setError] = useState("");
const [submitting, setSubmitting] = useState(false);
const [done, setDone] = useState(false);
```

| State | Purpose |
|---|---|
| `password` | first box (new password) |
| `confirm` | second box (repeat) |
| `error` | message to show |
| `submitting` | disables the button while saving |
| `done` | `true` when the password was changed, to show the success screen |

`useNavigate()` gives `navigate`, used to go to the home page after success.

## 5. `handleSubmit`

```js
async function handleSubmit(event) {
  event.preventDefault();
  setError("");

  if (password !== confirm) {
    setError("The passwords do not match.");
    return;
  }

  setSubmitting(true);
  const { error: updateError } = await supabase.auth.updateUser({ password });
  setSubmitting(false);

  if (updateError) { setError(updateError.message); return; }

  setDone(true);
  setTimeout(() => navigate("/"), 1500);
}
```

1. Stop the browser's default reload.
2. **Local check first:** both boxes must match. No server call if they don't.
3. `supabase.auth.updateUser({ password })` changes the password of **whoever is currently logged in** (here: the temporary recovery session).
4. If Supabase refuses (for example password too weak or the same as the old one), show its message.
5. On success set `done = true` and, after 1.5 seconds (`setTimeout(..., 1500)`), go to `/`.

## 6. The four screens (checked in this order)

The component decides what to draw with several early `return`s:

| Order | Condition | Screen |
|---|---|---|
| 1 | `loading` | "Checking your link..." |
| 2 | `!isLoggedIn` | "Link not valid. This link is invalid or has expired." + link "Send me a new link" → `/forgot-password` |
| 3 | `done` | "Password updated. Taking you to the store..." |
| 4 | otherwise | The form: "Choose a new password" |

The order matters: first wait for the check, then reject invalid links, then success, then show the form.

## 7. The form

- **New password** and **Repeat the password** inputs: `type="password"`, `autoComplete="new-password"` (tells password managers to offer a new password), `minLength={6}`, `required`.
- Error text with `role="alert"`.
- Button text: `submitting ? "Please wait..." : "Save new password"`.

## 8. Connections with other files

| File | Relation |
|---|---|
| `ForgotPasswordPage.jsx` | sets `redirectTo` to this page |
| `AuthContext.jsx` | provides `isLoggedIn` and `loading` (via `onAuthStateChange`, which fires when the recovery link creates a session) |
| `lib/supabase` | the Supabase client |
| `LoginPage.css` | shared styles |

## 9. Things to remember

- After changing the password the user remains logged in (the recovery session becomes a normal session), so redirecting to `/` is fine.
- The page doesn't verify password strength beyond length 6; Supabase has its own rules (configurable in the dashboard).
- Old sessions on other devices may stay valid depending on Supabase settings.
- `setTimeout` is not cleaned up; if the user leaves in those 1.5 s nothing bad happens, but a stricter version would clear it.
- The `loading` from AuthContext only covers the *initial* session check; the profile (`/api/me`) is not needed here.

## 10. Test checklist

- [ ] Opening `/reset-password` directly → "Link not valid"
- [ ] Using the email link → form appears (after a brief "Checking your link...")
- [ ] Mismatched passwords → error, no request
- [ ] Matching passwords → success screen, redirected to `/`
- [ ] Clicking the same email link a second time → "Link not valid"
