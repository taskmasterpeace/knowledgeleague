import { useGameState } from './hooks/useGameState'
import { Menu } from './components/Menu/Menu'
import { CPUSelect } from './components/CPUSelect/CPUSelect'
import { AvatarSelect } from './components/AvatarSelect/AvatarSelect'
import { EventSelect } from './components/EventSelect/EventSelect'
import { MathMarathon } from './components/MathMarathon/MathMarathon'
import { TugOfWar } from './components/TugOfWar/TugOfWar'
import { Victory } from './components/Victory/Victory'
import { TrophyShelf } from './components/TrophyShelf/TrophyShelf'

function App() {
  const { phase, event } = useGameState()

  switch (phase) {
    case 'menu':
      return <Menu />
    case 'cpu-select':
      return <CPUSelect />
    case 'avatar-select':
      return <AvatarSelect />
    case 'event-select':
      return <EventSelect />
    case 'playing':
      return event === 'marathon' ? <MathMarathon /> : <TugOfWar />
    case 'victory':
      return <Victory />
    case 'trophies':
      return <TrophyShelf />
    default:
      return <Menu />
  }
}

export default App
