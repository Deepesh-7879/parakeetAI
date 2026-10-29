# Parakeet interview assistant

An independent interview workspace and landing page. Use only where assistance is permitted. AI output can be inaccurate; do not invent qualifications or experience.

## Features

- `/app.html`: type a question, paste resume/context and target role, generate AI talking points.
- Browser microphone dictation (Chrome/Edge; browser online speech service may be used).
- Meeting-tab audio capture on compatible desktop browsers. Select the meeting tab and enable **Share tab audio**. Independent 10-second recordings are uploaded to Groq Whisper, then the next recording starts after transcription completes. There are gaps while requests complete; this is segmented capture, not continuous streaming. Video is never uploaded. Review transcripts; silence and clipped phrases may be misrecognized.
- Optional automatic answer generation per captured segment. Start with manual generation for complete questions.
- Concise, detailed, and STAR answer styles. Last 12 answers stay in memory; reload or Clear session removes context/history. Nothing is stored by this application in a database or browser storage. Browser speech and Groq have their own processing and retention policies.
- Server-side Groq chat/transcription requests. API key is never sent to the browser. Password required for API calls.

## Deploy on Vercel

Import this repository with the Vite preset. Build `npm run build`, output `dist`. API files in `api/` run as Vercel Node functions.

In **Project → Settings → Environment Variables**, add:

1. `GROQ_API_KEY`: create an API key at https://console.groq.com/keys . Never paste it in chat or the browser app.
2. `APP_ACCESS_TOKEN`: choose a long, random private password. Enter this password in the workspace. Keep this personal deployment private; this shared password is not a multi-user authentication system.
3. Optional `GROQ_MODEL`: defaults to `llama-3.3-70b-versatile`.

Enable for Production (and Preview if needed), then **redeploy**. Changing environment variables does not update existing immutable deployments. Open the latest Production domain, not an older deployment URL. Provider quota/billing belongs to your Groq account.

The chat API and transcription require a real working key. Without configuration, the app shows a setup message rather than simulated answers.

## Development

Node 22+ recommended. Run `npm ci`, `npm run dev -- --host 0.0.0.0`. Vite serves the UI only. Use `npx vercel dev` to run both Vite and the server functions locally, with environment variables supplied securely (ignored `.env.local` or Vercel).

`npm run build` builds both HTML entrypoints. `npm run preview` serves UI output only, not server functions.

Run `node tests/api.test.js` for server validation/auth/provider handling. These use mocked provider responses, not real AI. Real microphone permission, meeting audio, and provider output require manual validation with configured credentials on HTTPS.
