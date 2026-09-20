

# Product Price Tracker

A full-stack web application designed to track product prices and stock availability over time from a mock storefront, featuring automated background scheduling, robust error logging, and resilient web scraping.

---

##  Tech Stack

* **Frontend:** React.js (Deployed on Vercel)
* **Backend:** Node.js, Express (Deployed on Render)
* **Database & Storage:** Supabase (PostgreSQL)
* **Scraping Engine:** Playwright (Headless Chromium)
* **Scheduling:** cron-job.org (Scheduled every 2 hours)

---

##  Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/ishanmittal60/price-tracker-assignment.git
cd price-tracker-assignment

```

### 2. Backend Setup

```bash
cd backend
npm install

```

Create a `.env` file inside the `backend` folder with your configuration (see [Environment Variables](https://www.google.com/search?q=%2523-environment-variables&utm_source=gemini)).

Run the backend locally:

```bash
npm run dev

```

### 3. Frontend Setup

```bash
cd ../frontend
npm install

```

Run the frontend locally:

```bash
npm run dev

```

---

##  Scraping Schedule

* **Frequency:** Every 2 hours.
* **Mechanism:** An external cron trigger via [cron-job.org](https://www.google.com/search?q=https://www.cron-job.org&utm_source=gemini) sends an HTTP `GET` request to the backend cron endpoint (`/api/cron`), which loops through all tracked products, executes the Playwright scraper, and records the latest price and stock status in Supabase.

---

##  Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

```

---

##  Design Note & Technical Challenges

### 1. Making Scraping Reliable & Trade-offs Made

* **Trade-off (Playwright vs. Lightweight HTTP):** While lightweight HTTP scrapers (like Axios/Cheerio) are faster and lighter, the target mock store genuinely requires JavaScript execution and interactive mouse movements to unlock hidden prices. Therefore, **Playwright** was chosen to guarantee high correctness over speed.
* **Resilience:** To handle slow responses or missing elements, the scraper includes automated cookie-banner dismissal, bounding-box checks, and a 3-attempt retry loop with backoff. Failures are never hidden and are recorded honestly in the Supabase `scrape_logs` table.

### 2. Technical Difficulties & AI Collaboration Points

During development, collaborating with AI tools helped accelerate problem-solving on specific tricky edge cases:

* **Render Environment Browser Binaries:**
* *The Difficulty:* On the first deployment, Render's container lacked Playwright's Chromium binaries, resulting in `executable not found` errors.
* *The AI Correction:* The AI suggested adding a `"postinstall": "npx playwright install chromium"` script to `package.json` alongside a runtime fallback check to ensure binaries download cleanly on cloud containers.


* **Mock Store Anti-Bot Mouse Requirements:**
* *The Difficulty:* The target store's frontend script tracks mouse coordinates and requires specific minimum move counts and dwell times before enabling the "Reveal Price" button. Standard clicks failed initially.
* *The AI Correction:* AI helped structure the `satisfyPriceInteraction` function to programmatically dispatch throttled `mousemove` and `mouseenter` native DOM events across precise bounding box coordinate ratios, mimicking realistic user interaction.


* **Free-Tier Spin-down Handling:**
* *The Difficulty:* Render's free tier spins down after inactivity, causing initial cron job timeouts.
* *The AI Correction:* AI assisted in designing a lightweight sequential loop with built-in delays in the cron route handler to ensure the server wakes up gracefully and processes requests without crashing under rate limits.
