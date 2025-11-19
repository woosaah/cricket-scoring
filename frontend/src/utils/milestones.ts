// Cricket milestone detection and notifications

export interface Milestone {
  type: 'batting' | 'bowling' | 'fielding'
  category: string
  description: string
  player: string
  value: number
  icon: string
  color: string
}

// Batting milestones
export const checkBattingMilestones = (
  playerName: string,
  currentRuns: number,
  previousRuns: number,
  balls: number,
  fours: number,
  sixes: number
): Milestone[] => {
  const milestones: Milestone[] = []

  // Run milestones
  const runMilestones = [50, 100, 150, 200, 250, 300]
  runMilestones.forEach((milestone) => {
    if (currentRuns >= milestone && previousRuns < milestone) {
      milestones.push({
        type: 'batting',
        category: 'runs',
        description: `${playerName} reaches ${milestone} runs!`,
        player: playerName,
        value: milestone,
        icon: '🎉',
        color: '#dc2626',
      })
    }
  })

  // Century (100) gets special celebration
  if (currentRuns >= 100 && previousRuns < 100) {
    milestones.push({
      type: 'batting',
      category: 'century',
      description: `🏏 CENTURY! ${playerName} scores 100 runs!`,
      player: playerName,
      value: 100,
      icon: '💯',
      color: '#dc2626',
    })
  }

  // Double century
  if (currentRuns >= 200 && previousRuns < 200) {
    milestones.push({
      type: 'batting',
      category: 'double_century',
      description: `⭐ DOUBLE CENTURY! ${playerName} reaches 200!`,
      player: playerName,
      value: 200,
      icon: '🌟',
      color: '#dc2626',
    })
  }

  // Strike rate milestones (min 20 balls)
  if (balls >= 20) {
    const strikeRate = (currentRuns / balls) * 100

    if (strikeRate >= 200 && previousRuns < balls * 2) {
      milestones.push({
        type: 'batting',
        category: 'strike_rate',
        description: `⚡ ${playerName} striking at ${strikeRate.toFixed(0)}!`,
        player: playerName,
        value: strikeRate,
        icon: '⚡',
        color: '#f59e0b',
      })
    }
  }

  // Six-hitting milestones
  const sixMilestones = [5, 10, 15, 20]
  sixMilestones.forEach((milestone) => {
    if (sixes >= milestone && sixes - 1 < milestone) {
      milestones.push({
        type: 'batting',
        category: 'sixes',
        description: `💥 ${playerName} hits ${milestone}th six!`,
        player: playerName,
        value: milestone,
        icon: '🚀',
        color: '#8b5cf6',
      })
    }
  })

  return milestones
}

// Bowling milestones
export const checkBowlingMilestones = (
  playerName: string,
  currentWickets: number,
  previousWickets: number,
  runs: number,
  overs: number
): Milestone[] => {
  const milestones: Milestone[] = []

  // Wicket milestones
  if (currentWickets >= 3 && previousWickets < 3) {
    milestones.push({
      type: 'bowling',
      category: 'wickets',
      description: `🎯 ${playerName} takes 3rd wicket!`,
      player: playerName,
      value: 3,
      icon: '🎯',
      color: '#3b82f6',
    })
  }

  // 5-wicket haul (fifer)
  if (currentWickets >= 5 && previousWickets < 5) {
    milestones.push({
      type: 'bowling',
      category: 'fifer',
      description: `🌟 FIVE-FOR! ${playerName} takes 5 wickets!`,
      player: playerName,
      value: 5,
      icon: '🔥',
      color: '#3b82f6',
    })
  }

  // 10-wicket haul (extremely rare)
  if (currentWickets >= 10 && previousWickets < 10) {
    milestones.push({
      type: 'bowling',
      category: 'ten_wickets',
      description: `⭐⭐ LEGENDARY! ${playerName} takes 10 wickets!`,
      player: playerName,
      value: 10,
      icon: '👑',
      color: '#3b82f6',
    })
  }

  // Hat-trick detection would require ball-by-ball data
  // Economy milestones (min 3 overs)
  if (overs >= 3) {
    const economy = runs / overs

    if (economy <= 4.0) {
      milestones.push({
        type: 'bowling',
        category: 'economy',
        description: `🛡️ ${playerName} bowling at ${economy.toFixed(2)} economy!`,
        player: playerName,
        value: economy,
        icon: '🛡️',
        color: '#22c55e',
      })
    }
  }

  return milestones
}

// Fielding milestones
export const checkFieldingMilestones = (
  playerName: string,
  catches: number,
  runOuts: number,
  stumpings: number
): Milestone[] => {
  const milestones: Milestone[] = []

  const totalDismissals = catches + runOuts + stumpings

  // Catch milestones
  const catchMilestones = [3, 5]
  catchMilestones.forEach((milestone) => {
    if (catches >= milestone && catches - 1 < milestone) {
      milestones.push({
        type: 'fielding',
        category: 'catches',
        description: `🧤 ${playerName} takes ${milestone} catches!`,
        player: playerName,
        value: milestone,
        icon: '🧤',
        color: '#f59e0b',
      })
    }
  })

  return milestones
}

// Match milestones
export const checkMatchMilestones = (
  teamName: string,
  runs: number,
  wickets: number,
  overs: number
): Milestone[] => {
  const milestones: Milestone[] = []

  // Team score milestones
  const scoreMilestones = [100, 200, 300, 400, 500]
  scoreMilestones.forEach((milestone) => {
    const previousRuns = runs - 10 // Approximate check
    if (runs >= milestone && previousRuns < milestone) {
      milestones.push({
        type: 'batting',
        category: 'team_score',
        description: `${teamName} reaches ${milestone} runs!`,
        player: teamName,
        value: milestone,
        icon: '🎊',
        color: '#dc2626',
      })
    }
  })

  return milestones
}

// Format milestone message for toast
export const formatMilestoneMessage = (milestone: Milestone): string => {
  return `${milestone.icon} ${milestone.description}`
}
