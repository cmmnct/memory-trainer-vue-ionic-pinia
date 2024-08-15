import { defineStore } from 'pinia';
import { ref } from 'vue';
import { cardService } from '@/services/cardService';
import { db } from '@/firebase';
import { doc, setDoc, getDoc, query, where, getDocs, collection, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { State, Result, Card, Invitation } from '@/models/models';


export const searchPlayer = async (username: string) => {
  console.log(username)
  const q = query(collection(db, 'users'), where('username', '==', username));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
};

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
    invitations: []
  });

  const auth = getAuth();

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User after login:', userCredential.user); // Controleer of de user correct is

      state.value.user = userCredential.user;
      return true;
    } catch (error) {
      console.error('Login failed', error);
      return false;
    }
  };

  const signUp = async (email: string, user: string, password: string): Promise<boolean> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      state.value.user = userCredential.user;
      await setDoc(doc(db, 'users', state.value.user.uid), {
        id: state.value.user.uid,
        username: user,
        email: email,
        invitations: {
          pending: [],
          played: [],
          cancelled: [],
          rejected: [],
        }
      });
      return true;

    } catch (error) {
      console.error('Signup failed', error);
      return false;
    }
  };

  const listenForInvitations = (userId: string) => {
    const userDocRef = doc(db, `users/${userId}`);
    
    onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        console.log('Document data:', data);
  
        // Controleer of invitations een map/object is
        const invitationsMap = data.invitations || {};
  
        // Converteer de map naar een array van objecten
        const invitations = Object.keys(invitationsMap).map(key => {
          const invitation = invitationsMap[key];
          return {
            id: key, // Gebruik de key als ID voor elke invitation
            ...invitation,
            createdAt: invitation.createdAt ? invitation.createdAt.toDate() : null,
          };
        });
  
        state.value.invitations = invitations;
        console.log('Updated invitations:', state.value.invitations);
      } else {
        console.log('No such document!');
      }
    });
  };
  

  // Methode om een uitnodiging te accepteren
  const acceptInvitation = async (userId: string, invitationId: string) => {
    const invitationRef = doc(db, `users/${userId}/invitations`, invitationId);

    await updateDoc(invitationRef, {
      status: 'accepted',
    });

    console.log("start nu het spel")
  };

  // Methode om een uitnodiging te weigeren
  const rejectInvitation = async (userId: string, invitationId: string) => {
    const invitationRef = doc(db, `users/${userId}/invitations`, invitationId);

    await updateDoc(invitationRef, {
      status: 'rejected',
    });
  };

  // Methode om een uitnodiging te versturen
  const sendInvitation = async (fromPlayerId: string, toPlayerId: string) => {
    const invitation: Invitation = {
      id: crypto.randomUUID(),
      fromPlayerId,
      toPlayerId,
      status: 'pending',
      createdAt: new Date(),
    };

    const toPlayerRef = doc(db, `users/${toPlayerId}`);
    await setDoc(toPlayerRef, { invitations: arrayUnion(invitation) }, { merge: true });
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
    searchPlayer,
    sendInvitation,
    listenForInvitations,
    acceptInvitation,
    rejectInvitation,
  };
});
