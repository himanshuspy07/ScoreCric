# **App Name**: ScoreCric PWA

## Core Features:

- Match Initialization: Set up a new cricket match by defining format (e.g., T20), team names, player rosters, and toss outcome.
- Ball-by-Ball Scoring Interface: An intuitive interface to record each delivery, including runs scored (0,1,2,3,4,6), extras (wides, no-balls, byes, leg-byes), and wickets fallen, with automatic statistics updates.
- Real-time Scorecard Display: Dynamically updated display of batting, bowling, and team summaries during an active match, including total score, wickets, overs, and individual player stats.
- Offline Match Saving & Resumption: Ability to save the progress of any ongoing match locally to IndexedDB and resume it later, ensuring continuous scoring even without internet access.
- Comprehensive Match Summary: Upon match completion, generate and display a full scorecard for both teams, including detailed statistics and the ability to select a 'Man of the Match'.
- PWA Offline & Installability: Core Progressive Web App functionality, enabling the app to be installable to the home screen and function entirely offline through service worker caching.
- Responsive UI with Dark Mode: A modern, mobile-first responsive design that adapts to various screen sizes and offers a toggleable dark mode for enhanced user experience and preference.

## Style Guidelines:

- Primary color: A balanced, earthy deep green (#2C5A37), evoking the cricket pitch and natural elements, providing a strong anchor for interactive elements and headings in the light theme.
- Background color: A very subtle, almost off-white with a hint of green (#F3FAF4), creating a clean and spacious canvas for legibility in the light theme.
- Accent color: A vibrant lime green (#4AC219), used sparingly for crucial calls to action, highlights, and status indicators, providing visual punch and contrast.
- Body and headline font: 'Inter' (sans-serif) for its modern, neutral, and highly legible characteristics, ensuring clarity across all score data and navigational text.
- Utilize clear and minimalist vector-based icons for navigation (Scoreboard, Batting, Bowling, Info) and match actions (runs, wickets), ensuring quick recognition and ease of use.
- Mobile-first responsive design with clearly delineated sections for score information and match controls. Navigation via bottom tabs for easy access on small screens. A persistent footer with the text 'Made by Himanshu Yadav' will be visible on all pages.
- Subtle and quick transitions between views and instant feedback animations on score-entry actions, providing a smooth and responsive user experience without being distracting.