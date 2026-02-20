# Deployment Guide

## GitHub Setup

1. **Create a new GitHub repository**
   ```bash
   # On GitHub.com, create a new repository named "mission-control"
   # Do NOT initialize with README (we already have one)
   ```

2. **Push to GitHub**
   ```bash
   cd /data/.openclaw/workspace/mission-control
   git remote add origin https://github.com/YOUR_USERNAME/mission-control.git
   git branch -M main
   git push -u origin main
   ```

## Vercel Deployment

### Option 1: Vercel CLI
```bash
npm i -g vercel
cd /data/.openclaw/workspace/mission-control
vercel --prod
```

### Option 2: Vercel Dashboard
1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the static site
5. Click "Deploy"

Your dashboard will be live at: `https://mission-control-[random].vercel.app`

## Other Deployment Options

### Netlify
```bash
npm i -g netlify-cli
cd /data/.openclaw/workspace/mission-control
netlify deploy --prod
```

### GitHub Pages
1. Go to repository Settings → Pages
2. Source: Deploy from branch
3. Branch: main, folder: / (root)
4. Save

Dashboard will be at: `https://YOUR_USERNAME.github.io/mission-control/`

### Self-Hosted
Simply upload all files to any web server:
- index.html
- styles.css
- app.js

No build step required. No dependencies.

## Testing Locally

### Python (recommended)
```bash
cd /data/.openclaw/workspace/mission-control
python3 -m http.server 8000
# Open http://localhost:8000
```

### Node.js
```bash
npx serve /data/.openclaw/workspace/mission-control
```

### Direct File Access
Open `file:///data/.openclaw/workspace/mission-control/index.html` in any browser.

## Notes

- All data is stored in localStorage (browser-side)
- No backend required
- No build process
- No dependencies
- Works offline after first load
- Mobile responsive

## Custom Domain (Vercel)

1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS:
   - Type: CNAME
   - Name: www (or @)
   - Value: cname.vercel-dns.com

## Environment

- No environment variables needed
- No API keys required
- Pure static site
