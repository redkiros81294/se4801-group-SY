# ChainTrack Frontend

React 19 + Vite 8 + TypeScript admin dashboard and public portal for the ChainTrack supply chain provenance platform.

## Tech Stack

- React 19 + Vite 8
- TypeScript
- Tailwind CSS
- React Router 7
- Axios
- Recharts
- jsQR
- Tabler Icons

## Scripts

```bash
npm install
npm run dev      # Start dev server on http://localhost:5173
npm run build    # Production build to dist/
npm run preview  # Preview production build
```

## Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL, e.g. `http://localhost:8080/api` |
| `VITE_API_FALLBACK_URL` | Secondary backend URL (optional) |

Create a `.env.local` file in this directory:

```env
VITE_API_URL=http://localhost:8080/api
```

## Docker

The frontend is built as a multi-stage Docker image and served by nginx on port 5173:

```bash
docker-compose up --build
```

## Auth

JWT is stored in React Context state and `sessionStorage`. Never use `localStorage` or `sessionStorage` for tokens directly in components — use the `AuthContext` and `authToken` module.

## Code Structure

- `src/pages/` — Route-level pages
- `src/components/` — Shared UI components
- `src/contexts/` — React Context providers
- `src/hooks/` — Custom hooks
- `src/lib/` — API client, auth token management, event types

## Styling

Uses CSS custom properties for the ChainTrack design system. See `src/index.css` for the full token set.

## Lint / Type Check

```bash
npx tsc -b --noEmit
```
