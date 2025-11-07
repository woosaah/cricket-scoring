# Cricket Scoring Application - Setup Guide

## Quick Start Guide

Follow these steps to get your cricket scoring application up and running!

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** (comes with Node.js) or **yarn**

## Step-by-Step Setup

### 1. Database Setup

#### Option A: Using PostgreSQL CLI
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE cricket_scoring;

# Exit psql
\q
```

#### Option B: Using pgAdmin
1. Open pgAdmin
2. Right-click on "Databases"
3. Select "Create" > "Database"
4. Name it `cricket_scoring`
5. Click "Save"

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env file with your database credentials
# (Use your preferred text editor)
nano .env
```

Update the `.env` file with your PostgreSQL credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cricket_scoring
DB_USER=postgres          # Your PostgreSQL username
DB_PASSWORD=your_password # Your PostgreSQL password
```

```bash
# Run database migrations (creates all tables)
npm run db:migrate

# Start the backend server
npm run dev
```

✅ Backend should now be running on `http://localhost:5000`

### 3. Frontend Setup

Open a **new terminal window** and run:

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start the frontend development server
npm run dev
```

✅ Frontend should now be running on `http://localhost:5173`

## First Time Use

### 1. Access the Application
Open your browser and navigate to: `http://localhost:5173`

### 2. Create Your Account
Since this is your first time:
1. Click "Don't have an account? Sign up"
2. Create your admin account
3. You'll be automatically logged in

### 3. Set Up Your Cricket Environment

#### Step 1: Create Players
1. Go to **Players** page
2. Click "Add Player"
3. Add player details:
   - Name
   - Jersey Number
   - Role (Batter/Bowler/All-Rounder/Wicket Keeper)
4. Repeat for all your players

#### Step 2: Create Teams
1. Go to **Teams** page
2. Click "Add Team"
3. Add team details:
   - Team Name
   - City (optional)
   - Primary Color (default: red)
   - Secondary Color (default: black)
4. Click "Manage Players" to add players to the team
5. Repeat for all your teams

#### Step 3: Create a Tournament
1. Go to **Tournaments** page
2. Click "Create Tournament"
3. Fill in tournament details:
   - Tournament Name
   - Format (T20/T40/T50/Custom)
   - Overs per Innings
   - Tournament Type (Round-robin/Knockout)
   - Dates
   - Points System
4. After creating, click on the tournament
5. Add teams to the tournament

#### Step 4: Create and Start a Match
1. From Tournament page, click "Create Match"
2. Select:
   - Home Team
   - Away Team
   - Match Date & Time
   - Venue
3. Click "Create Match"
4. Record the toss:
   - Select toss winner
   - Select bat or bowl
5. Click "Start Match"

### 4. Score a Match

#### Starting Scoring
1. Select the **striker** (first batter)
2. Select the **non-striker** (second batter)
3. Select the **bowler**
4. Click "Start Over"

#### Recording Each Ball
For each delivery:
1. **Select runs** (0, 1, 2, 3, 4, 6) OR
2. **Select extra** (wide, no-ball, bye, leg-bye) with run value OR
3. **Click "Wicket"** and record dismissal details

4. Click **"Record Ball"** to save

#### Key Features During Scoring:
- **Striker rotates** automatically after odd runs
- **Auto-switches** at end of over
- **Undo button** available to reverse last ball
- **Wicket modal** for recording dismissal details
- **Real-time updates** to scorecard

### 5. View Live Scorecard
- Navigate to the match's "Live" view
- Scorecard auto-refreshes every 2 seconds
- Shows:
  - Current score
  - Batting statistics (runs, balls, strike rate)
  - Bowling statistics (overs, wickets, economy)
  - Fall of wickets

## Troubleshooting

### Backend Issues

#### Port 5000 already in use
```bash
# Change PORT in backend/.env
PORT=5001
```

#### Database connection failed
- Verify PostgreSQL is running
- Check credentials in `.env`
- Ensure database `cricket_scoring` exists

#### Migration fails
```bash
# Drop and recreate database
psql -U postgres
DROP DATABASE cricket_scoring;
CREATE DATABASE cricket_scoring;
\q

# Run migration again
cd backend
npm run db:migrate
```

### Frontend Issues

#### Port 5173 already in use
```bash
# Vite will automatically suggest next available port
# Or specify port in vite.config.ts
```

#### API connection errors
- Ensure backend is running on `http://localhost:5000`
- Check `VITE_API_URL` in `frontend/.env`

### Common Issues

#### "No players available"
- Make sure you've created players first
- Verify players are added to teams

#### "Cannot start match"
- Ensure tournament has teams added
- Verify match is created with valid teams

#### Scoring not working
- Check that innings has started
- Verify batters and bowler are selected
- Check browser console for errors

## Development Scripts

### Backend
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm start          # Run production server
npm run db:migrate # Run database migrations
```

### Frontend
```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run preview # Preview production build
```

## Production Deployment

### Environment Variables for Production

#### Backend `.env`
```env
NODE_ENV=production
PORT=5000
DB_HOST=your-production-db-host
DB_NAME=cricket_scoring
DB_USER=your-production-user
DB_PASSWORD=your-production-password
JWT_SECRET=change-this-to-a-long-random-string
CORS_ORIGIN=https://your-frontend-domain.com
```

#### Frontend `.env`
```env
VITE_API_URL=https://your-api-domain.com/api
```

### Build for Production
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## Features Roadmap

### Current (MVP - Ready!)
✅ Player & Team Management
✅ Tournament Creation & Management
✅ Match Setup with Toss
✅ Ball-by-Ball Scoring
✅ Live Scorecard
✅ Tournament Standings
✅ Leaderboards
✅ Authentication
✅ Dark Mode Theme

### Coming Soon
⏳ Worm Graphs & Manhattan Charts
⏳ Export Scorecard to PDF
⏳ Duckworth-Lewis Calculations
⏳ Super Over Support
⏳ Multi-day Matches
⏳ Real-time Multi-user Collaboration
⏳ Partnership Tracking
⏳ Player Career Statistics
⏳ Mobile Native App

## Support

For issues or questions:
1. Check this guide first
2. Review the main README.md
3. Check the database schema in `backend/src/db/schema.sql`
4. Open an issue on GitHub

## Notes

- Default theme: Dark mode with red (#dc2626) and black (#000000)
- Teams can have custom colors configured
- All times are in local timezone
- Database includes comprehensive indexes for performance
- Real-time updates use Socket.io (setup included but not fully implemented)

---

**Enjoy scoring cricket matches! 🏏**
