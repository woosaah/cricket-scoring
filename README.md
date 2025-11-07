# Cricket Scoring Application 🏏

A comprehensive, mobile-first cricket scoring platform that enables real-time ball-by-ball scoring, tournament management, and detailed player/team statistics.

## Features

### Core Features
- **Player & Team Management**: Create and manage players, teams, and rosters
- **Tournament System**: Create tournaments with customizable formats (T20, T40, T50, custom)
- **Match Setup**: Easy toss recording and match configuration
- **Ball-by-Ball Scoring**: Comprehensive scoring system with:
  - Runs (0-6)
  - Extras (wides, no-balls, byes, leg-byes)
  - Wickets (bowled, caught, LBW, stumped, run out, etc.)
  - Undo functionality
- **Live Scorecard**: Real-time score updates with detailed batting and bowling statistics
- **Tournament Standings**: Automatic points calculation and Net Run Rate (NRR)
- **Leaderboards**: Most runs, most wickets, best bowling figures across tournaments
- **Dark Mode**: Red and black themed UI with team-customizable colors

### Tech Stack

**Backend:**
- Node.js + Express.js + TypeScript
- PostgreSQL database
- Socket.io for real-time updates
- JWT authentication
- RESTful API

**Frontend:**
- React + TypeScript
- Vite build tool
- Tailwind CSS for styling
- Zustand for state management
- React Router for navigation
- Socket.io-client for real-time features

## Installation

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cricket-scoring
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Database**
   - Create a PostgreSQL database named `cricket_scoring`
   - Update `.env` file with your database credentials:
     ```
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=cricket_scoring
     DB_USER=your_username
     DB_PASSWORD=your_password
     ```

4. **Run Database Migration**
   ```bash
   npm run db:migrate
   ```

5. **Start Backend Server**
   ```bash
   npm run dev
   ```
   Backend will run on `http://localhost:5000`

6. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

7. **Start Frontend**
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

## Usage

### First Time Setup

1. **Register/Login**
   - Navigate to `http://localhost:5173`
   - Create an account or login with default credentials:
     - Username: `admin`
     - Password: `admin123`

2. **Create Players**
   - Go to Players page
   - Add players with name, jersey number, and role

3. **Create Teams**
   - Go to Teams page
   - Create teams and add players to them

4. **Create Tournament**
   - Go to Tournaments page
   - Create a tournament with format and rules
   - Add teams to the tournament

5. **Start a Match**
   - From Dashboard or Tournament page, create a match
   - Select teams, format, and venue
   - Record toss decision
   - Begin scoring!

### Scoring a Match

1. **Select Players**
   - Choose striker, non-striker, and bowler

2. **Record Each Ball**
   - Select runs scored (0-6)
   - Or select extras (wide, no-ball, bye, leg-bye)
   - Mark wickets and record dismissal details
   - Click "Record Ball"

3. **View Live Scorecard**
   - Navigate to Live Scorecard view
   - Auto-refreshes every 2 seconds
   - Shows batting and bowling statistics

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register

### Players
- `GET /api/players` - Get all players
- `GET /api/players/:id` - Get player by ID
- `POST /api/players` - Create player
- `PUT /api/players/:id` - Update player
- `DELETE /api/players/:id` - Delete player

### Teams
- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get team by ID
- `POST /api/teams` - Create team
- `PUT /api/teams/:id` - Update team
- `POST /api/teams/:id/players` - Add player to team
- `DELETE /api/teams/:id/players/:playerId` - Remove player from team

### Tournaments
- `GET /api/tournaments` - Get all tournaments
- `GET /api/tournaments/:id` - Get tournament by ID
- `POST /api/tournaments` - Create tournament
- `POST /api/tournaments/:id/teams` - Add team to tournament
- `GET /api/tournaments/:id/leaderboards` - Get tournament leaderboards

### Matches
- `GET /api/matches` - Get all matches
- `GET /api/matches/:id` - Get match by ID
- `POST /api/matches` - Create match
- `POST /api/matches/:id/toss` - Record toss
- `GET /api/matches/:id/scorecard` - Get live scorecard

### Scoring
- `POST /api/scoring/innings` - Start innings
- `POST /api/scoring/overs` - Start over
- `POST /api/scoring/balls` - Record ball
- `GET /api/scoring/innings/:id/state` - Get innings state
- `DELETE /api/scoring/balls/:id` - Undo ball

## Database Schema

Key tables:
- `users` - User accounts
- `players` - Player information
- `teams` - Team information
- `team_players` - Junction table for teams and players
- `tournaments` - Tournament details
- `tournament_teams` - Junction table with standings
- `matches` - Match information
- `innings` - Innings data
- `overs` - Over-by-over data
- `balls` - Ball-by-ball data (most granular)
- `dismissals` - Wicket details
- `partnerships` - Partnership tracking
- `match_results` - Final match results

## Future Enhancements

- [ ] Worm graphs and Manhattan charts
- [ ] Export scorecards to PDF
- [ ] Duckworth-Lewis calculations
- [ ] Super over support
- [ ] Multi-day match support
- [ ] Real-time collaboration with multiple scorers
- [ ] Mobile native app
- [ ] Player rankings and analytics
- [ ] Social sharing features
- [ ] Offline scoring with sync

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for cricket enthusiasts**
