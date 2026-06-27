# AtechSkills Frontend

Next.js marketing website and LMS portals.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:8000`.

## Environment Variables

Create `frontend/.env.local` locally and add the same variables in the Vercel frontend project.

```env
NEXT_PUBLIC_APP_URL=https://your-frontend-domain.vercel.app
NEXT_PUBLIC_API_URL=https://your-backend-domain.vercel.app/api/v1
NEXT_PUBLIC_SITE_NAME=AtechSkills
```

Do not commit real `.env.local` values to GitHub. Add these values in Vercel under Project Settings > Environment Variables.

## Vercel Frontend

Deploy this folder as its own Vercel project with **Root Directory** set to `frontend`.

- Install command: `npm install`
- Build command: `npm run build`
- Output: Next.js, handled by Vercel automatically

## Structure

- `app` - route segments for public pages, auth, dashboards, sitemap, robots
- `components` - reusable UI, layouts, forms, cards
- `lib` - data, helpers, API client, metadata utilities

The frontend is deployment-ready for Vercel. Set `NEXT_PUBLIC_API_URL` to the deployed backend API URL.
