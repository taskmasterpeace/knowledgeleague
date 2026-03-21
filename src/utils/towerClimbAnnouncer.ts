import type { AnnouncerLine } from './announcer'

export function blockPlacedLine(name: string): AnnouncerLine {
  const lines = ['Another brick!', `${name}'s tower is rising!`]
  return { text: lines[Math.floor(Math.random() * lines.length)], priority: 'low' }
}

export function missileLaunchedLine(name: string): AnnouncerLine {
  return { text: `THREE IN A ROW! ${name} launched a MISSILE!`, priority: 'high' }
}

export function towerWobblingLine(name: string): AnnouncerLine {
  const lines = [
    `Whoa, ${name}'s tower is looking SHAKY!`,
    "Careful! That thing's about to crumble!",
  ]
  return { text: lines[Math.floor(Math.random() * lines.length)], priority: 'normal' }
}

export function blockFellLine(name: string): AnnouncerLine {
  const lines = [
    'OH NO it crumbled! That\'s what happens when you guess!',
    `Down goes a block! Slow down, ${name}!`,
  ]
  return { text: lines[Math.floor(Math.random() * lines.length)], priority: 'normal' }
}

export function missileHitLine(name: string): AnnouncerLine {
  const lines = [`DIRECT HIT on ${name}!`, `BOOM! ${name} just lost a block!`]
  return { text: lines[Math.floor(Math.random() * lines.length)], priority: 'high' }
}

export function tallestTowerLine(name: string): AnnouncerLine {
  return { text: `New leader! ${name}'s tower is the tallest!`, priority: 'normal' }
}

export function neckAndNeckLine(): AnnouncerLine {
  return { text: "It's a RACE to the top! Who's gonna finish first?!", priority: 'high' }
}

export function almostWonLine(name: string): AnnouncerLine {
  return { text: `ONE MORE BLOCK! ${name} is about to win this!`, priority: 'high' }
}

export function towerVictoryLine(name: string): AnnouncerLine {
  return { text: `TOWER COMPLETE! ${name} wins it! Ten blocks TALL!`, priority: 'high' }
}

export function missileFizzleLine(): AnnouncerLine {
  return { text: 'Missile wasted! Nothing to hit!', priority: 'low' }
}
