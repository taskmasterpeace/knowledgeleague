import type { AnnouncerLine } from './announcer'

export function bigJumpLine(name: string): AnnouncerLine {
  const lines = [`Huge leap! ${name} is SPRINTING!`, `${name} just covered serious ground!`]
  return { text: lines[Math.floor(Math.random() * lines.length)], priority: 'normal' }
}

export function fallingBehindLine(name: string): AnnouncerLine {
  return { text: `${name} is falling behind! Can they catch up?`, priority: 'low' }
}

export function finalStretchLine(name: string): AnnouncerLine {
  return { text: `${name} can see the finish line!`, priority: 'high' }
}

export function photoFinishLine(): AnnouncerLine {
  return { text: "It's gonna be a PHOTO FINISH!", priority: 'high' }
}
