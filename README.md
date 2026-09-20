# Product Price Tracker

This is a web application that tracks product prices and stock details from a store website (`demo.inelabteamdev.com`). It checks prices automatically in the background, handles website popups and bot checks, and saves the history in a database.

---

## Tech Stack

* **Frontend:** React.js (hosted on Vercel)
* **Backend:** Node.js and Express (hosted on Render)
* **Database:** Supabase (PostgreSQL)
* **Web Scraper:** Playwright (Chromium browser)
* **Scheduler:** cron-job.org (runs every 2 hours)

---

## Setup Instructions

### 1. Download the Project

```bash
git clone https://github.com/ishanmittal60/price-tracker-assignment.git
cd price-tracker-assignment

```

### 2. Backend Setup

```bash
cd backend
npm install

```

* Make a new file named `.env` inside the `backend` folder.
* Add your keys (see the Environment Variables section below).
* Run the backend server:

```bash
npm run dev
# or: node server.js

```

### 3. Frontend Setup

```bash
cd ../frontend
npm install

```

* Run the frontend site:

```bash
npm run dev

```

---

## Scraping Schedule

* **How often it runs:** Every 2 hours.
* **How it works:** A free tool called cron-job.org sends a `POST` request to `https://<your-backend-url>/api/scrape/cron`.
* **Background Work:** Render free servers take time to start, and scraping takes more than 30 seconds. Because cron-job.org stops waiting after 30 seconds, the server sends back a quick success message first and then finishes the scraping work in the background.

---

## Environment Variables

Create a file named `.env` inside your `backend` folder and add this:

```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

```

If you need Supabase directly on the frontend, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `frontend/.env`.

---

## Problems We Faced and Fixed

### 1. Late Cookie Banner Blocking Clicks

* **The Problem:** The store website shows a cookie banner 2 to 5 seconds after the page loads. When our code tried to click the "Reveal Price" button, the cookie banner popped up on top and blocked the click. This made the scraper wait and fail.
* **How We Fixed It:** We wrote a helper function that removes the cookie banner directly from the webpage and adds a rule to hide it before the button is clicked.

### 2. Mouse Movement Checks

* **The Problem:** The website hides the price until a user moves the mouse across the price box. Simple automated clicks did not unlock the price button.
* **How We Fixed It:** We made the mouse move across the price box slowly in small steps. If that does not work, the code sends mouse events directly to the box so the button turns on.

### 3. The 30-Second Timeout

* **The Problem:** cron-job.org gives up and shows an error if the server takes longer than 30 seconds to answer. Because starting Render and scraping products takes longer than that, the tests were failing.
* **How We Fixed It:** We changed the server to answer cron-job.org right away with a 200 OK message, and then it continues scraping the products in the background.
