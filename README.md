# Angel Numbers

A PWA that reveals the spiritual meaning of angel numbers by searching and aggregating meanings from across the web.

## Features

- Input any angel number (1-4 digits)
- Fetches meanings from multiple sources via SerpAPI
- Caches results in Supabase for faster subsequent lookups
- PWA support with offline caching
- Responsive spiritual-themed UI

## Tech Stack

- **Frontend**: HTML, JavaScript, Tailwind CSS v4
- **Backend**: Supabase Edge Functions (Deno)
- **API**: SerpAPI for search
- **Database**: Supabase (PostgreSQL)

## Setup

### 1. Supabase Setup

1. Create a Supabase project at https://supabase.com
2. Run the SQL from `SQL.md` in the Supabase SQL Editor to create the cache table

### 2. Environment Variables

Set these in your Supabase Edge Function:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `SERPAPI_KEY` - Get one at https://serpapi.com

### 3. Deploy Edge Function

```bash
supabase functions deploy get-angel-meaning
```

### 4. Configure Frontend

Edit `js/app.js` and replace:
```javascript
const SUPABASE_FUNCTION_URL = 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/get-angel-meaning';
```

Edit `supabase/functions/get-angel-meaning/index.ts` and update CORS:
```typescript
'Access-Control-Allow-Origin': 'https://YOUR_USERNAME.github.io',
```

### 5. Add PWA Icons

Create and add these files (referenced in `manifest.json`):
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

### 6. Build CSS

```bash
npm install
npm run build
```

## Development

```bash
npm run dev
```

## Audit Summary

### Implemented
- [x] Frontend with Tailwind CSS styling
- [x] Search functionality with loading states
- [x] Results display with meanings and sources
- [x] Error handling
- [x] In-memory caching in app.js
- [x] PWA manifest
- [x] Service worker (basic)
- [x] Supabase Edge Function with SerpAPI integration
- [x] Database caching
- [x] SQL schema for cache table

### Remaining Tasks
- [ ] Configure `SUPABASE_FUNCTION_URL` in `js/app.js`
- [ ] Configure CORS origin in Edge Function
- [ ] Set environment variables in Supabase
- [ ] Deploy Edge Function
- [ ] Add PWA icons (icon-192.png, icon-512.png)
- [ ] Fix service worker font URL (currently caches wrong font)
- [ ] Run SQL in Supabase

## Project Structure

```
Angel_Numbers/
├── index.html              # Main app
├── js/app.js               # Frontend logic
├── css/
│   ├── input.css           # Tailwind input
│   └── style.css          # Built CSS
├── sw.js                   # Service worker
├── manifest.json           # PWA manifest
├── package.json            # Dependencies
├── SQL.md                  # Database schema
└── supabase/
    └── functions/
        └── get-angel-meaning/
            └── index.ts    # Edge function
```
