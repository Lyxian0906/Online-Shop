# Setup Guide: Running the Project on a New Computer

How to go from a computer with **nothing installed** to the React app and the backend server running.

The project has **two parts** that must run at the same time, each in its own terminal:

| Part | What it is | Address |
|------|-----------|---------|
| **Backend** | Server that provides `/api/...` data and `/images` | `http://localhost:3000` |
| **Frontend** | The React + Vite app | `http://localhost:5173` (Vite's default; the terminal prints the real one) |

The frontend talks to the backend through the proxy in `vite.config.js`, so **the backend must be running first**.

---

## 1. Install the tools

### 1.1 Node.js (includes npm)

Download the **LTS** version from <https://nodejs.org> and install it with the default options.

Verify (open a new terminal after installing):

```bash
node -v
npm -v
```

### 1.2 Git

- **Windows:** <https://git-scm.com/download/win>
- **macOS:** run `git --version` in Terminal; it offers to install the developer tools.
- **Linux (Ubuntu/Debian):** `sudo apt install git`

Verify:

```bash
git --version
```

Set your identity once:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

### 1.3 VS Code (editor)

Download from <https://code.visualstudio.com>. Recommended extensions: **ESLint**, **ES7+ React/JS snippets**.

---

## 2. Get the code

Pick a folder (e.g. `Documents/projects`) and open a terminal there.

```bash
git clone <URL-of-your-frontend-repo>
git clone <URL-of-your-backend-repo-or-download-the-backend-folder>
```

> Your GitHub username is `Lyxian0906`, so the URL looks like `https://github.com/Lyxian0906/<repo-name>`.
> Private repos ask you to sign in the first time.
>
> **About the backend:** I haven't seen the backend code, only the frontend. It's the server from your course that runs on port 3000. If it came as a zip or a folder inside the course files, copy it next to the frontend folder instead of cloning.

Suggested layout:

```
projects/
├── <frontend-folder>/   # React app (src/, vite.config.js, eslint.config.js ...)
└── <backend-folder>/    # server on port 3000
```

---

## 3. Start the backend (Terminal 1)

```bash
cd <backend-folder>
npm install
```

Then start it. **Check the backend's `package.json`, under `"scripts"`, for the exact command.** Common ones:

```bash
npm start
# or
node server.js
# or
npm run dev
```

Check it works by opening these in the browser:

- <http://localhost:3000/api/products>: should show JSON data
- <http://localhost:3000/api/cart-items>

Leave this terminal open.

---

## 4. Start the frontend (Terminal 2)

```bash
cd <frontend-folder>
npm install
npm run dev
```

`npm install` reads `package.json` and downloads everything into `node_modules/`. If it's missing packages the code uses, install them:

```bash
npm install react-router axios dayjs
```

Open the address that Vite prints (usually <http://localhost:5173>).

---

## 5. Quick check that everything works

- [ ] Home page shows products (`/api/products` works through the proxy)
- [ ] Cart count shows in the header (`/api/cart-items?expand=product`)
- [ ] `/checkout` shows delivery options and the payment summary
- [ ] `/orders` shows your orders

---

## 6. Daily routine

1. Open the project in VS Code.
2. Terminal 1: start the backend.
3. Terminal 2: `npm run dev` in the frontend.
4. Save your work with Git:

```bash
git add .
git commit -m "Describe what you changed"
git push
```

---

## 7. Troubleshooting

| Problem | Likely cause / fix |
|---------|--------------------|
| `node` or `npm` is not recognized | Node isn't installed, or the terminal was open during install. Close and reopen the terminal. |
| Page loads but is empty, and the Vite terminal shows `ECONNREFUSED` or proxy errors | The backend isn't running. Start it (step 3). |
| `EADDRINUSE: port 3000 already in use` | Another program uses the port. Close it, or stop the old server with Ctrl+C. |
| `Cannot find module 'axios'` (or `dayjs`, `react-router`) | Run `npm install` again, or `npm install <package-name>`. |
| Errors right after cloning | You skipped `npm install`. `node_modules` isn't stored in Git. |
| ESLint error about `react/prop-types` or "Could not find plugin react" | Remove `'react/prop-types': 'off'` from `eslint.config.js`, or install and register `eslint-plugin-react`. |
| Vite says your Node version is too old | Reinstall the current **LTS** Node from nodejs.org. |
| Images don't show | The `/images` proxy needs the backend running and serving that folder. |
| PowerShell blocks scripts on Windows | Use Command Prompt or Git Bash, or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. |

---

## 8. Building for production (optional)

```bash
npm run build     # creates the dist/ folder
npm run preview   # serves the built version locally
```

Note: the Vite proxy only exists in dev mode. A deployed site needs its own way to reach the backend.
