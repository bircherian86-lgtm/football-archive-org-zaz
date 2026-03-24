# Deployment Guide for Vercel

## 🚨 Critical Issues Fixed

### 1. **File Storage** ✅
- **Problem**: The app was using local filesystem (`fs/promises`) which doesn't work on Vercel's serverless environment
- **Solution**: Migrated to Vercel Blob storage for all file uploads (profile pictures, banners, video clips)

### 2. **Database & Prisma** ✅
- **Problem**: SQLite doesn't work on Vercel and Prisma 7 had validation issues.
- **Solution**: 
  - Migrated schema to **PostgreSQL**.
  - Downgraded to **Prisma 5.15.0** (stable).
  - Cleaned up all database initialization code.

## 📋 Pre-Deployment Checklist

### Step 1: Set Up Vercel Blob Storage

1. Go to your Vercel Dashboard
2. Navigate to **Storage** → **Create Database** → **Blob**
3. Create a new Blob store
4. Copy the `BLOB_READ_WRITE_TOKEN` from the store settings
5. Add it to your Vercel project's environment variables

### Step 2: Set Up a Cloud Database

You have several options:

#### Option A: Vercel Postgres (Recommended)
```bash
# In your Vercel dashboard:
# 1. Go to Storage → Create Database → Postgres
# 2. Create a new database
# 3. Copy the DATABASE_URL (it will be automatically added to your env vars)
```

#### Option B: Neon (Free tier available)
```bash
# 1. Sign up at https://neon.tech
# 2. Create a new project
# 3. Copy the connection string
# 4. Add to Vercel env vars as DATABASE_URL
```

#### Option C: PlanetScale (Free tier available)
```bash
# 1. Sign up at https://planetscale.com
# 2. Create a new database
# 3. Get the connection string
# 4. Add to Vercel env vars as DATABASE_URL
```

### Step 3: Update Prisma Schema for PostgreSQL

If you choose PostgreSQL, update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}

// Remove the adapter configuration from prisma.config.ts
```

### Step 4: Set Environment Variables in Vercel

Go to your Vercel project → **Settings** → **Environment Variables** and add:

```bash
# Database
DATABASE_URL=<your-cloud-database-url>

# Authentication
AUTH_SECRET=<generate-with: openssl rand -base64 32>
AUTH_TRUST_HOST=true
AUTH_URL=https://your-app.vercel.app

# Vercel Blob
BLOB_READ_WRITE_TOKEN=<from-vercel-blob-dashboard>

# Optional: Firebase (if using)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
# ... etc
```

### Step 5: Run Database Migrations

After setting up your cloud database:

```bash
# Generate Prisma client for new database
npx prisma generate

# Push schema to cloud database
npx prisma db push

# Seed the database with admin user
npx prisma db seed
```

### Step 6: Deploy to Vercel

```bash
# Commit all changes
git add .
git commit -m "Fix: Migrate to Vercel Blob and cloud database for production"
git push origin master

# Vercel will automatically deploy
```

## 🔧 What Was Changed

### Files Modified:
1. **`src/app/api/user/settings/route.ts`**
   - Replaced `fs/promises` with `@vercel/blob`
   - Profile pictures and banners now upload to Vercel Blob

2. **`src/app/api/upload/route.ts`**
   - Replaced `fs/promises` with `@vercel/blob`
   - Video clips and thumbnails now upload to Vercel Blob

3. **`package.json`**
   - Added `@vercel/blob` dependency
   - Updated build script to include `prisma generate`

4. **`tsconfig.json`**
   - Excluded `prisma` directory from TypeScript compilation

5. **`src/types/next-auth.d.ts`** (new)
   - Fixed NextAuth type definitions for Next.js 15

## 🐛 Troubleshooting

### "Failed to update settings" Error
- **Cause**: Missing `BLOB_READ_WRITE_TOKEN` environment variable
- **Fix**: Add the token from Vercel Blob dashboard to your environment variables

### Database Connection Errors
- **Cause**: Using SQLite in production or incorrect DATABASE_URL
- **Fix**: Migrate to a cloud database and update DATABASE_URL

### Build Failures
- **Cause**: Prisma client not generated
- **Fix**: The build script now includes `prisma generate`, but ensure your DATABASE_URL is set

### Authentication Issues
- **Cause**: Missing or incorrect AUTH_SECRET or AUTH_URL
- **Fix**: 
  - Generate a new secret: `openssl rand -base64 32`
  - Set AUTH_URL to your production domain

## 📝 Local Development

For local development, you can still use SQLite:

```bash
# .env.local
DATABASE_URL="file:./data.db"
AUTH_URL="http://localhost:9002"
# BLOB_READ_WRITE_TOKEN is optional for local dev
# Files will fail to upload without it, but the app will run
```

## 🚀 Post-Deployment

After successful deployment:

1. Visit your Vercel URL
2. Log in with the admin credentials:
   - Username: `zazaep21`
   - Password: `bedwars2133`
3. Test the settings page to verify file uploads work
4. Test uploading a clip to verify video uploads work

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables are set correctly
4. Ensure database migrations ran successfully
