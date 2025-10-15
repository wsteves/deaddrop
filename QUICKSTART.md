# 🚀 Quick Start - Deploy to Vercel in 5 Minutes

## Step 1: Push to GitHub (if not already done)

```bash
git add .
git commit -m "Convert to Vercel serverless"
git push origin main
```

## Step 2: Deploy to Vercel

### Option A: Via Dashboard (Easiest)
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel auto-detects settings
4. Click **Deploy** 🎉

### Option B: Via CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

## Step 3: Add Storage (2 minutes)

1. Go to your deployed project in Vercel Dashboard
2. Click **Storage** tab
3. Create **Postgres** database → Name it `dripdrop-db`
4. Create **Blob** storage → Name it `dripdrop-blobs`

## Step 4: Initialize Database (1 minute)

1. Go to your Postgres database in Vercel
2. Click **Query** tab
3. Copy contents of `schema.sql` from your repo
4. Paste and click **Execute**

## Step 5: (Optional) Add IPFS Support

For uploads to go to IPFS instead of just Blob storage:

1. Get free API token from [web3.storage](https://web3.storage)
2. In Vercel Dashboard → Settings → Environment Variables
3. Add: `IPFS_API_TOKEN` = `your_token_here`
4. Redeploy (it will happen automatically)

## ✅ Done!

Your app is now live at: `https://your-app.vercel.app`

## 🧪 Test It Works

1. Go to your deployed URL
2. Upload a file
3. Browse/retrieve it
4. Check Vercel Dashboard → Storage → Blob to see uploaded files

## 📊 Monitor

- **Logs**: Vercel Dashboard → Project → Logs
- **Analytics**: Vercel Dashboard → Project → Analytics
- **Database**: Vercel Dashboard → Storage → Postgres

## 🔧 Local Development

```bash
# Pull environment vars from Vercel
vercel env pull

# Run locally with serverless functions
vercel dev
```

Access at: `http://localhost:3000`

## 💡 Tips

- **Free tier** includes 100GB bandwidth - plenty to start!
- Files stored in Blob storage are permanent
- IPFS uploads are free with web3.storage (5GB free)
- Add custom domain in Project Settings → Domains

That's it! You're live on Vercel! 🎉

Need help? Check `VERCEL_DEPLOYMENT.md` for detailed docs.
