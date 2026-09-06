<div align="center">
  <img src="./src/assets/LEAD.png" alt="LEAD Logo" width="150"/>
  <h1>LEAD Society Official Website</h1>
  <p><strong>Learn - Emerge - Aspire - Discover</strong></p>
  <p>The premier student-run organization at Thapar Institute of Engineering and Technology (TIET), Patiala, bridging technical engineering, holistic development, and industry collaboration.</p>
</div>

---

## Overview

Welcome to the official repository for the LEAD 2026 website. Built with a modern, cosmic-themed aesthetic, this platform serves as the digital hub for the society's activities, flagship initiatives, and executive roster. It features interactive 3D WebGL elements and a custom AI console assistant, engineered to provide a seamless and highly engaging user experience.

## Key Features

- **Interactive AI Console Assistant**: A custom-built floating widget powered by the Groq API. It acts as an intelligent console capable of answering user queries about LEAD's events, team, and recruitment in real-time.
- **Immersive 3D WebGL Environments**: Custom Three.js implementations, including a dynamic 3D point-cloud starfield and a highly interactive Gallery Tunnel.
- **Custom Video Preloader**: A hardware-accelerated, intelligently cached video intro sequence that flawlessly transitions into the React application while handling network latency gracefully.
- **Lightning-Fast SPA**: Built on Vite and React with robust client-side routing via React Router DOM.
- **Modern UI/UX**: Sleek dark mode aesthetics featuring glassmorphism, responsive grids, and smooth micro-interactions across all devices.

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router DOM v6
- **3D Graphics**: Three.js & WebGL
- **Icons**: Lucide React
- **AI Integration**: Groq API
- **Deployment**: Netlify

## Local Development

To run this project locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/LEAD-Society-Thapar/Lead-2026-official.git
   cd Lead-2026-official
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add the required API keys (necessary for the AI Console Assistant and the Contact Form to function):
   ```env
   VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
   VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
   VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
   VITE_GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## Project Structure

- `src/components/`: Reusable global UI components (SiteNav, Preloader, CommandPalette).
- `src/sections/`: The core views of the application:
  - **Home**: The landing view featuring the interactive 3D Particle Cube.
  - **Events**: Highlights and details of our flagship initiatives (Matrix 4.0, Seaferno, Leadcode).
  - **Team**: The executive board and leadership roster.
  - **Sponsors**: Our network and partners, featuring an interactive Arc Reactor UI.
  - **Gallery**: A WebGL immersive tunnel showcasing our past events.
  - **Contact**: Direct communication channel via EmailJS integration.
  - **NotFound**: Custom 404 handler with an integrated 3D starfield.
- `src/data/`: Centralized JSON/JS data for team members, sponsors, and events.
- `src/utils/`: Helper functions, including asset prefetching logic.

## Production & Deployment

This project is configured for automated CI/CD via Netlify.

- **Build command**: `npm run build`
- **Publish directory**: `dist`

The repository includes a `netlify.toml` and `public/_redirects` file to ensure SPA routing fallbacks (`/* -> /index.html 200`) function correctly in production.

### Custom Domain setup (leadtiet.in)
The DNS is configured to point to Netlify's load balancers. If modifications are needed in the future:
- `A` record for `@` -> `75.2.60.5`
- `A` record for `@` -> `99.83.190.102`
- `CNAME` for `www` -> `<netlify-subdomain>.netlify.app`

## Connect with LEAD

- **Email**: [lead_sc@thapar.edu](mailto:lead_sc@thapar.edu)
- **Instagram**: [@lead_tiet](https://instagram.com/lead_tiet)
