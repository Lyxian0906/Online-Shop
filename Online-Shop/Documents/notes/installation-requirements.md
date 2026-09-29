# Installation Requirements — React Course Project

Based on `1-links.md` from the SuperSimpleDev react-course. Versions confirmed to match this project.

## Tools

| Tool | Required version | Notes |
|---|---|---|
| Node.js | 20 or higher | Check with `node -v` |
| Git | Any recent version | https://github.com/SuperSimpleDev/installation-instructions/blob/main/git.md |
| Google Chrome | Latest | For dev tools + React DevTools extension |
| VSCode | Latest | Editor used throughout the course |

## Frontend Setup

Create the project:

npx create-vite@6.5.0

Install dependencies:

npm install react-router@7.8.0
npm install axios@1.8.4
npm install dayjs@1.11.13

Install dev dependencies (testing):

npm install --save-dev vitest@3.1.2
npm install --save-dev @testing-library/react@16.3.0 @testing-library/jest-dom@6.6.3 @testing-library/user-event@14.6.1 jsdom@26.1.0

Install React Compiler (for React 19 support):

npm install --save-dev babel-plugin-react-compiler@rc

### vite.config.js

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({
    babel: {
      plugins: [['babel-plugin-react-compiler', { target: '19' }]],
    },
  })],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './setupTests.js',
  }
});

### setupTests.js

import '@testing-library/jest-dom';

## Backend Setup

The backend is a separate, pre-built project — not an npm package installed into the frontend.

1. Clone/download: https://github.com/supersimpledev/ecommerce-backend-ai
2. Follow its own setup steps: https://github.com/SuperSimpleDev/ecommerce-backend-ai/blob/main/documentation.md
3. Run it with `npm run dev` (from inside the backend folder) alongside the frontend's own `npm run dev`.

## Optional (React DevTools)

React DevTools Chrome extension — confirms the React Compiler is active (look for "Memo ✨" badge on components in the Components tab).

## Deployment (Lesson 10, if applicable)

- Elastic Beanstalk instance types: t3.micro / t3.small (accounts after July 15, 2025) or t3.micro / t2.micro (accounts before)
- Database instance class: db.t3.micro