# AuthContext.jsx — "Who is logged in?" for the whole app

> Written so you can understand it again after a long break without reading the code first.

---

## 1. One-sentence summary

`AuthContext.jsx` keeps track of **who is logged in** (using Supabase) and **what role they have** (asking your own server at `/api/me`), and shares that information with **every page** of the app so no page has to figure it out by itself.

## 2. The big idea: what is a "Context"?

In React, data normally goes from parent to child through **props**. If a page 5 levels deep needs the logged-in user, passing props through all 5 levels is painful.

A **Context** is like a "shared box" at the top of the app. Any component below can open the box directly with a hook.

```
<AuthProvider>           <- puts the data in the box
   <App>
      <Header />         <- can read the box with useAuth()
      <LoginPage />      <- can read the box
      <AdminPage />      <- can read the box
```

This file has three parts:

| Part | What it is |
|---|---|
| `AuthContext` | the empty box (`createContext(null)`) |
| `AuthProvider` | a component that **fills** the box and wraps the whole app |
| `useAuth()` | a small hook other files use to **read** the box |

## 3. Where it is used (from the files you uploaded)

- `LoginPage.jsx` → `const { signIn, signUp } = useAuth()`
- `ResetPasswordPage.jsx` → `const { isLoggedIn, loading } = useAuth()`
- Admin pages / route guards (not uploaded) probably use `isAdmin`.

## 4. The three things it remembers (state)

```js
const [session, setSession]   = useState(null);
const [profile, setProfile]   = useState(null);
const [loading, setLoading]   = useState(true);
```

| State | Meaning | Comes from |
|---|---|---|
| `session` | The Supabase login session (token + basic user). `null` = nobody logged in | Supabase |
| `profile` | `{ id, email, role }` of the user. `role` is `customer` or `admin` | Your server `GET /api/me` |
| `loading` | `true` while the app is still finding out if someone is logged in | local |

Why two separate things (session and profile)? Supabase only knows *that* you are logged in and your email. It does **not** know your **role** in your store. Your own backend does, so the app asks `/api/me`.

## 5. First `useEffect`: keep the session in sync

```js
useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setSession(data.session);
    setLoading(false);
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
    setSession(newSession);
  });

  return () => subscription.unsubscribe();
}, []);
```

Step by step:

1. **`useEffect(..., [])`** — the empty `[]` means "run once, when the app starts".
2. **`getSession()`** — asks Supabase "is there a saved session (from a previous visit)?" The answer is stored in `session`, and `loading` becomes `false`. This is how you stay logged in after refreshing the page.
3. **`onAuthStateChange(...)`** — Supabase calls this function **every time** something changes: login, logout, token refresh, or opening a password-recovery link. We copy the new session into state.
4. **`return () => subscription.unsubscribe()`** — the *cleanup*. When the component disappears, we stop listening so there are no leaks.

## 6. Second `useEffect`: load the profile when the user changes

```js
const userId = session?.user?.id;
useEffect(() => {
  if (!userId) { setProfile(null); return; }
  axios.get('/api/me')
    .then((res) => setProfile(res.data))
    .catch(() => setProfile(null));
}, [userId]);
```

- `session?.user?.id` — the `?.` means "if session exists, get user, if that exists, get id; otherwise `undefined`" (no crash).
- The dependency `[userId]` means: **run again whenever the user id changes** (login → has id, logout → no id).
- No user → `profile = null`.
- User exists → call your backend `GET /api/me` (see `me.js` on the backend). It answers `{ id, email, role }`.
- If the call fails → `profile = null`.

**Important assumption:** this code does *not* send the token itself. Somewhere else in the project (e.g., an axios interceptor or `axios.defaults.headers`) the Supabase token must be attached to every request, otherwise the server answers 401. Look for that when you come back to the project.

## 7. The "value" object (what the box contains)

```js
const value = {
  session,
  profile: profile ?? null,
  loading: loading || (Boolean(userId) && profile === undefined),
  isLoggedIn: Boolean(session),
  isAdmin: profile?.role === 'admin',
  signUp:  (email, password) => supabase.auth.signUp({ email, password }),
  signIn:  (email, password) => supabase.auth.signInWithPassword({ email, password }),
  signOut: () => supabase.auth.signOut()
};
```

| Key | Type | Meaning |
|---|---|---|
| `session` | object or null | raw Supabase session |
| `profile` | object or null | `{id, email, role}` |
| `loading` | boolean | still checking? (show a spinner) |
| `isLoggedIn` | boolean | `true` if a session exists |
| `isAdmin` | boolean | `true` only if the role from your server is `admin` |
| `signUp(email, password)` | function | create account (returns a Promise `{data, error}`) |
| `signIn(email, password)` | function | log in |
| `signOut()` | function | log out |

`Boolean(x)` converts anything to `true/false`.

## 8. Rendering the provider

```js
return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
```

`children` is whatever you put inside `<AuthProvider>...</AuthProvider>` (normally the whole app, usually in `main.jsx` or `App.jsx`). Everything inside can now call `useAuth()`.

## 9. The `useAuth` hook

```js
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
```

A tiny safety check: if you forget to wrap the app in `<AuthProvider>`, you get a clear error instead of a mysterious `undefined`.

## 10. Flow diagrams in words

**App starts, user was already logged in**
1. `loading = true`, `session = null`.
2. `getSession()` returns the saved session → `session` set, `loading = false`.
3. `userId` appears → second effect calls `/api/me` → `profile` set.
4. Components re-render with `isLoggedIn = true`, `isAdmin` depending on role.

**User logs in** → `signIn()` → Supabase fires `onAuthStateChange` → `session` updates → `userId` changes → `/api/me` called → `profile` set.

**User logs out** → `signOut()` → session becomes `null` → `profile` cleared.

## 11. A subtle thing / possible bug to remember

```js
loading: loading || (Boolean(userId) && profile === undefined)
```

The second half tries to say "if there is a user but the profile hasn't arrived yet, we are still loading". But `profile` starts as `null`, never `undefined`, so that condition is **always false**. Result: right after login there is a short moment where `isLoggedIn` is `true` but `isAdmin` is still `false` (profile not loaded) and `loading` is `false`. An admin page could briefly redirect an admin away.

A simple fix: start `profile` as `undefined` (`useState(undefined)`), set `null` when logged out or on error, and keep the `loading` formula as it is.

## 12. Glossary

| Word | Meaning |
|---|---|
| Hook | a function starting with `use` that gives a component special powers (`useState`, `useEffect`, `useContext`) |
| State | data that, when changed, makes the component re-draw |
| Effect | code that runs *after* drawing, to talk to the outside world (APIs, subscriptions) |
| Provider | component that supplies a context value |
| Session | proof you are logged in (token) |
| Role | permission level (`customer` / `admin`) |

## 13. Quick checklist when debugging

- [ ] App wrapped in `<AuthProvider>`?
- [ ] Supabase client (`lib/supabase`) configured with URL and anon key?
- [ ] Token attached to axios requests so `/api/me` works?
- [ ] `/api/me` returns `role`?
