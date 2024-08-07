import { defineStore } from 'pinia';
import { ref } from 'vue';
import { cardService } from '@/services/cardService';
import { auth, db } from '@/firebase';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { Result, State } from '@/models/models';


export const useGameStore = defineStore('gameStore', () => {
  const state = ref<State>({
    firstCard: null,
    secondCard: null,
    lockBoard: false,
    attempts: 0,
    gridSize: 16, // Standaard gridSize
    cards: [],
    results: [],
  });

  let stateLoaded = false;

  const initializeCards = async (gridSize: number) => {
    const cards = await cardService.initializeCards(gridSize);
    state.value.cards = cards;
    state.value.gridSize = gridSize;
    state.value.attempts = 0;
    state.value.lockBoard = false;
    state.value.firstCard = null;
    state.value.secondCard = null;
    saveState();
  };

  const handleCardClick = (index: number, updateCallback: () => void) => {
    const clickedCard = state.value.cards[index];
    if (state.value.lockBoard || clickedCard === state.value.firstCard || clickedCard.exposed) return;

    clickedCard.exposed = true;
    updateCallback();

    if (!state.value.firstCard) {
      state.value.firstCard = clickedCard;
      saveState();
      return;
    }

    state.value.secondCard = clickedCard;
    state.value.attempts++;
    state.value.lockBoard = true;
    updateCallback();

    if (state.value.firstCard.set === state.value.secondCard.set) {
      if (!state.value.cards.some(card => !card.exposed)) {
        setTimeout(() => {
          alert("Gefeliciteerd! Je hebt alle kaarten gevonden.");
          addResult();
        }, 1000);
      }
      resetState();
      updateCallback();
    } else {
      setTimeout(() => {
        state.value.firstCard!.exposed = false;
        state.value.secondCard!.exposed = false;
        resetState();
        updateCallback();
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
    if (stateLoaded) return;

    if (auth.currentUser) {
      const userDoc = doc(db, `users/${auth.currentUser.uid}/gameState/state`);
      onSnapshot(userDoc, (docSnap) => {
        if (docSnap.exists()) {
          const savedState = docSnap.data() as State;
          state.value = {
            ...state.value,
            ...savedState,
          };
        }
      });
    } else {
      const savedState = localStorage.getItem('gameState');
      if (savedState) {
        state.value = {
          ...state.value,
          ...JSON.parse(savedState),
        };
      }
    }
    stateLoaded = true;
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

  return {
    state,
    initializeCards,
    handleCardClick,
    resetState,
    addResult,
    saveState,
    loadState,
    fetchResults,
    get stateLoaded() {
      return stateLoaded;
    },
  };
});
