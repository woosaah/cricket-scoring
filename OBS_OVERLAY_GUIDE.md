# OBS Overlay Guide for Cricket Scoring App

## Overview

The Cricket Scoring App includes a live score overlay perfect for streaming cricket matches on platforms like YouTube, Twitch, or Facebook using OBS Studio.

## Features

- ✅ Real-time score updates (refreshes every 2 seconds)
- ✅ Current score (runs/wickets)
- ✅ Overs bowled
- ✅ Current batsmen with strike rates, runs, balls faced
- ✅ Current bowler with figures and economy
- ✅ Recent balls visualization (last 6 balls)
- ✅ Current run rate and required run rate (for 2nd innings)
- ✅ Live indicator when match is in progress
- ✅ Transparent background for easy chroma keying
- ✅ Beautiful gradient design with team colors

## Setup Instructions

### Step 1: Get Your Match ID

1. Start scoring a match in the Cricket Scoring App
2. Note the match ID from the URL (e.g., `/matches/5/scoring` → Match ID is `5`)

### Step 2: Set Up OBS

1. **Open OBS Studio**

2. **Add Browser Source:**
   - Click the `+` button in the Sources panel
   - Select "Browser"
   - Name it "Cricket Score Overlay"

3. **Configure the Browser Source:**
   - **URL**: `http://localhost:5173/obs-overlay.html?match=YOUR_MATCH_ID`
     - Replace `YOUR_MATCH_ID` with your actual match ID
     - Example: `http://localhost:5173/obs-overlay.html?match=5`

   - **Width**: `1920`
   - **Height**: `1080`

   - ✅ **Check** "Shutdown source when not visible" (saves resources)
   - ✅ **Check** "Refresh browser when scene becomes active"

4. **Click OK**

### Step 3: Position and Style

1. Resize and position the overlay on your scene
2. The scoreboard appears in the **bottom-left corner** by default
3. You can move it anywhere on your stream canvas

### Advanced Configuration

#### Custom API URL (for production/remote servers)

If your backend is running on a different server:

```
http://localhost:5173/obs-overlay.html?match=5&api=https://your-api-domain.com
```

#### Multiple Match Overlays

You can add multiple browser sources for different matches:
- Match 1: `?match=1`
- Match 2: `?match=2`

#### Custom Refresh Rate

To modify the refresh interval, edit the `obs-overlay.html` file:
```javascript
setInterval(updateScore, 2000);  // Change 2000 to desired milliseconds
```

## Overlay Display Elements

### 1. Live Indicator
- Animated "LIVE" badge when match is in progress
- Red pulsing animation

### 2. Match Header
- Team names
- Match format (T20, T40, T50)
- Venue name

### 3. Score Display
- **Large Score**: Current runs/wickets
- **Overs**: Balls bowled (e.g., 15.3 overs)
- **CRR**: Current run rate
- **RRR**: Required run rate (2nd innings only)

### 4. Batsmen Cards
- Batsman name
- Runs scored (balls faced)
- Strike rate
- Fours and sixes

### 5. Current Bowler
- Bowler name with 🎯 icon
- Overs bowled
- Wickets/runs conceded
- Economy rate

### 6. Recent Balls
- Visual representation of last 6 balls
- Color-coded:
  - **Red**: Six
  - **Amber**: Four
  - **Red with white border**: Wicket
  - **Green**: Dot ball
  - **Blue**: 1-3 runs
  - **Purple**: Extras

## Troubleshooting

### Overlay not showing

1. **Check URL**: Ensure match ID is correct
2. **Check API URL**: Ensure `api` parameter points to your backend
3. **Check CORS**: Backend should allow CORS for `*` or your OBS domain

### Overlay not updating

1. **Match is running**: Ensure the match status is "in_progress"
2. **Balls are being recorded**: Score the next ball to see update
3. **Refresh the browser source**: Right-click → Refresh

### Performance issues

1. **Lower refresh rate**: Change from 2000ms to 5000ms
2. **Reduce overlay size**: Use smaller dimensions (1280x720)
3. **Hide when not needed**: Use OBS scene switching

## Customization

### Changing Colors

Edit the `obs-overlay.html` file:

```css
.scoreboard {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.95), rgba(0, 0, 0, 0.95));
  border: 2px solid rgba(220, 38, 38, 0.3);
}
```

### Changing Position

Modify the CSS:

```css
.scoreboard {
  /* Bottom-left (default) */
  bottom: 20px;
  left: 20px;

  /* Or top-right */
  /* top: 20px;
  right: 20px; */
}
```

### Changing Size

```css
.scoreboard {
  min-width: 500px;  /* Adjust width */
  padding: 20px;     /* Adjust padding */
}
```

## API Endpoint

The overlay uses this API endpoint:

```
GET /api/overlay/match/:id/live
```

**Response:**
```json
{
  "match": {
    "id": 1,
    "home_team": "Team A",
    "away_team": "Team B",
    "format": "T20",
    "status": "in_progress",
    "venue": "MCG"
  },
  "innings": {
    "number": 1,
    "batting_team": "Team A",
    "runs": 145,
    "wickets": 5,
    "overs": 18.3,
    "current_run_rate": "7.89",
    "required_run_rate": null
  },
  "batsmen": [...],
  "current_bowler": {...},
  "recent_balls": [...],
  "timestamp": "2025-01-19T12:00:00.000Z"
}
```

## Production Deployment

### For Remote Streaming

1. **Deploy Backend**: Deploy your backend to a server (e.g., Heroku, Railway, AWS)
2. **Update URL**: Use your production API URL
   ```
   https://your-app.com/obs-overlay.html?match=5&api=https://your-api.com
   ```

3. **Enable CORS**: Ensure backend allows all origins or specific OBS origins

4. **Use HTTPS**: OBS works best with HTTPS URLs for browser sources

### Embedding on Website

You can also embed the overlay on your website:

```html
<iframe
  src="https://your-app.com/obs-overlay.html?match=5"
  width="600"
  height="400"
  frameborder="0"
  style="background: transparent;"
></iframe>
```

## Tips for Best Results

1. **Test Before Going Live**: Always test overlay in OBS before streaming
2. **Have Backup**: Create multiple scenes with and without overlay
3. **Check Alignment**: Ensure overlay doesn't cover important video content
4. **Monitor Performance**: Check CPU usage in OBS
5. **Refresh Between Matches**: Refresh browser source when switching matches

## Support

For issues or questions:
- Check the main README.md
- Review API documentation
- Ensure all services are running (backend on :5000, frontend on :5173)

---

**Enjoy streaming your cricket matches! 🏏📺**
