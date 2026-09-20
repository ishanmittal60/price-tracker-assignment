# Product Price Tracker

This is a full-stack web application designed to monitor product prices and stock on a specific e-commerce store (`https://demo.inelabteamdev.com/`). It features an Express/Node.js backend with Playwright for scraping, a Supabase PostgreSQL database, and a React (Vite) frontend with Tailwind CSS.

## Getting Started

### Database Setup (Supabase)
1. Create a new Supabase project.
2. Run the SQL commands found in `schema.sql` in the Supabase SQL editor to create the `products`, `price_history`, and `scrape_logs` tables.
3. Retrieve your Supabase URL and Service Role Key.

### Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Install Playwright browsers (if needed):
   ```bash
   npx playwright install chromium
   ```
4. Create a `.env` file in the `backend/` folder:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   PORT=5000
   ```
5. Note: Replace `scraper.js` and `db.js` contents with your existing working code if applicable. The provided files contain basic placeholders.
6. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend/` folder:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

## Key Features
- **Add Products:** Track new products by providing their name and URL.
- **Manual Scraping:** Trigger a headed Playwright instance to scrape product details on demand.
- **Cron Scraping:** Endpoint (`/api/scrape/cron`) ready to be hit by cron-job.org every 2 hours to automate tracking.
- **Price History:** View price and stock trends over time using interactive Recharts graphs.
- **Honest Logging:** View a detailed log of every scrape attempt (success, failure, or retried) for reliable tracking.

## Deployment
- **Frontend:** Ready to be deployed on Vercel. Connect your repository and select the Vite preset.
- **Backend:** Ready to be deployed on Render (Node.js Web Service). Make sure to set up your environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
