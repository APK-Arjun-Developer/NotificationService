# Notification Service

Production-ready notification microservice built with Node.js + TypeScript.

**Currently active:** Email via Gmail SMTP (App Password — free)  
**Ready to plug in:** SMS (Twilio), Push (Firebase FCM), WhatsApp (Meta Cloud API)

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in your values
cp .env.example .env

# 3. Run in dev mode (hot reload)
npm run dev
```

---

## Gmail App Password setup (free, takes 2 minutes)

1. Go to your Google Account → **Security**
2. Enable **2-Step Verification** (required)
3. Search for **"App passwords"** in the search bar
4. Select **Mail** → **Other** → name it "Notification Service"
5. Copy the 16-character password
6. Paste it as `SMTP_APP_PASSWORD` in `.env` (spaces are fine, Gmail ignores them)

---

## API usage

All requests need: `x-api-key: <your API_KEY from .env>`

### Send a single email

```bash
curl -X POST http://localhost:3001/notify \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key-here" \
  -d '{
    "channel": "email",
    "to": "user@example.com",
    "subject": "Welcome!",
    "html": "<h1>Hello from the notification service</h1>",
    "priority": "high"
  }'
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "jobId": "1",
  "channel": "email",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Send to multiple recipients

```json
{
  "channel": "email",
  "to": ["user1@example.com", "user2@example.com"],
  "subject": "Important update",
  "html": "<p>Hi team!</p>"
}
```

### Batch send (up to 1000)

```bash
curl -X POST http://localhost:3001/notify/batch \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key-here" \
  -d '[
    { "channel": "email", "to": "a@example.com", "subject": "Hi A", "html": "<p>Hello A</p>" },
    { "channel": "email", "to": "b@example.com", "subject": "Hi B", "html": "<p>Hello B</p>" }
  ]'
```

### Health check (no auth required)

```bash
curl http://localhost:3001/health
```

---

## Call from .NET 10

```csharp
// Program.cs
builder.Services.AddHttpClient<NotificationClient>(client => {
    client.BaseAddress = new Uri("http://localhost:3001");
    client.DefaultRequestHeaders.Add("x-api-key", config["Notifications:ApiKey"]);
});

// NotificationClient.cs
public class NotificationClient(HttpClient http)
{
    public Task<HttpResponseMessage> SendEmailAsync(string to, string subject, string html) =>
        http.PostAsJsonAsync("/notify", new { channel = "email", to, subject, html });
}
```

---

## Adding a new channel (e.g. SMS)

1. Copy `src/channels/sms.provider.stub.ts` → `src/channels/sms.provider.ts`
2. Uncomment and fill in the code
3. Add `'sms'` to `NotificationChannel` in `notification.types.ts`
4. Add `SmsNotification` interface and add to `NotificationPayload` union
5. Add `TWILIO_*` vars to `env.ts` schema and `.env`
6. Uncomment `SmsSchema` in `validate.middleware.ts`
7. Uncomment `case 'sms'` in `notification.processor.ts`
8. Done — no other files need to change

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run compiled production build |
| `npm test` | Run Jest tests |
| `npm run lint` | ESLint check |
| `npm run typecheck` | Type-check without emitting |

---

## Production deploy (GitHub Actions)

Pushes to **`main`** auto-deploy via SSH + PM2.

1. Configure [GitHub Actions secrets](docs/DEPLOY.md) (SSH + SMTP + `API_KEY`, etc.)
2. Prepare your server (Node 20, PM2)
3. Push to `main` — or run **Actions → Deploy to Production → Run workflow**

See **[docs/DEPLOY.md](docs/DEPLOY.md)** for the full secret list and server setup.
