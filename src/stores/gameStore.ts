import { defineStore } from 'pinia';
import { cardService } from '@/services/cardService';
import { db } from '@/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { State, Result, Card } from '@/models/models';

export const useGameStore = defineStore('gameStore', {
  state: (): State => ({
    user: null,
    firstCard: null,
    secondCard: null,
    lockBoard: false,
    attempts: 0,
    gridSize: 16,
    cards: [],
    results: [],
    stateLoaded: false,
  }),

  actions: {
    async login(email: string, password: string): Promise<boolean> {
      const auth = getAuth();
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        this.user = userCredential.user;
        return true;
      } catch (error) {
        console.error('Login failed', error);
        return false;
      }
    },

    async signUp(email: string, password: string): Promise<boolean> {
      const auth = getAuth();
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        this.user = userCredential.user;
        return true;
      } catch (error) {
        console.error('Signup failed', error);
        return false;
      }
    },

    async initializeCards(gridSize: number) {
      if (this.stateLoaded && this.cards.length && this.gridSize === gridSize) return;
      const cards: Card[] = await cardService.initializeCards(gridSize);
      this.cards = cards;
      this.gridSize = gridSize;
      this.attempts = 0;
      this.lockBoard = false;
      this.firstCard = null;
      this.secondCard = null;
      this.saveState();
    },

    handleCardClick(index: number) {
      const clickedCard = this.cards[index];
      if (this.lockBoard || clickedCard === this.firstCard || clickedCard.exposed) return;

      clickedCard.exposed = true;

      if (!this.firstCard) {
        this.firstCard = clickedCard;
        this.saveState();
        return;
      }

      this.secondCard = clickedCard;
      this.attempts++;
      this.lockBoard = true;

      if (this.firstCard.set === this.secondCard.set) {
        if (!this.cards.some(card => !card.exposed)) {
          setTimeout(() => {
            alert("Gefeliciteerd! Je hebt alle kaarten gevonden.");
            this.addResult();
          }, 1000);
        }
        this.resetState();
      } else {
        setTimeout(() => {
          this.firstCard!.exposed = false;
          this.secondCard!.exposed = false;
          this.resetState();
        }, 1000);
      }
      this.saveState();
    },

    resetState() {
      this.firstCard = null;
      this.secondCard = null;
      this.lockBoard = false;
      this.saveState();
    },

    addResult() {
      const result: Result = {
        date: new Date().toISOString(),
        attempts: this.attempts,
        gridSize: this.gridSize,
        score: Math.max(0, this.gridSize * 2 - this.attempts),
      };
      this.results.push(result);
      this.saveState();
    },

    async saveState() {
      const auth = getAuth();
      if (auth.currentUser) {
        const userDoc = doc(db, `users/${auth.currentUser.uid}/gameState/state`);
        await setDoc(userDoc, this.$state, { merge: true });
      } else {
        localStorage.setItem('gameState', JSON.stringify(this.$state));
      }
    },

    async loadState() {
      const auth = getAuth();
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          const userDoc = doc(db, `users/${user.uid}/gameState/state`);
          const docSnap = await getDoc(userDoc);
          if (docSnap.exists()) {
            const savedState = docSnap.data() as State;
            Object.assign(this.$state, savedState);
          } else {
            // Als er geen opgeslagen state is, maak een nieuwe lege state
            await this.initializeCards(this.$state.gridSize);
            this.saveState();
          }
        } else {
          const savedState = localStorage.getItem('gameState');
          if (savedState) {
            Object.assign(this.$state, JSON.parse(savedState));
          } else {
            // Als er geen opgeslagen state is, maak een nieuwe lege state
            await this.initializeCards(this.$state.gridSize);
            this.saveState();
          }
        }
        this.$state.stateLoaded = true;
        console.log(this.$state);
      });
    },

    async fetchResults() {
      const auth = getAuth();
      if (auth.currentUser) {
        const userDoc = doc(db, `users/${auth.currentUser.uid}/gameState/state`);
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists()) {
          const savedState = docSnap.data() as State;
          this.results = savedState.results;
          console.log('Fetched results:', this.results);
        }
      }
    },
  },

  getters: {
    isStateLoaded: (state: State) => state.stateLoaded,
  }
});
