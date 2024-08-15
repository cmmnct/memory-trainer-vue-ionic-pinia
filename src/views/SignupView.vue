<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Aanmelden</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-label>Email: </ion-label> <ion-input placeholder="E-mail" type="email" v-model="email"></ion-input>
      <ion-label>user name: </ion-label> <ion-input placeholder="username" type="text" v-model="user"></ion-input>
      <ion-label>Password: </ion-label> <ion-input placeholder="Wachtwoord" type="password"
        v-model="password"></ion-input>
      <ion-button @click="signUp">Aanmelden</ion-button>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'vue-router';
import { db } from '@/firebase';
import { createUserWithEmailAndPassword, UserCredential } from 'firebase/auth';
import { auth } from '@/firebase';


const email = ref('');
const user = ref('');
const password = ref('');
const router = useRouter();

async function signUp() {
  try {
    await console.log(email.value);
    const credentials:UserCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
    await setDoc(doc(db, 'users', credentials.user.uid), {
    id: credentials.user.uid,
    username: user.value,
    email: email.value,
    invitations: {
      pending: [],
      played: [],
      cancelled: [],
      rejected: [],
    }
  });
    router.push({ path: '/game' });
  } catch (error) {
    console.error('Signup failed', error);
  }
}
</script>