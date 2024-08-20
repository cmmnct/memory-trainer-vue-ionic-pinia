<template>
  <ion-modal :is-open="isOpen" @didDismiss="close" @willPresent="onOpen">
    <ion-header>
      <ion-toolbar>
        <ion-title>Gebruikersinstellingen</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="close">Sluiten</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <form>
    <ion-list>
      <ion-item>
        <ion-label position="stacked">Gebruikersnaam</ion-label>
        <ion-input v-model="myUserCredentials.displayName" @input="atSettingsChange" placeholder="Voer je gebruikersnaam in"></ion-input>
        <ion-avatar @click="triggerFileUpload" style="cursor: pointer;" slot="end">
          <img :src="myUserCredentials.avatarUrl" alt="Avatar">
        </ion-avatar>
        <!-- Verborgen bestand upload element -->
        <input type="file" ref="fileInput" @change="handleFileChange" style="display: none;" />
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Wachtwoord</ion-label>
        <ion-input type="password" v-model="myUserCredentials.password" @input="atSettingsChange" placeholder="Voer je wachtwoord in">
          <ion-input-password-toggle slot="end"></ion-input-password-toggle>
        </ion-input>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Geboortedatum</ion-label>
        <ion-datetime-button datetime="datetime"></ion-datetime-button>
        <ion-modal :keep-contents-mounted="true">
          <ion-datetime id="datetime" v-model="myUserCredentials.birthdate" display-format="YYYY-MM-DD" presentation="date" @ionChange="atSettingsChange"></ion-datetime>
        </ion-modal>
      </ion-item>
    </ion-list>
    
    <ion-button expand="block" @click="handleUpdateProfile()" :disabled="submitDisabled">Update Profiel</ion-button>
    <ion-button expand="block" color="warning" @click="handleLogout">Uitloggen</ion-button>
  </form>
    </ion-content>
  </ion-modal>
</template>


<script lang="ts" setup>
import { ref } from 'vue';
import { defineProps, defineEmits } from 'vue';
import { UserCredentials } from '../models/models';

const props = defineProps<{
  isOpen: boolean;
  userCredentials: UserCredentials,
  onLogout: () => void;
}>();
const emit = defineEmits(['close', 'updateProfile']);
const submitDisabled = ref(true);
const myUserCredentials = ref({ ...props.userCredentials });
const fileInput = ref<HTMLInputElement | null>(null);
const avatarFile = ref<File | null>(null);

function onOpen() {
  // Diepe kopie om wijzigingen in de originele props te voorkomen totdat de gebruiker opslaat
  myUserCredentials.value = JSON.parse(JSON.stringify(props.userCredentials));
  submitDisabled.value = true; // Reset de disabled status van de submit knop

  console.log("Gevulde credentials bij openen:", myUserCredentials.value); // Debugging lijn
}

function triggerFileUpload() {
  if (fileInput.value) {
    fileInput.value.click();
  }
}

function atSettingsChange() {
  submitDisabled.value = false; // Zorg ervoor dat de submit knop actief wordt bij wijzigingen
}

function close() {
  emit('close');
  submitDisabled.value = true; // Reset de status van de submit knop
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    avatarFile.value = target.files[0];
    myUserCredentials.value.avatarUrl = URL.createObjectURL(avatarFile.value);
    console.log("Nieuwe avatar geselecteerd:", myUserCredentials.value.avatarUrl);
    atSettingsChange(); // Activeer de submit knop
  }
};

function handleUpdateProfile() {
  console.log("Profiel wordt bijgewerkt:", myUserCredentials.value);
  emit('updateProfile', myUserCredentials.value, avatarFile.value);
  close();
}

function handleLogout() {
  props.onLogout();
  close();
}
</script>
