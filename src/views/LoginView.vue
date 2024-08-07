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
  import { useGameStore } from '@/stores/gameStore';
  
  const email = ref('');
  const password = ref('');
  const gameStore = useGameStore()
  
  async function login() {
    await gameStore.login(email.value, password.value)
  }
  </script>
  