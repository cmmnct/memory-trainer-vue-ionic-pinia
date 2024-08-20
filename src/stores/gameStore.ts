import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import { cardService } from '@/services/cardService';
import { db, storage, auth } from '@/firebase';
import { doc, setDoc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { State, Result, UserCredentials } from '@/models/models';
import { uploadBytes, getDownloadURL, ref as firebaseStorageRef } from 'firebase/storage';

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
  const handleAuthChange = async (currentUser: any) => {
    if (currentUser) {
      user.value = currentUser;
      await loadUserProfile();
      await loadState();
    } else {
      user.value = null;
      resetState();
      state.stateLoaded = false;
    }
  };

  //event handler van Firebase die 'vuurt' als er iets verandert in de authorisatie van de gebruiker
  onAuthStateChanged(auth, handleAuthChange);

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

  const updateUserProfile = async (updatedCredentials: UserCredentials, avatarFile: File | null) => {
    console.log(avatarFile)
    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
  
      let avatarUrl = updatedCredentials.avatarUrl;
  
      // Als er een nieuwe avatar is geselecteerd, upload deze naar Firebase Storage
      if (avatarFile) {
        console.log("Bezig met uploaden van nieuwe avatar...");
        const avatarStorageRef = firebaseStorageRef(storage, `avatars/${auth.currentUser.uid}`);
        await uploadBytes(avatarStorageRef, avatarFile);
        avatarUrl = await getDownloadURL(avatarStorageRef);
        console.log("Avatar geüpload naar:", avatarUrl);
      }
  
      // Update Firestore met displayName, birthdate en de nieuwe avatarUrl
      const updates: Partial<UserCredentials> = {
        displayName: updatedCredentials.displayName,
        birthdate: updatedCredentials.birthdate,
        avatarUrl: avatarUrl, // Gebruik de nieuwe URL als deze is geüpload
      };
  
      await updateDoc(userDocRef, updates);
  
      // Update de displayName in Firebase Auth indien nodig
      if (updatedCredentials.displayName) {
        await firebaseUpdateProfile(auth.currentUser, { displayName: updatedCredentials.displayName });
      }
  
      // Profiel opnieuw laden om state up-to-date te houden
      await loadUserProfile();
    } else {
      console.error("Geen gebruiker ingelogd.");
    }
  };
  
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      handleAuthChange(userCredential.user);
      return true;
    } catch (error) {
      console.error('Login failed', error);
      return false;
    }
  };

  const logout = async (): Promise<boolean> => {
    try {
      await auth.signOut();
      handleAuthChange(null);
      return true;
    } catch (error) {
      console.error('Logout failed', error);
      return false;
    }
  };

  const signUp = async (email: string, password: string): Promise<boolean> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      handleAuthChange(userCredential.user);
      return true;
    } catch (error) {
      console.error('Signup failed', error);
      return false;
    }
  };

  const uploadAvatarFile = async (uid: string, file: File): Promise<string> => {
    try {
      const storageRef = firebaseStorageRef(storage, `avatars/${uid}`);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      throw error;
    }
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
    updateUserProfile,
    logout,
    user,
    userCredentials,
    loadUserProfile,
    uploadAvatarFile,
  };
});
