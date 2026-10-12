# Ajay Job Portal — Advanced Job Portal

A polished, responsive React job-discovery frontend with live job listings from the public Arbeitnow Job Board API.

## Features
- Live job listings fetched from a public jobs API, with clear loading/error states
- Search by job title, company, skills, and location
- Remote-only and employment-type filters
- Sort jobs, paginate results, and view job details
- Save/unsave jobs (persisted in localStorage)
- Saved jobs view
- Apply links open the original employer/job listing
- Responsive layout for desktop, tablet, and mobile
- Demo profile sign-in modal and toast feedback
- Accessible labels, empty states, and refresh control

## Run locally
1. Install Node.js (LTS).
2. Extract this ZIP and open the folder in VS Code.
3. Open Terminal in the project folder and run:

   ```bash
   npm install
   npm run dev
   ```

4. Open the local URL shown by Vite, usually `http://localhost:5173`.

## Live job data
The app requests `https://www.arbeitnow.com/api/job-board-api`. This is a public third-party job board API. Availability, fields, and listing freshness are controlled by that provider; the app cannot guarantee every listing is current or that all locations are covered. If the API is unreachable, the UI shows an error with a retry button.

## Important notes
- The sign-in/profile interaction is a front-end demo only; it does not create secure accounts.
- Saved jobs are stored in this browser's localStorage, not in a database.
- To make a production portal with real authentication, employer posting, applications, and persistent user profiles, connect a backend/database and implement server-side authorization.
# AJAY-JOB-PORTEL-REACT
