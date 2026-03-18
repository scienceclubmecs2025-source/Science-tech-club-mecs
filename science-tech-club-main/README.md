# Science & Tech Club Portal (Static Frontend + API Backend)

This project contains:
- A **static** frontend (pure HTML/CSS/JS) hosted on **Netlify**
- A backend API hosted on **Render**
- A database on **Supabase (Postgres)**

The static frontend talks to the backend using `fetch()` and stores login token/user in `localStorage`. [web:150][web:151]

---

## Project Structure

```
science-tech-club/
├── server/                      # Backend (Node + Express + Supabase)
│   ├── src/
│   ├── package.json
│   └── .env.example
└── client/                      # Frontend (Static HTML/CSS/JS)
    ├── netlify.toml
    ├── index.html
    ├── login.html
    ├── student.html
    ├── faculty.html
    ├── admin.html
    ├── committee.html
    ├── executives.html
    ├── representatives.html
    ├── developers.html
    ├── css/
    │   └── styles.css
    └── js/
        ├── chatbot.js           # Contains window.API_BASE
        └── auth.js
```

---

## Live URLs

### Backend (Render)
Set your API base URL to:

```js
window.API_BASE = "https://science-tech-club-iju0.onrender.com/api";
```

This line is currently placed in:
- `client/js/chatbot.js`

---

## Frontend (Netlify)

### Important Netlify Settings
Because your `netlify.toml` is inside `client/`, configure Netlify as: [web:146][web:150]

- **Base directory**: `client`
- **Build command**: (leave empty)
- **Publish directory**: (leave empty) — it will use `publish = "."` from `client/netlify.toml`

### `client/netlify.toml`
```toml
[build]
  command = ""
  publish = "."

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

> Note: The redirect helps if someone opens a URL path directly, though this project mostly uses `.html` pages. [web:148][web:155]

---

## Backend (Render) Setup

### Render Service Settings (Typical)
- **Root directory**: `server`
- **Build command**: `npm install`
- **Start command**: `npm start`

Add environment variables in Render Dashboard (do not commit `.env` to Git). [web:151][web:159]

---

## Supabase Environment Variables (Backend Only)

These keys must be used **only on the backend**, never in the browser. Supabase service role key bypasses RLS and must be kept private. [web:74]

Example (Render Environment Variables):
```txt
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxx
SUPABASE_ANON_KEY=xxxx
JWT_SECRET=xxxx

# Optional SMTP (only if using welcome emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=xxxx@gmail.com
SMTP_PASS=xxxx
FROM_EMAIL=xxxx@gmail.com
```

---

## Frontend Auth Flow (Static)

- Login page (`login.html`) calls:
  - `POST /api/auth/login`
- On success it stores:
  - `localStorage.club_token`
  - `localStorage.club_user`
- Each dashboard page runs:
  - `checkAuth()` from `client/js/auth.js`
- Logout clears localStorage and redirects to `login.html`

---

## Updating API URL (Frontend)

You only need to edit **one file** when your backend URL changes:

### `client/js/chatbot.js`
```js
window.API_BASE = "https://science-tech-club-iju0.onrender.com/api";
```

---

## Common Issues

### Netlify shows “Page not found”
This happens when Netlify publishes the wrong folder. Confirm: [web:150]
- Base directory = `client`
- `client/netlify.toml` exists
- `publish = "."`

### Pages load but API calls fail
- Check `window.API_BASE` is correct
- Confirm Render backend is running
- Check CORS is enabled on backend

---

## How to Deploy (Quick Steps)

### Deploy Backend (Render)
1. Push repo to GitHub.
2. Render → New Web Service → connect repo.
3. Root directory: `server`
4. Add environment variables in Render dashboard. [web:151]
5. Deploy.

### Deploy Frontend (Netlify)
1. Netlify → New site from Git → connect repo.
2. Set Base directory: `client`
3. Ensure `client/netlify.toml` exists and is committed. [web:148]
4. Deploy.

---

## Next Improvements (Optional)
- Add proper announcements and permissions endpoints in backend
- Add DB policies (RLS) and use Supabase Auth properly
- Add logo upload via Supabase Storage and show it on all pages
- Replace polling chat with realtime (WebSocket/Supabase realtime)

---
```

If you want, share your **current GitHub repo structure** (server + client) and the **Render backend endpoints you implemented**, and the README can be aligned exactly with your live routes.
