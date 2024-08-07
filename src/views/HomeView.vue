<template>
    <ion-page>
      <ion-header>
        <ion-toolbar>
          <ion-title>Memory Game</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <h2>Welkom bij de Memory Trainer</h2>
        <p>De Memory Trainer helpt je om je geheugen te verbeteren door het spelen van een leuk en uitdagend geheugenspel. Klik op de onderstaande knoppen om in te loggen of een nieuw account aan te maken.</p>
        <ion-button @click="goToLogin">Inloggen</ion-button>
        <ion-button @click="goToSignUp">Aanmelden</ion-button>
      </ion-content>
    </ion-page>
  </template>
  
  <script lang="ts" setup>
  import { useRouter } from 'vue-router';
  
  const router = useRouter();
  
  function goToLogin() {
    router.push({ path: '/login' });
  }
  
  function goToSignUp() {
    router.push({ path: '/signup' });
  }
  </script>
  