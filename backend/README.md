# AtechSkills Backend

Express + Prisma API for authentication, RBAC, LMS, events, Daily Insights, support tickets, recordings, certificates, and website CMS.

## Run

```bash
npm install
npm run prisma:generate
npm exec prisma db push
npm run prisma:seed
npm run dev
```

API runs on `http://localhost:9000/api/v1`.

## Environment Variables

Create `backend/.env` locally and add the same variables in the Vercel backend project.

```env
NODE_ENV=production
PORT=9000
API_PREFIX=/api/v1
FRONTEND_URL=https://atechskills.com
BACKEND_URL=https://apiatechskills.vercel.app
DATABASE_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=30d
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_URL=
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REFRESH_TOKEN=
GOOGLE_DRIVE_RECORDINGS_FOLDER_ID=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

Do not commit real `.env` values to GitHub. Add secrets in Vercel under Project Settings > Environment Variables.

## Vercel Backend

Deploy this folder as its own Vercel project with **Root Directory** set to `backend`.

- Install command: `npm install`
- Build command: `npm run build`
- API base after deployment: `https://your-backend-domain.vercel.app/api/v1`

## Production Notes

- Use Neon PostgreSQL via `DATABASE_URL`.
- Set long random JWT secrets.
- Configure Cloudinary for images and file thumbnails.
- Configure Google Drive variables for recording storage.
- Configure Google OAuth for student login:
  - Authorized JavaScript origins: `https://atechskills.com`, `https://www.atechskills.com`, and `http://localhost:8000` for local testing.
  - Authorized redirect URIs: `https://apiatechskills.vercel.app/api/v1/auth/google/callback` and `http://localhost:9000/api/v1/auth/google/callback` for local testing.
  - Put the OAuth web client values in `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`.
- Run `npm run prisma:generate` and `npm exec prisma db push` before first production use if the database is empty.
- Add both `https://atechskills.com` and `https://www.atechskills.com` as allowed frontend origins when using a custom backend domain or proxy.
