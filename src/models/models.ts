import { User } from "firebase/auth";

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
    user: User | null;
    firstCard: Card | null;
    secondCard: Card | null;
    lockBoard: boolean;
    attempts: number;
    gridSize: number;
    cards: Card[];
    results: Result[];
    stateLoaded:boolean,
    invitations: Invitation[]
  }
  
  export interface CardSet {
    set: string;
    card1?: string;
    card2?: string;
  }

  export interface Player {
    id: string; // Unieke identifier voor de speler
    username: string; // Gebruikersnaam, zichtbaar voor andere spelers
    email: string; // E-mailadres voor communicatie (indien nodig)
    password: string; // Versleuteld wachtwoord (nooit in platte tekst opslaan)
    invitations: {
      pending: Invitation[]; // Openstaande uitnodigingen
      played: GameResult[]; // Eerdere gespeelde games
      cancelled: Invitation[]; // Geannuleerde uitnodigingen
      rejected: Invitation[]; // Afgewezen uitnodigingen
    };
    currentGameState: GameState | null; // De huidige staat van het spel, null indien geen actief spel
  }
  
  export interface Invitation {
    id: string; // Unieke identifier voor de uitnodiging
    fromPlayerId: string; // De speler die de uitnodiging heeft verstuurd
    toPlayerId: string; // De speler die de uitnodiging ontvangt
    status: 'pending' | 'accepted' | 'rejected' | 'cancelled'; // De huidige status van de uitnodiging
    createdAt: Date; // Tijdstip van versturen van de uitnodiging
  }
  
  export interface GameResult {
    gameId: string; // Unieke identifier voor het gespeelde spel
    opponentId: string; // De tegenstander in het gespeelde spel
    outcome: 'won' | 'lost' | 'draw'; // Resultaat van het spel
    finishedAt: Date; // Tijdstip waarop het spel is beëindigd
  }
  
  export interface GameState {
    gameId: string; // Unieke identifier voor het spel
    players: string[]; // Bevat de id's van de twee spelers
    board: Card[]; // Het huidige bord met kaarten
    currentPlayerId: string; // Id van de speler die aan zet is
    moves: Move[]; // Lijst van gemaakte zetten
    status: 'active' | 'finished'; // Status van het spel
  }
  
  export interface Cardd {
    id: string; // Unieke identifier voor de kaart
    value: string; // Waarde van de kaart
    isFlipped: boolean; // Of de kaart omgedraaid is
    isMatched: boolean; // Of de kaart een match heeft gevonden
  }
  
  export interface Move {
    playerId: string; // De speler die de zet heeft gemaakt
    cardId: string; // De kaart die omgedraaid is
    timestamp: Date; // Tijdstip van de zet
  }
  