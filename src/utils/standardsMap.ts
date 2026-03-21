import type { QuestionCategory, GradeLevel } from '../types'

// Common Core State Standards mappings
const STANDARDS: Record<string, Record<string, string>> = {
  'grade-1': {
    addition: '1.OA.C.6',
    subtraction: '1.OA.C.6',
    missing: '1.OA.A.1',
    comparison: '1.NBT.B.3',
    'skip-counting': '1.NBT.A.1',
    rhyming: 'RF.1.2',
    opposites: 'L.1.5',
    'beginning-sounds': 'RF.1.2',
    'fill-in-blank': 'L.1.1',
    'word-meaning': 'L.1.4',
    'sight-words': 'RF.1.3',
    animals: '1-LS1-1',
    plants: '1-LS1-1',
    'body-senses': '1-LS1-1',
    weather: '1-ESS1-2',
    space: '1-ESS1-1',
  },
  'grade-3': {
    multiplication: '3.OA.C.7',
    division: '3.OA.C.7',
    fractions: '3.NF.A.1',
    rounding: '3.NBT.A.1',
    addition: '3.NBT.A.2',
    subtraction: '3.NBT.A.2',
    vocabulary: 'L.3.4',
    grammar: 'L.3.1',
    'parts-of-speech': 'L.3.1',
    'figurative-language': 'L.3.5',
    'sentence-correction': 'L.3.2',
    materials: '3-PS2-1',
    'water-cycle': '3-ESS2-1',
    forces: '3-PS2-1',
    'food-chains': '3-LS4-3',
    magnets: '3-PS2-3',
  },
  adult: {
    percentages: '6.RP.A.3',
    'order-of-operations': '5.OA.A.1',
    'square-roots': '8.EE.A.2',
    estimation: '4.NBT.A.3',
    multiplication: '5.NBT.B.5',
    division: '5.NBT.B.6',
    fractions: '5.NF.A.1',
    etymology: 'L.8.4',
    analogies: 'L.8.5',
    spelling: 'L.8.2',
    chemistry: 'HS-PS1-1',
    biology: 'HS-LS1-1',
    physics: 'HS-PS2-1',
    astronomy: 'HS-ESS1-1',
    'earth-science': 'HS-ESS2-1',
  },
}

export function getStandard(category: QuestionCategory, gradeLevel: GradeLevel): string | undefined {
  return STANDARDS[gradeLevel]?.[category]
}
