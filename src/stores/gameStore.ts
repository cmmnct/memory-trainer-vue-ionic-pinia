import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import { cardService } from '@/services/cardService';
import { db, auth } from '@/firebase';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { State, Result, UserCredentials } from '@/models/models';

export const useGameStore = defineStore('gameStore', () => {
  const state = reactive<State>({
    firstCard: null,
    secondCard: null,
    lockBoard: false,
    attempts: 0,
    gridSize: 16,
    cards: [],
    results: [],
    stateLoaded: false,
  });
  const user = ref(auth.currentUser);
  const userCredentials = reactive<UserCredentials>({
    displayName: '',
    password: '',
    birthdate: '',
    avatarUrl: '',
  });
  const defaultBirthdate = new Date().toISOString().substring(0, 10);

  const handleAuthentication = async (action: 'login' | 'signup' | 'logout' | 'authChange', email?: string, password?: string, currentUser?: any): Promise<boolean> => {
    try {
      let userCredential: any = null;
  
      switch (action) {
        case 'login':
          userCredential = await signInWithEmailAndPassword(auth, email!, password!);
          break;
        
        case 'signup':
          userCredential = await createUserWithEmailAndPassword(auth, email!, password!);
          break;
        
        case 'logout':
          await auth.signOut();
          currentUser = null;
          break;
        
        case 'authChange':
          currentUser = currentUser || null; // Houd rekening met het ontbreken van currentUser
          break;
        
        default:
          throw new Error('Invalid auth action');
      }
  
      if (currentUser || userCredential) {
        user.value = currentUser || userCredential.user;
        await loadUserProfile();
        await loadState();
      } else {
        user.value = null;
        resetState();
        state.stateLoaded = false;
      }
  
      return true;
    } catch (error) {
      console.error(`Authentication action "${action}" failed`, error);
      return false;
    }
  };
  

  const login = (email: string, password: string): Promise<boolean> => {
    return handleAuthentication('login', email, password);
  };

  const signUp = (email: string, password: string): Promise<boolean> => {
    return handleAuthentication('signup', email, password);
  };

  const logout = (): Promise<boolean> => {
    return handleAuthentication('logout');
  };

  onAuthStateChanged(auth, (currentUser) => {
    handleAuthentication('authChange', undefined, undefined, currentUser);
  });

  const setUserProfile = (data: any) => {
    userCredentials.displayName = auth.currentUser?.displayName || '';
    userCredentials.birthdate = data?.birthdate || defaultBirthdate;
    userCredentials.avatarUrl = data?.avatarUrl || 'https://ionicframework.com/docs/img/demos/avatar.svg';
  };

  const loadUserProfile = async () => {
    if (!auth.currentUser) {
      console.error('No current user in Firebase Auth.');
      return;
    }
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      setUserProfile(userDoc.data());
    } else {
      console.log('User document does not exist, creating a new one.');
      const defaultData = {
        displayName: auth.currentUser.displayName || '',
        birthdate: defaultBirthdate,
        avatarUrl: '',
      };
      await setDoc(userDocRef, defaultData);
      setUserProfile(defaultData);
    }

    onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        setUserProfile(doc.data());
      }
    });
  };

  const initializeCards = async (gridSize: number) => {
    if (state.stateLoaded && state.cards.length && state.gridSize === gridSize) return;
    state.cards = await cardService.initializeCards(gridSize);
    state.gridSize = gridSize;
    state.attempts = 0;
    state.lockBoard = false;
    state.firstCard = null;
    state.secondCard = null;
    await saveState();
  };

  const handleCardClick = (index: number) => {
    const clickedCard = state.cards[index];
    if (state.lockBoard || clickedCard === state.firstCard || clickedCard.exposed) return;

    clickedCard.exposed = true;

    if (!state.firstCard) {
      state.firstCard = clickedCard;
      saveState();
      return;
    }

    state.secondCard = clickedCard;
    state.attempts++;
    state.lockBoard = true;

    if (state.firstCard.set === state.secondCard.set) {
      if (!state.cards.some(card => !card.exposed)) {
        setTimeout(() => {
          alert('Gefeliciteerd! Je hebt alle kaarten gevonden.');
          addResult();
        }, 1000);
      }
      resetState();
    } else {
      setTimeout(() => {
        state.firstCard!.exposed = false;
        state.secondCard!.exposed = false;
        resetState();
      }, 1000);
    }
    saveState();
  };

  const resetState = () => {
    state.firstCard = null;
    state.secondCard = null;
    state.lockBoard = false;
    saveState();
  };

  const addResult = () => {
    const result: Result = {
      date: new Date().toISOString(),
      attempts: state.attempts,
      gridSize: state.gridSize,
      score: Math.max(0, state.gridSize * 2 - state.attempts),
    };
    state.results.push(result);
    saveState();
  };

  const saveState = async () => {
    if (auth.currentUser) {
      const userDoc = doc(db, `users/${auth.currentUser.uid}/gameState/state`);
      await setDoc(userDoc, state, { merge: true });
    } else {
      localStorage.setItem('gameState', JSON.stringify(state));
    }
  };

  const loadState = async () => {
    if (auth.currentUser) {
      const userDocRef = doc(db, `users/${auth.currentUser.uid}/gameState/state`);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        Object.assign(state, docSnap.data());
      } else {
        await initializeCards(state.gridSize);
        await saveState();
      }
    } else {
      const savedState = localStorage.getItem('gameState');
      if (savedState) {
        Object.assign(state, JSON.parse(savedState));
      } else {
        await initializeCards(state.gridSize);
        saveState();
      }
    }
    state.stateLoaded = true;
  };

  const fetchResults = async () => {
    if (auth.currentUser) {
      const userDoc = doc(db, `users/${auth.currentUser.uid}/gameState/state`);
      const docSnap = await getDoc(userDoc);
      if (docSnap.exists()) {
        state.results = docSnap.data().results;
      }
    }
  };

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
    logout,
    user,
    userCredentials,
    loadUserProfile,
    handleAuthentication
  };
});
