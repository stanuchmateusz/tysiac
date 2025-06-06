export interface Player {
    id: string;
    connectionId: string;
    nickname: string;
}
export interface ChatMessage {
    nickname: string;
    message: string;
}

export interface UpdateContext {
    gameCtx: GameContext;
    userCtx: GameUserContext;
}

export interface LobbyContext {
    players: Player[];
    host: Player;
    team1: Player[];
    team2: Player[];
    code: string;
}
export interface ChatMessage {
    nickname: string;
    message: string;
}
export interface Card {
    name: number;
    suit: number;
    points: number;
    shortName: string;
}

export interface GameContext {
    currentPlayer: Player;
    gamePhase: number;
    cardsOnTable: Card[];
    trumpSuit: number;
    currentBet: number;
    disconnectedPlayerCount: number;
}

export interface GameUserContext {
    me: Player;
    teammate: Player;
    leftPlayer: Player;
    rightPlayer: Player;
    teammateCards: number;
    leftPlayerCards: number;
    rightPlayerCards: number;
    hand: Card[];
    myTeamScore: number; //my
    opponentScore: number; //wy
    myTeamRoundScore: number;
    opponentRoundScore: number;
}
