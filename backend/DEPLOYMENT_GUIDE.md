# Deployment Guide

## Pre-Deployment Checklist

- [x] Supabase configured with credentials
- [x] Database schema created
- [x] RLS policies enabled
- [x] Backend functions integrated
- [x] API endpoints tested
- [ ] Environment variables set in production
- [ ] Backend deployed to hosting service

## Environment Variables

Make sure these are set in your production environment:

```env
PORT=3000
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Deployment Options

### Option 1: Railway

1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Set environment variables in Railway dashboard
5. Deploy: `railway up`

### Option 2: Render

1. Connect GitHub repository
2. Create new Web Service
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables in dashboard
6. Deploy

### Option 3: Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Launch: `fly launch`
4. Set secrets: `fly secrets set SUPABASE_URL=... SUPABASE_ANON_KEY=...`
5. Deploy: `fly deploy`

### Option 4: Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create sukai-backend`
4. Set config vars:
   ```bash
   heroku config:set SUPABASE_URL=...
   heroku config:set SUPABASE_ANON_KEY=...
   heroku config:set SUPABASE_SERVICE_ROLE_KEY=...
   ```
5. Deploy: `git push heroku main`

### Option 5: Vercel (Serverless Functions)

1. Install Vercel CLI: `npm i -g vercel`
2. Create `vercel.json`:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "src/server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "src/server.js"
       }
     ]
   }
   ```
3. Deploy: `vercel`

## Post-Deployment

1. **Update Mobile App API URLs**
   - Update `baseUrl` in:
     - `mobile/lib/services/triage_service.dart`
     - `mobile/lib/services/chat_service.dart`
     - `mobile/lib/services/billing_service.dart`

2. **Test Production Endpoints**
   ```bash
   curl https://your-backend-url.com/health
   curl https://your-backend-url.com/api/triage/assess \
     -H "Content-Type: application/json" \
     -d '{"session_id": "test", "symptom": "ปวดหัว"}'
   ```

3. **Monitor Logs**
   - Check application logs for errors
   - Monitor Supabase dashboard for database activity

4. **Set Up Monitoring**
   - Add error tracking (Sentry, etc.)
   - Set up uptime monitoring
   - Configure alerts

## Security Checklist

- [ ] Never commit `.env` file
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS in production
- [ ] Set up CORS properly for production domain
- [ ] Review RLS policies
- [ ] Set up rate limiting
- [ ] Enable Supabase database backups

## Database Backup

Supabase automatically backs up your database, but you can also:

1. Go to Supabase Dashboard → Database → Backups
2. Set up scheduled backups
3. Export schema: `pg_dump` via Supabase CLI

## Scaling Considerations

- **Database**: Supabase handles scaling automatically
- **Backend**: Consider horizontal scaling if traffic increases
- **Caching**: Add Redis for session storage if needed
- **CDN**: Use CDN for static assets

## Troubleshooting

### Database Connection Issues
- Verify environment variables are set correctly
- Check Supabase project is active
- Verify network connectivity

### API Errors
- Check application logs
- Verify Supabase RLS policies
- Test endpoints individually

### Performance Issues
- Check database query performance
- Review indexes
- Monitor Supabase dashboard metrics

## Support

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Project Docs: See `/docs` folder

