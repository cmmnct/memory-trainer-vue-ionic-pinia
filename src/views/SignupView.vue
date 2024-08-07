<template>
    <ion-page>
      <ion-header>
        <ion-toolbar>
          <ion-title>Aanmelden</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <h2>Aanmelden</h2>
        <ion-input placeholder="E-mail" type="email" v-model="email"></ion-input>
        <ion-input placeholder="Wachtwoord" type="password" v-model="password"></ion-input>
        <ion-button @click="signUp">Aanmelden</ion-button>
      </ion-content>
    </ion-page>
  </template>
  
  <script lang="ts" setup>
  import { ref } from 'vue';
  import { useGameStore } from '@/stores/gameStore';
  import {useRouter} from 'vue-router';
  
  
  const email = ref('');
  const password = ref('');
  const gameStore = useGameStore()
  const router = useRouter();
  
  async function signUp() {
    const success = await gameStore.signUp(email.value, password.value);
    if (success) {
    router.push({ path: '/game' });
  }
  }
  </script>
  