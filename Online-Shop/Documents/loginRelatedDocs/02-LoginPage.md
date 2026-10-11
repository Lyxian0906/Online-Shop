# LoginPage.jsx — Log in / Create account (one page, two modes)

---

## 1. One-sentence summary

A single form that works as **Log in** or **Create account** depending on a `mode` variable, and sends the user to the home page when it succeeds.

## 2. What the user sees

```
Log in                      (or "Create account")
Email     [__________]
Password  [__________]
(error or message text)
Forgot your password?        (only in login mode)
[ Log in ]
No account yet? Create one   (button that switches mode)
```

## 3. Imports explained

| Import | Why |
|---|---|
| `useState` | to remember typed values and messages |
| `useNavigate`, `Link` from `react-router` | `navigate("/")` changes page from code; `Link` is a clickable link that doesn't reload the page |
| `useAuth` | gets `signIn` and `signUp` from `AuthContext.jsx` |
| `./LoginPage.css` | styles (also reused by the Forgot and Reset pages) |

## 4. State (what the page remembers)

```js
const [mode, setMode] = useState("login");     // 'login' | 'register'
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [message, setMessage] = useState("");
const [submitting, setSubmitting] = useState(false);
const isLogin = mode === "login";
```

| State | Purpose |
|---|---|
| `mode` | decides the title, button texts and which function to call |
| `email`, `password` | what is typed in the boxes (a "controlled input") |
| `error` | red message when something fails |
| `message` | green/info message (e.g. "check your email") |
| `submitting` | `true` while waiting for Supabase; disables the button to avoid double clicks |
| `isLogin` | a convenience boolean computed from `mode` |

### Controlled inputs

```jsx
<input value={email} onChange={(e) => setEmail(e.target.value)} />
```

React owns the value: every keystroke updates `email`, and the input displays `email`. This makes it easy to read and validate the data at any time.

## 5. `handleSubmit` — the heart of the page

```js
async function handleSubmit(event) {
  event.preventDefault();
  setError(""); setMessage(""); setSubmitting(true);

  const { data, error: authError } = isLogin
    ? await signIn(email, password)
    : await signUp(email, password);

  setSubmitting(false);

  if (authError) { setError(authError.message); return; }

  if (!isLogin && !data.session) {
    setMessage("Account created. Check your email and click the link to confirm it, then log in.");
    setMode("login");
    return;
  }

  navigate("/");
}
```

Step by step:

1. `event.preventDefault()` — a form normally reloads the page when submitted. This stops that.
2. Clear old messages; set `submitting` to true.
3. Call **`signIn`** if in login mode, **`signUp`** otherwise. Both come from the Auth context and return `{ data, error }` (Supabase style; they don't throw).
4. `error: authError` renames the variable because `error` is already used for the state.
5. If Supabase returned an error (wrong password, user exists...), show `authError.message` and stop.
6. **Special case:** if the project has "Confirm email" enabled in Supabase, a new account has **no session** yet (`data.session` is `null`). We tell the user to check their email and switch back to login mode.
7. Otherwise: logged in → `navigate("/")` goes to the home page.

## 6. `switchMode`

```js
function switchMode() {
  setMode(isLogin ? "register" : "login");
  setError(""); setMessage("");
}
```

Toggles the page between the two modes and clears old messages.

## 7. The JSX (what is drawn)

- `<h1>{isLogin ? "Log in" : "Create account"}</h1>` — conditional text with the ternary operator `condition ? a : b`.
- Email input: `type="email"` (browser validates the format), `autoComplete="email"`, `required`.
- Password input: `minLength={6}` (Supabase's default minimum), and `autoComplete` is `current-password` in login or `new-password` when registering so password managers behave correctly.
- `{error && <p ...>}` — the `&&` trick: draw the paragraph only if `error` is non-empty.
- `role="alert"` — screen readers announce the error immediately.
- `{isLogin && <Link to="/forgot-password">}` — the "forgot password" link only in login mode.
- Submit button text: three cases (`submitting`, `isLogin`, else).
- The last button has `type="button"` so it does **not** submit the form; it only calls `switchMode`.

## 8. How it connects with the rest

```
LoginPage --signIn/signUp--> AuthContext --> Supabase
Supabase fires onAuthStateChange --> AuthContext updates session --> /api/me loads role
LoginPage --> navigate("/")
LoginPage --link--> /forgot-password (ForgotPasswordPage)
```

## 9. Things to remember

- The page never stores the password anywhere; it only sends it to Supabase.
- There is no check that `isLoggedIn` is already true. A logged-in user can still open `/login`. You could redirect them to `/`.
- Error messages come straight from Supabase in English (e.g. "Invalid login credentials").
- Role handling is not here; it is in `AuthContext`.

## 10. Rebuild notes (other stack)

If you rebuild with Firebase / Auth0 / your own API, keep the same structure: one form, a `mode`, an async submit that calls an auth function, error/message states, and a redirect on success. Only the two calls (`signIn`, `signUp`) change.

## 11. Test checklist

- [ ] Wrong password shows an error
- [ ] Register with confirm-email ON shows the "check your email" message and switches to login
- [ ] Register with confirm-email OFF logs in and goes to `/`
- [ ] The button is disabled while waiting
- [ ] "Forgot your password?" appears only in login mode
