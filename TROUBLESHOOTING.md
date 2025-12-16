# Troubleshooting Guide

Common issues and their solutions.

## Database Error: `role "" does not exist`

**Cause**: Supabase environment variables are not configured.

**Solution**:

1. Check if you have a `.env` file in the `/web` directory:
   ```bash
   cd web
   ls -la .env
   ```

2. If missing, copy from example:
   ```bash
   cp .env.example .env
   ```

3. Add your Supabase credentials to `.env`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

4. Get credentials from Supabase:
   - Go to https://supabase.com/dashboard
   - Select your project
   - Go to Settings → API
   - Copy the URL and keys

5. Restart the dev server:
   ```bash
   npm run dev
   ```

---

## Playwright Timeout Errors

**Symptoms**:
```
TimeoutError: page.goto: Timeout 60000ms exceeded
```

**Possible Causes & Solutions**:

### 1. Network Issues
- Check your internet connection
- Try a different network
- Temporarily disable VPN if using one

### 2. Skool.com Blocking
Skool.com may be detecting and blocking automated access.

**Solutions**:
- **Use a real browser**: Open Skool.com in your browser first to "warm up" your IP
- **Add delays**: The scraper now waits 3 seconds between page loads
- **Reduce frequency**: Don't scrape too frequently (wait 5-10 minutes between attempts)
- **Use proxies** (advanced): Rotate IP addresses if scraping at scale

### 3. System Resources
Low memory or CPU can cause timeouts.

**Solutions**:
- Close other applications
- Increase system resources
- Use headless mode (already enabled)

### 4. Firewall/Antivirus
Security software may block Playwright.

**Solutions**:
- Temporarily disable antivirus
- Add Playwright to whitelist
- Check firewall rules

---

## AI Generation Errors

**Symptom**: Campaigns generate but show "AI generation unavailable"

**Cause**: Ollama not running or not configured.

**Solutions**:

### Option 1: Install Ollama (Local AI)
1. Install Ollama: https://ollama.ai/download
2. Start Ollama:
   ```bash
   ollama serve
   ```
3. Pull a model:
   ```bash
   ollama pull llama3
   ```
4. Add to `.env`:
   ```env
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3
   ```

### Option 2: Use Claude API
1. Get API key from https://console.anthropic.com/
2. Add to `.env`:
   ```env
   ANTHROPIC_API_KEY=sk-ant-...
   ```
   (Note: Claude API integration is planned but not yet implemented)

### Option 3: Use Fallback
If neither is configured, the app uses a structured fallback summary instead of AI generation.

---

## Next.js Build Errors

**Symptom**: `npm run build` fails

**Common Issues**:

### Type Errors
```bash
npm run build
# Look for TypeScript errors
```

**Solution**: Fix TypeScript errors shown in output

### Missing Dependencies
```bash
cd web
npm install
```

### Outdated Dependencies
```bash
cd web
npm update
```

---

## Port Already in Use

**Symptom**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions**:

### Option 1: Kill process on port 3000
```bash
# Find process
lsof -i :3000

# Kill it
kill -9 <PID>
```

### Option 2: Use different port
```bash
PORT=3001 npm run dev
```

---

## Supabase Connection Issues

**Symptom**: `Failed to connect to Supabase`

**Solutions**:

### Check Supabase Status
- Visit https://status.supabase.com/
- Ensure service is operational

### Verify Credentials
1. Double-check `.env` values
2. Ensure no extra spaces or quotes
3. Verify keys are from correct project

### Run Migrations
```bash
cd supabase
npx supabase db push
```

### Check Docker (if using local Supabase)
```bash
cd supabase
docker-compose ps
# All services should be "Up"
```

If services are down:
```bash
docker-compose down
docker-compose up -d
```

---

## Hot Reload Not Working

**Symptom**: Changes don't reflect in browser

**Solutions**:

### Hard Refresh Browser
- Chrome/Edge: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Firefox: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)

### Clear Next.js Cache
```bash
cd web
rm -rf .next
npm run dev
```

### Check File Watchers (Linux)
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## Performance Issues

### Slow Page Loads

**Causes**:
- Playwright scraping is expensive
- Database queries without indexes
- No caching

**Solutions Applied**:
✅ Database indexes added (migration 0009)
✅ Caching layer implemented
✅ Retry logic improved

**Additional Optimizations**:
- Use cached data when available (30-min cache for profiles)
- Limit scraping frequency
- Consider background job processing

### High Memory Usage

**Playwright is memory-intensive**:
- Each browser instance uses ~200-400MB
- Browser instances are properly closed after use
- Consider limiting concurrent scrapes

---

## Getting Help

### Check Logs
```bash
# Development logs
npm run dev

# Production logs (if deployed)
pm2 logs
```

### Enable Debug Mode
Add to `.env`:
```env
DEBUG=true
NODE_ENV=development
```

### Common Log Locations
- **Next.js**: Terminal output
- **Supabase**: Supabase dashboard → Logs
- **Playwright**: Terminal output with `[Skool Fetcher]` prefix

### GitHub Issues
If you encounter a bug:
1. Check existing issues: https://github.com/[your-repo]/issues
2. Create new issue with:
   - Error message
   - Steps to reproduce
   - Environment details (OS, Node version)
   - Relevant logs

---

## Quick Fixes Checklist

Before reporting issues, try:

- [ ] Restart dev server (`npm run dev`)
- [ ] Clear cache (`rm -rf .next`)
- [ ] Reinstall dependencies (`rm -rf node_modules && npm install`)
- [ ] Check `.env` file exists and has correct values
- [ ] Verify internet connection
- [ ] Check Supabase is accessible
- [ ] Update to latest code (`git pull`)
- [ ] Check for Node.js version (requires 20+)

---

## Environment Variables Reference

Required for full functionality:

```env
# Required (Database)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Optional (AI)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# Optional (URLs)
NEXT_PUBLIC_APP_ORIGIN=http://localhost:3000
```

Missing variables will show warnings but won't crash the app in development.

---

## Still Having Issues?

1. **Check IMPROVEMENTS.md** for setup instructions
2. **Check README.md** for getting started guide
3. **Enable verbose logging** to see detailed errors
4. **Try a fresh setup** in a new directory
5. **Open a GitHub issue** with details

Remember: Most issues are environment configuration related. Double-check your `.env` file first!
