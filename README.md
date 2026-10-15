# WisprBridge 🌉

> **Real-time speech-to-terminal prompt bridge with self-destructive context, ephemeral pairing, and Google AI Edge Eloquent aesthetics.**

---

## 🚀 The Problem & Solution

* **The Problem**: On enterprise / corporate laptops, security restrictions prevent installing speech-to-text tools like **Whisper Flow**.
* **The Solution**: Whisper Flow is free and unrestricted on Android mobile. With **WisprBridge**, you speak or type on your phone, and prompts stream in real time (`< 200ms`) straight to your work laptop terminal or agentic AI session with **1-Click Copy** and **Auto-Copy**.

---

## ✨ Features

- **Google AI Edge Eloquent UI**: Faithfully replicates Google's Material 3 design language—rounded white card surfaces, soft status pill (`On ☁️`), pill chips, and circular `+` input bar.
- **Zero-Credential Device Pairing**: Connect your phone and laptop using an ephemeral **6-digit room code** (e.g. `582-194`). No passwords or personal accounts required on corporate machines.
- **Real-Time Sync + 5-Second Heartbeat**: Powered by **Supabase Realtime WebSockets** with an automatic **5-second polling fallback** for guaranteed reliability.
- **Auto-Copy Engine**: When toggled ON on your laptop, incoming prompts are automatically written to your system clipboard the instant they arrive while the tab is active.
- **1-Hour Self-Destructive TTL**: Prompts automatically self-destruct after 60 minutes with a live countdown timer (`⏳ 54m left`).
- **"Keep" Preservation**: Toggle the bookmark/pin icon on any prompt to retain it permanently.
- **Floating Prompt Reader Modal**: Clicking on any prompt text opens a comfortable reading modal with word counts, full multiline formatting, and quick copy/keep/delete actions.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Styling**: Tailwind CSS v4 (Google Material 3 design tokens)
- **Database & Sync**: Supabase (PostgreSQL, Row Level Security, Realtime WebSockets)
- **Icons**: Lucide React
- **Deployment**: Vercel CLI

---

## 📋 Quick Setup & Deployment Guide

### 1. Supabase Database Setup
1. In your Supabase Dashboard (or using `supabase db push`), open the **SQL Editor**.
2. Run the SQL script found in [`supabase/schema.sql`](supabase/schema.sql).
3. Copy your **Project URL** and **Anon Public Key** from `Project Settings -> API`.
4. Create `.env.local` in this folder:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```

*(Note: WisprBridge also functions in instant demo/simulation mode out of the box if credentials are not yet configured!)*

### 2. Local Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your laptop and on your mobile device (via local network IP or ngrok/Vercel URL).

### 3. Deploy to Vercel via CLI
```bash
# Login to Vercel (if not already logged in)
vercel login

# Deploy production build
vercel --prod
```
During the setup prompt, link your environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

### 4. Push to GitHub via GitHub CLI
```bash
# Stage and commit
git add .
git commit -m "Initial commit: WisprBridge with Google Eloquent UI and Supabase Realtime"

# Create a private GitHub repository and push
gh repo create wisprbridge --private --source=. --remote=origin --push
```

---

## 📱 How to Use with Whisper Flow on Android

1. Open **WisprBridge** on your Android mobile browser.
2. Note your 6-digit room code at the top (e.g. `482-910`).
3. Open **WisprBridge** on your laptop browser and click **Pair Room** (or visit `https://your-app.vercel.app?code=482910`).
4. On your laptop, toggle **Auto-Copy: ON**.
5. On your phone, tap the input box. Your mobile keyboard pops up.
6. Tap the **Whisper Flow** microphone icon and speak your prompt.
7. Tap the circular `+` button.
8. The prompt appears instantly on your laptop and is copied straight into your clipboard ready to paste into your terminal (`Ctrl+V` or `Cmd+V`)!
