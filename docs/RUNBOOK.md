# Runbook

## Deployment Procedures

### Local Development

```bash
npm run dev
```

Server starts at http://localhost:3000 with hot reload enabled.

### Production Build

```bash
# Build optimized bundle
npm run build

# Start production server
npm run start
```

### Static Export (Optional)

If deploying to static hosting:

```bash
# Add to next.config.ts: output: 'export'
npm run build
# Output in ./out directory
```

### Vercel Deployment (Recommended)

1. Connect repository to Vercel
2. Vercel auto-detects Next.js and configures build
3. Push to main branch triggers automatic deployment

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| *None* | - | No environment variables required currently |

## Monitoring and Alerts

### Health Checks

- **Development**: http://localhost:3000
- **Production**: Check HTTP 200 response on root path

### Performance Monitoring

- Use Next.js built-in analytics (when configured)
- Monitor Core Web Vitals via Vercel Analytics

## Common Issues and Fixes

### Issue: Build Fails with Type Errors

**Symptoms**: `npm run build` fails with TypeScript errors

**Fix**:
```bash
# Check for type errors
npx tsc --noEmit

# Fix reported issues, then rebuild
npm run build
```

### Issue: ESLint Configuration Error

**Symptoms**: `npm run lint` reports configuration issues

**Fix**:
```bash
# Regenerate ESLint config
rm -rf .eslintrc* eslint.config.*
npm run lint -- --init
```

### Issue: Hydration Mismatch

**Symptoms**: Console shows hydration errors, usually with dark mode

**Fix**:
- Ensure `suppressHydrationWarning` on `<html>` tag
- Use `mounted` state check in ThemeProvider

### Issue: External Image Not Loading

**Symptoms**: Images from external domains show broken

**Fix**:
Add domain to `next.config.ts`:
```typescript
images: {
  remotePatterns: [
    { hostname: 'example.com' }
  ]
}
```

## Rollback Procedures

### Vercel Rollback

1. Go to Vercel Dashboard > Deployments
2. Find previous successful deployment
3. Click "..." menu > "Promote to Production"

### Manual Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or checkout specific version
git checkout <commit-hash>
npm install
npm run build
npm run start
```

## Maintenance Tasks

### Dependency Updates

```bash
# Check for outdated packages
npm outdated

# Update all dependencies
npm update

# Update to latest major versions (careful)
npx npm-check-updates -u
npm install
```

### Cache Clear

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

*Auto-generated from package.json on 2026-01-30*
