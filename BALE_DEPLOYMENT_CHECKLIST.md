# Bale Bot Integration - Deployment Checklist

## Quick Start (5 minutes)

### ✅ Step 1: Deploy Code
Files already created (no build needed):
- ✅ `src/types/bale.ts` - Type definitions
- ✅ `src/lib/baleService.ts` - API client
- ✅ `src/lib/baleMessageHandler.ts` - Business logic
- ✅ `src/app/api/webhook/bale/route.ts` - Webhook endpoint
- ✅ `database/migrations/add_bale_chat_id_index.sql` - Database indexes

Next: Deploy these files to your server

### ✅ Step 2: Database Migration
```bash
# Connect to PostgreSQL and run migration
psql -d kama -f database/migrations/add_bale_chat_id_index.sql

# Verify indexes created
psql -d kama -c "\di idx_users_profile*"
# Should see 3 indexes created
```

### ✅ Step 3: Health Check
```bash
# Test webhook endpoint is running
curl https://yourdomain.com/api/webhook/bale

# Expected response:
# {
#   "status": "active",
#   "service": "Bale Webhook",
#   "timestamp": "2026-02-10T12:00:00Z"
# }
```

### ✅ Step 4: Principal Setup
1. Principal logs into web app
2. Goes to Settings → Profile
3. Enters Bale bot credentials:
   - `bale_api_key`: Bot token from Bale
   - `bale_bot_id`: Bot ID (optional)
4. Saves settings

### ✅ Step 5: Register Webhook with Bale
For each school (replace `{BOT_TOKEN}` with actual token):

```bash
# Register webhook
curl -X POST "https://tapi.bale.ai/bot{BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://yourdomain.com/api/webhook/bale"}'

# Verify
curl "https://tapi.bale.ai/bot{BOT_TOKEN}/getWebhookInfo"
```

### ✅ Step 6: Test
1. Send message from Bale as teacher
2. Check response appears within 3-5 seconds
3. Verify role-appropriate response (should match role prompt)

---

## Pre-Deployment Checklist

- [ ] All 5 new files created
- [ ] No TypeScript compilation errors: `npm run lint`
- [ ] Database connection string in `.env`
- [ ] OPENAI_API_KEY set (or LOCAL_AI_BASE_URL)
- [ ] Bale bot API key obtained

## Deployment Checklist

- [ ] Code deployed to production
- [ ] Database migration applied
- [ ] Health check passes: `GET /api/webhook/bale`
- [ ] Webhook registered with Bale
- [ ] Principal credentials configured

## Post-Deployment Checklist

- [ ] Send test message as teacher → Response received
- [ ] Send test message as student → Response received
- [ ] Verify typing indicator appears
- [ ] Check logs for `[Bale Webhook]` messages
- [ ] Monitor for errors in first 24 hours
- [ ] Test with long message (>2000 chars)

## Rollback Plan

If issues occur:

1. **Disable webhook** (in Bale settings or database):
   ```sql
   -- Temporarily disable by removing bot token
   UPDATE users SET profile = jsonb_set(profile, '{bale_api_key}', 'null'::jsonb)
   WHERE role = 'principal' AND school_id = 'school_id';
   ```

2. **Revert code** (if needed):
   ```bash
   git revert HEAD  # Revert last commit with Bale code
   npm run build && npm start
   ```

3. **Revert migration** (if database issues):
   ```sql
   DROP INDEX IF EXISTS idx_users_profile_bale_chat_id;
   DROP INDEX IF EXISTS idx_users_profile_telegram_chat_id;
   DROP INDEX IF EXISTS idx_users_school_id_role_bale_key;
   ```

## Troubleshooting During Deployment

### Webhook Not Responding
```bash
# Check if route is accessible
curl -v https://yourdomain.com/api/webhook/bale

# Check server logs for errors
tail -f /var/log/app.log | grep Bale
```

### Database Migration Failed
```bash
# Verify tables exist
psql -d kama -c "\dt users"

# Check current indexes
psql -d kama -c "\di"

# Try migration again
psql -d kama -f database/migrations/add_bale_chat_id_index.sql
```

### Messages Not Working
1. Verify principal has set `bale_api_key`: `SELECT profile FROM users WHERE role = 'principal' LIMIT 1;`
2. Verify user's `bale_chat_id` is stored: `SELECT profile FROM users WHERE id = 'user_id';`
3. Check AI service is working: `GET /api/ai-chat` (test endpoint)

## Monitoring in First 24 Hours

Watch for these logs:
```
[Bale Webhook] Received message from chat
[Bale Webhook] Identified user
[Bale Webhook] Successfully sent response
```

If you see errors like:
```
[Bale Webhook] Unknown user with chat ID
[Bale Webhook] No bot token for school
[Bale Webhook] Failed to process message with AI
```

Then follow troubleshooting in the main guide: `docs/BALE_BOT_INTEGRATION.md`

---

## Files Summary

| File | Purpose | Size |
|------|---------|------|
| `src/types/bale.ts` | TypeScript types | 1.3 KB |
| `src/lib/baleService.ts` | Bale API client | 4.5 KB |
| `src/lib/baleMessageHandler.ts` | Message logic | 5.2 KB |
| `src/app/api/webhook/bale/route.ts` | Webhook endpoint | 3.8 KB |
| `database/migrations/add_bale_chat_id_index.sql` | DB indexes | 1.2 KB |
| **Total** | **All new code** | **~16 KB** |

## Next Steps

1. **Deploy** the 5 new files to production
2. **Run** the database migration
3. **Configure** principal credentials
4. **Test** with real messages
5. **Monitor** logs for 24 hours
6. **Refer** to `docs/BALE_BOT_INTEGRATION.md` for detailed docs

---

**Estimated Deployment Time**: 30 minutes (including testing)
**Production Ready**: ✅ Yes
**Support Documentation**: `docs/BALE_BOT_INTEGRATION.md`
