# GitHub Actions CI/CD Setup

This repository uses GitHub Actions for continuous integration and deployment.

## Workflows

### 1. CI - Build and Test (`.github/workflows/ci.yml`)

- Runs on every push and pull request
- Installs dependencies
- Lints code
- Builds the client
- Runs tests

### 2. Deploy (`.github/workflows/deploy.yml`)

- Runs on push to `main` or `master` branch
- Builds and tests the application
- Deploys backend to Render (automatic via Render's GitHub integration)
- Deploys frontend to your hosting service

## Required GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add:

### Required Secrets:

- `VITE_API_URL` - Your backend API URL (e.g., `https://codenest-1-meva.onrender.com/api`)

### Optional Secrets (depending on frontend hosting):

#### For Netlify:

- `NETLIFY_AUTH_TOKEN` - Your Netlify personal access token
- `NETLIFY_SITE_ID` - Your Netlify site ID

#### For Vercel:

- `VERCEL_TOKEN` - Your Vercel authentication token
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Your Vercel project ID

## Backend Deployment (Render)

Your backend on Render can auto-deploy when you push to GitHub:

1. Go to your Render dashboard → Your service
2. Settings → Build & Deploy
3. Enable "Auto-Deploy" for your branch
4. Render will automatically deploy on every push

## Frontend Deployment

### Option 1: Netlify

Update `.github/workflows/deploy.yml` deploy-frontend step:

```yaml
- name: Deploy to Netlify
  uses: netlify/actions/cli@master
  env:
    NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
    NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
  with:
    args: deploy --prod --dir=client/dist
```

### Option 2: Vercel

Update `.github/workflows/deploy.yml` deploy-frontend step:

```yaml
- name: Deploy to Vercel
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
    vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
    working-directory: ./client/dist
    vercel-args: "--prod"
```

### Option 3: GitHub Pages

Update `.github/workflows/deploy.yml` deploy-frontend step:

```yaml
- name: Deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./client/dist
```

## Setup Instructions

1. **Add secrets to GitHub:**
   - Repository → Settings → Secrets and variables → Actions
   - Add all required secrets

2. **Connect Render to GitHub:**
   - Render Dashboard → Your service → Settings
   - Enable Auto-Deploy for your branch

3. **Choose and configure frontend hosting:**
   - Uncomment and configure your chosen hosting option in `deploy.yml`

4. **Push to trigger deployment:**
   ```bash
   git add .
   git commit -m "Setup CI/CD"
   git push origin main
   ```

## Monitoring

- Check workflow status: GitHub repository → Actions tab
- View deployment logs in the Actions tab
- Backend logs: Render Dashboard → Logs
- Frontend logs: Your hosting service dashboard

## Troubleshooting

### Build fails

- Check if all dependencies are listed in `package.json`
- Verify Node.js version compatibility (using Node 20)

### Deployment fails

- Verify all secrets are correctly set
- Check service connection to GitHub
- Review logs in Actions tab

### Environment variables

- Backend: Set in Render Dashboard → Environment
- Frontend: Set as GitHub Secrets and used in workflow
