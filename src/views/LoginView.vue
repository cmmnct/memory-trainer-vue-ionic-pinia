<template>
    <ion-page>
      <ion-header>
        <ion-toolbar>
          <ion-title>Inloggen</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <h2>Inloggen</h2>
        <ion-input placeholder="E-mail" type="email" v-model="email"></ion-input>
        <ion-input placeholder="Wachtwoord" type="password" v-model="password"></ion-input>
        <ion-button @click="login">Inloggen</ion-button>
      </ion-content>
    </ion-page>
  </template>
  
  <script lang="ts" setup>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { signInWithEmailAndPassword } from 'firebase/auth';
  import { auth } from '@/firebase';
  
  const email = ref('');
  const password = ref('');
  const router = useRouter();
  
  async function login() {
    try {
      await signInWithEmailAndPassword(auth, email.value, password.value);
      router.push({ path: '/game' });
    } catch (error) {
      console.error('Login failed', error);
    }
  }
  </script>
  