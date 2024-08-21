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
            <ion-input v-model="myUserCredentials.displayName" @input="atSettingsChange"
              placeholder="Voer je gebruikersnaam in"></ion-input>
            <ion-avatar @click="triggerFileUpload" style="cursor: pointer;" slot="end">
              <img :src="myUserCredentials.avatarUrl" alt="Avatar">
            </ion-avatar>
            <!-- Verborgen bestand upload element -->
            <input type="file" ref="fileInput" @change="handleFileChange" style="display: none;" />
          </ion-item>

          <ion-item>
            <ion-button @click="changePassword = !changePassword">Verander wachtwoord</ion-button>
          </ion-item>
          <ion-item v-if="changePassword">
            <ion-label position="stacked">Oude wachtwoord</ion-label>
            <ion-input type="password" v-model="oldPassword" @input="atSettingsChange" @change="checkPasswords" onkeypress="return event.charCode != 32"
              placeholder="Voer je oude wachtwoord in">
              <ion-input-password-toggle slot="end"></ion-input-password-toggle>
            </ion-input>
          </ion-item>
          <ion-item v-if="changePassword">
            <ion-label position="stacked">Nieuwe wachtwoord</ion-label>
            <ion-input type="password" v-model="newPassword" @input="atSettingsChange"  @change="checkPasswords" onkeypress="return event.charCode != 32"
              placeholder="Voer je nieuwe wachtwoord in">
              <ion-input-password-toggle slot="end"></ion-input-password-toggle>
            </ion-input>
          </ion-item>
          <ion-item v-if="passwordError && changePassword"><p style="color: red; font-weight: bold;">{{ passwordError }}</p></ion-item>
          <ion-item v-if="passwordErrorMessage"><p style="color: red; font-weight: bold;">Error: {{ passwordErrorMessage }}</p></ion-item>

          <ion-item>
            <ion-label position="stacked">Geboortedatum</ion-label><br>
            <ion-datetime-button datetime="datetime"></ion-datetime-button><br>
            <ion-modal :keep-contents-mounted="true">
              <ion-datetime id="datetime" v-model="myUserCredentials.birthdate" display-format="YYYY-MM-DD"
                presentation="date" @ionChange="atSettingsChange"></ion-datetime>
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
import { ref, reactive } from 'vue';
import { UserCredentials } from '../models/models';

const props = defineProps<{
  isOpen: boolean;
  passwordErrorMessage: string;
  userCredentials: UserCredentials,
  onLogout: () => void;
  
}>();
const emit = defineEmits(['close', 'updateProfile']);
const submitDisabled = ref(true);
let myUserCredentials = reactive({ ...props.userCredentials });
const fileInput = ref<HTMLInputElement | null>(null);
const avatarFile = ref<File | null>(null);
const oldPassword = ref('');
const newPassword = ref('');
const changePassword = ref(false);
const passwordError = ref('');

function onOpen() {
  // Diepe kopie om wijzigingen in de originele props te voorkomen totdat de gebruiker opslaat
  myUserCredentials = JSON.parse(JSON.stringify(props.userCredentials));
  submitDisabled.value = true; // Reset de disabled status van de submit knop

  console.log("Gevulde credentials bij openen:", myUserCredentials); // Debugging lijn
}

function triggerFileUpload() {
  if (fileInput.value) {
    fileInput.value.click();
  }
}

function atSettingsChange() {
  submitDisabled.value = false; // Zorg ervoor dat de submit knop actief wordt bij wijzigingen
checkPasswords()
}

function close() {
  emit('close');
  submitDisabled.value = true; // Reset de status van de submit knop
  changePassword.value = false
  passwordError.value = '';
  oldPassword.value = '';
  newPassword.value = '';
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    avatarFile.value = target.files[0];
    myUserCredentials.avatarUrl = URL.createObjectURL(avatarFile.value);
    console.log("Nieuwe avatar geselecteerd:", myUserCredentials.avatarUrl);
    atSettingsChange(); // Activeer de submit knop
  }
};

function handleUpdateProfile() {
  console.log("Profiel wordt bijgewerkt:", myUserCredentials);
  if (changePassword.value) {
    checkPasswords()
  }
emit('updateProfile', myUserCredentials, avatarFile.value);
}

function checkPasswords(){
  if (oldPassword.value && newPassword.value && oldPassword.value !== newPassword.value) {
      myUserCredentials.oldPassword = oldPassword.value;
      myUserCredentials.newPassword = newPassword.value;
      passwordError.value = ''
    }
    else {
      passwordError.value = 'Vul uw oude wachtwoord in en een nieuw wachtwoord. Het oude en nieuwe mogen niet gelijk zijn'
    }
}

function handleLogout() {
  props.onLogout();
  close();
}
</script>
