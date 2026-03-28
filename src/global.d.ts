declare global {
  interface Window {
    __remoteAnswerHandler?: (playerId: number, choiceIndex: number) => void
  }
}

export {}
