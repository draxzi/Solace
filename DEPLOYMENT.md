# Deployment Guide

## Production Deployment

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Groq API key](https://console.groq.com/) (free tier available)

### Environment Setup

Create a `.env` file in `artifacts/api-server/`:

```env
GROQ_API_KEY=your_groq_api_key_here
PORT=8080
NODE_ENV=production
```

### Build

```bash
# Install dependencies
pnpm install

# Build both frontend and backend
pnpm run build
```

### Deploy on Vercel (Frontend)

1. Connect your GitHub repository to Vercel
2. Configure build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `pnpm run build`
   - **Output Directory**: `artifacts/solace/dist`
   - **Root Directory**: `artifacts/solace`

3. Add environment variables if needed

### Deploy on Render/Railway (Backend)

The API server can be deployed to any Node.js hosting platform:

**Render:**
1. Connect GitHub repo
2. Create new Web Service
3. Set build command: `pnpm install && pnpm run build`
4. Set start command: `node --enable-source-maps ./dist/index.mjs`
5. Add environment variable: `GROQ_API_KEY`

**Railway:**
1. Connect GitHub repo
2. Add environment variable: `GROQ_API_KEY`
3. Railway auto-detects Node.js and runs build

**Other Options:** Docker, Heroku, AWS Lambda, Google Cloud Run

### Docker Deployment

```dockerfile
FROM node:20-alpine
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy files
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm run build

# Start
CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
```

Build and deploy:
```bash
docker build -t solace .
docker run -p 8080:8080 -e GROQ_API_KEY=your_key solace
```

### Production Checklist

- [ ] API server deployed and running
- [ ] Frontend deployed to Vercel/similar
- [ ] Environment variables configured
- [ ] CORS settings correct
- [ ] SSL/HTTPS enabled
- [ ] Error logging configured (optional: Sentry, LogRocket)
- [ ] Monitoring/uptime checks enabled
- [ ] Backup plan for API key rotation

### Monitoring

Monitor API health:
```bash
curl https://your-api-domain/api/healthz
```

Expected response:
```json
{ "status": "ok" }
```

### Scaling

- **Frontend**: CDN automatically scales on Vercel
- **Backend**: Use horizontal scaling with load balancer for high traffic
- **Groq API**: Rate-limited on free tier; upgrade for production traffic

---

For issues or questions, see [README.md](./README.md)
