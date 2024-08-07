export interface Card {
    name: string;
    set: string;
    exposed?: boolean;
  }
  
  export interface Result {
    date: string;
    attempts: number;
    gridSize: number;
    score: number;
  }
  
  export interface State {
    firstCard: Card | null;
    secondCard: Card | null;
    lockBoard: boolean;
    attempts: number;
    gridSize: number;
    cards: Card[];
    results: Result[];
  }
  
  export interface CardSet {
    set: string;
    card1?: string;
    card2?: string;
  }