<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Memory & Architecture Map

This project features a premium, responsive AI Chat Interface (ChatGPT/Claude style) built entirely client-side using React 19, Next.js 16 (App Router), and Tailwind CSS v4.

## Core Component Map

- **[app/page.tsx](file:///Users/manideekshith/Desktop/nvidia/frontend/app/page.tsx)**: Main orchestration container.
  - *State Management:* Handles active chat ID, chat sessions lists, theme status (light/dark mode toggle), and simulated typewriter streaming responses.
  - *LocalStorage Sync:* Automates loading/saving of conversation logs and session meta arrays.
  - *Backend Integration:* Contains a clear integration function `sendMessageToBackend(...)` to replace simulated responses with live backend streams.
  
- **[components/sidebar.tsx](file:///Users/manideekshith/Desktop/nvidia/frontend/components/sidebar.tsx)**: Collapsible drawer for desktop & mobile.
  - *Features:* Session logs sidebar, New Conversation triggers, full history purge, single chat deletions, and custom animated SVG theme switches.
  
- **[components/chat-area.tsx](file:///Users/manideekshith/Desktop/nvidia/frontend/components/chat-area.tsx)**: Interactive conversation stage.
  - *Features:* Initial layout suggestions card grid (triggers standard mock prompts), model selectors, user message bubbles, and custom typewriter drafting loaders.
  - *Parser:* Custom built-in React markdown element parser. Renders inline code blocks, bold strings, list indicators, and code blocks in a dark editor wrapper with single-click clipboard copy buttons.
  
- **[components/chat-input.tsx](file:///Users/manideekshith/Desktop/nvidia/frontend/components/chat-input.tsx)**: Centered interactive bottom keyboard.
  - *Features:* Auto-growing textarea (up to 160px), submit-on-Enter handling, accessory bars, character limits, and glowing Send triggers.

- **[app/globals.css](file:///Users/manideekshith/Desktop/nvidia/frontend/app/globals.css)**: Central theme design system.
  - *Tokens:* Tailwind v4 configuration, custom scrollbar styling, premium gradients, glassmorphism overlays (`.glass-effect`, `.glass-sidebar`), HSL borders, and typewriter keyframes.

## Tech Stack & Conventions
- **React 19 & Next.js 16 (App Router):** Safe client-side hooks are evaluated within `useEffect` hooks to prevent hydration mismatches during pre-rendering.
- **Tailwind CSS v4:** Uses standard `@import "tailwindcss"` and custom `@theme inline` utilities.
- **Dependency Free:** Formatter and rendering controls are built dynamically without external node packages to prevent standard React 19 compilation clashes.
