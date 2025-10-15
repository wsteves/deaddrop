# 🚀 Vercel Deployment Guide

This app is now configured to deploy on Vercel with serverless functions!

## 📋 Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. [Vercel CLI](https://vercel.com/docs/cli) installed: `npm i -g vercel`

## 🔧 Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Vercel Postgres Database

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (or create a new one)
3. Go to **Storage** tab
4. Click **Create Database**
5. Select **Postgres**
6. Name it `dripdrop-db`
7. Click **Create**

### 3. Initialize Database Schema

After creating the database, run the schema:

1. In Vercel Dashboard, go to your Postgres database
2. Click **Query** tab
3. Copy and paste contents of `schema.sql`
4. Click **Execute Query**

### 4. Create Vercel Blob Storage

1. In Vercel Dashboard, go to **Storage** tab
2. Click **Create Database**
3. Select **Blob**
4. Name it `dripdrop-blobs`
5. Click **Create**

### 5. Set Environment Variables

Vercel will auto-configure database variables. Add these optional ones:

```bash
# For IPFS uploads (optional but recommended)
IPFS_API_TOKEN=your_web3storage_token_here

# Your Polkadot endpoint (already in code, but can override)
VITE_WS_ENDPOINT=wss://westend-rpc.polkadot.io
```

To add them:
- Go to **Project Settings** → **Environment Variables**
- Or use CLI: `vercel env add IPFS_API_TOKEN`

### 6. Deploy to Vercel

```bash
# Link your project
vercel link

# Deploy to production
vercel --prod
```

Or push to GitHub and Vercel will auto-deploy!

## 🧪 Local Development

```bash
# Install Vercel CLI
npm i -g vercel

# Pull environment variables from Vercel
vercel env pull .env.local

# Run development server
vercel dev
```

This runs your serverless functions locally!

## 📁 Project Structure

```
dripdrop/
├── api/                    # Vercel serverless functions
│   ├── upload.ts          # POST /api/upload
│   └── retrieve.ts        # GET /api/retrieve?id=xxx
├── apps/
│   └── web/               # React frontend (Vite)
├── schema.sql             # Postgres database schema
├── vercel.json            # Vercel configuration
└── .env.example           # Environment variables template
```

## 🔑 Getting API Tokens

### Web3.Storage (Recommended for IPFS)
1. Go to [web3.storage](https://web3.storage)
2. Sign up for free (5GB free storage)
3. Create an API token
4. Add to Vercel: `IPFS_API_TOKEN=your_token`

### Infura IPFS (Alternative)
1. Go to [infura.io](https://infura.io)
2. Create account and project
3. Get Project ID and Secret
4. Add to Vercel:
   - `IPFS_PROJECT_ID=your_id`
   - `IPFS_PROJECT_SECRET=your_secret`

## 🎯 API Endpoints

Once deployed, your API will be available at:

- **Upload**: `POST https://your-app.vercel.app/api/upload`
- **Retrieve**: `GET https://your-app.vercel.app/api/retrieve?id=xxx`

## ⚡ Features

- ✅ Serverless architecture (infinite scale)
- ✅ Postgres database (persistent metadata)
- ✅ Blob storage (file hosting)
- ✅ IPFS integration (decentralized storage)
- ✅ Auto-scaling
- ✅ Global CDN
- ✅ Zero config deployments

## 🐛 Troubleshooting

### Database Connection Errors
- Make sure Vercel Postgres is created and linked
- Run `schema.sql` to initialize tables
- Check environment variables are set

### Blob Storage Errors
- Verify Blob storage is created in Vercel
- Check `BLOB_READ_WRITE_TOKEN` is set

### IPFS Upload Fails
- Falls back to Blob storage automatically
- Add `IPFS_API_TOKEN` for IPFS uploads

### Cold Start Issues
- First request may be slow (cold start)
- Subsequent requests are fast
- Consider Vercel Pro for better performance

## 📊 Monitoring

View logs and metrics:
```bash
vercel logs
```

Or in Vercel Dashboard → Project → Logs

## 💰 Pricing

Vercel Free Tier includes:
- 100GB bandwidth
- 100GB-hours serverless execution
- 60 invocations per minute

Perfect for getting started! Upgrade to Pro for higher limits.

## 🚀 Next Steps

1. Deploy and test your app
2. Monitor usage in Vercel Dashboard
3. Set up custom domain
4. Enable analytics
5. Add monitoring/alerts

Happy deploying! 🎉
