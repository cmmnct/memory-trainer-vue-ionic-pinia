<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Memory Game</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="logout">
            <ion-icon slot="icon-only" name="person-circle-outline"></ion-icon>
          </ion-button>
          <ion-button @click="showGridSizeSelector = true">
            <ion-icon slot="icon-only" name="grid-outline"></ion-icon>
          </ion-button>

        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div v-if="gameStore.state" class="game-grid">
        <CardComponent v-for="(card, index) in gameStore.state.cards" :key="`${card.set}-${card.name}-${index}`"
          :card="card" :class="`grid${gameStore.state.gridSize}`" @click="handleCardClick(index)" />
      </div>
      <ion-spinner v-else />
    </ion-content>
    <!-- Modals -->
    
    <!-- gridSizeSelector -->
    <ion-modal :is-open="showGridSizeSelector" @didDismiss="showGridSizeSelector = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Selecteer Grid Grootte</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showGridSizeSelector = false">Sluiten</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list>
          <ion-item button @click="handleGridSizeChange(16)">4x4</ion-item>
          <ion-item button @click="handleGridSizeChange(25)">5x5</ion-item>
          <ion-item button @click="handleGridSizeChange(36)">6x6</ion-item>
        </ion-list>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script lang="ts" setup>
import { ref, onMounted} from 'vue';
import { useGameStore } from '@/stores/gameStore';
import CardComponent from '@/components/CardComponent.vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const gameStore = useGameStore();
const loading = ref(true);
const showGridSizeSelector = ref(false);

async function logout() {
  const success = await gameStore.handleAuthentication('logout');
  if (success) {
    router.push('/login'); // Navigeer terug naar het login-scherm na uitloggen
  }
}

const handleCardClick = (index:number) => {
  gameStore.handleCardClick(index);
};

async function handleGridSizeChange(size: number) {
  showGridSizeSelector.value = false;
  loading.value = true;
  await gameStore.initializeCards(size);
  loading.value = false;
}

onMounted(async () => {
  await gameStore.loadState();
  loading.value = false;
  console.log('GameView loaded state:', gameStore.state);
  
});
</script>

<style scoped>
.game-grid {
  display: flex;
  flex-wrap: wrap;
  width: 100vw;
  max-width: 900px;
  margin: auto;
  justify-content: center;
}

.game-grid>div {
  margin: min(1vw, 10px);
}

.grid16 {
  max-width: calc(25% - 2vw);
}

.grid25 {
  max-width: calc(20% - 2vw);
}

.grid36 {
  max-width: calc(16.6666% - 2vw);
}
</style>