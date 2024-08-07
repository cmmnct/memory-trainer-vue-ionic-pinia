import { defineStore } from 'pinia';
import { ref } from 'vue';
import { cardService } from '@/services/cardService';
import { db } from '@/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { State, Result, Card } from '@/models/models';

export const useGameStore = defineStore('gameStore', () => {
  const state = ref<State>({
    user: null,
    firstCard: null,
    secondCard: null,
    lockBoard: false,
    attempts: 0,
    gridSize: 16,
    cards: [],
    results: [],
    stateLoaded: false,
  });

  const auth = getAuth();

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      state.value.user = userCredential.user;
      return true;
    } catch (error) {
      console.error('Login failed', error);
      return false;
    }
  };

  const signUp = async (email: string, password: string): Promise<boolean> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      state.value.user = userCredential.user;
      return true;
    } catch (error) {
      console.error('Signup failed', error);
      return false;
    }
  };

  const initializeCards = async (gridSize: number) => {
    if (state.value.stateLoaded && state.value.cards.length && state.value.gridSize === gridSize) return;
    const cards: Card[] = await cardService.initializeCards(gridSize);
    state.value.cards = cards;
    state.value.gridSize = gridSize;
    state.value.attempts = 0;
    state.value.lockBoard = false;
    state.value.firstCard = null;
    state.value.secondCard = null;
    saveState();
  };

  const handleCardClick = (index: number) => {
    const clickedCard = state.value.cards[index];
    if (state.value.lockBoard || clickedCard === state.value.firstCard || clickedCard.exposed) return;

    clickedCard.exposed = true;

    if (!state.value.firstCard) {
      state.value.firstCard = clickedCard;
      saveState();
      return;
    }

    state.value.secondCard = clickedCard;
    state.value.attempts++;
    state.value.lockBoard = true;

    if (state.value.firstCard.set === state.value.secondCard.set) {
      if (!state.value.cards.some(card => !card.exposed)) {
        setTimeout(() => {
          alert("Gefeliciteerd! Je hebt alle kaarten gevonden.");
          addResult();
        }, 1000);
      }
      resetState();
    } else {
      setTimeout(() => {
        state.value.firstCard!.exposed = false;
        state.value.secondCard!.exposed = false;
        resetState();
      }, 1000);
    }
    saveState();
  };

  const resetState = () => {
    state.value.firstCard = null;
    state.value.secondCard = null;
    state.value.lockBoard = false;
    saveState();
  };

  const addResult = () => {
    const result: Result = {
      date: new Date().toISOString(),
      attempts: state.value.attempts,
      gridSize: state.value.gridSize,
      score: Math.max(0, state.value.gridSize * 2 - state.value.attempts),
    };
    state.value.results.push(result);
    saveState();
  };

  const saveState = async () => {
    if (auth.currentUser) {
      const userDoc = doc(db, `users/${auth.currentUser.uid}/gameState/state`);
      await setDoc(userDoc, state.value, { merge: true });
    } else {
      localStorage.setItem('gameState', JSON.stringify(state.value));
    }
  };

  const loadState = async () => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = doc(db, `users/${user.uid}/gameState/state`);
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists()) {
          const savedState = docSnap.data() as State;
          Object.assign(state.value, savedState);
        } else {
          await initializeCards(state.value.gridSize);
          saveState();
        }
      } else {
        const savedState = localStorage.getItem('gameState');
        if (savedState) {
          Object.assign(state.value, JSON.parse(savedState));
        } else {
          await initializeCards(state.value.gridSize);
          saveState();
        }
      }
      state.value.stateLoaded = true;
      console.log(state.value);
    });
  };

  const fetchResults = async () => {
    if (auth.currentUser) {
      const userDoc = doc(db, `users/${auth.currentUser.uid}/gameState/state`);
      const docSnap = await getDoc(userDoc);
      if (docSnap.exists()) {
        const savedState = docSnap.data() as State;
        state.value.results = savedState.results;
        console.log('Fetched results:', state.value.results);
      }
    }
  };

  const isStateLoaded = () => state.value.stateLoaded;

  return {
    state,
    login,
    signUp,
    initializeCards,
    handleCardClick,
    resetState,
    addResult,
    saveState,
    loadState,
    fetchResults,
    isStateLoaded,
  };
});
