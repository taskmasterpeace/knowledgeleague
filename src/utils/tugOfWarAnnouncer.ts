import type { AnnouncerLine } from './announcer'

export function superPullLine(teamNum: number): AnnouncerLine {
  return { text: `SUPER PULL! Team ${teamNum} is dragging them!`, priority: 'high' }
}

export function momentumShiftLine(): AnnouncerLine {
  return { text: 'The tide is turning!', priority: 'high' }
}

export function nearlyWonLine(): AnnouncerLine {
  return { text: "They're on the edge! One more pull!", priority: 'high' }
}

export function comebackLine(): AnnouncerLine {
  return { text: 'WHAT A COMEBACK!', priority: 'high' }
}
