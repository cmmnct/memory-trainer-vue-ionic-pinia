<template>
    <ion-modal :is-open="isOpen" @didDismiss="close">
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
                        <ion-label>Display Naam</ion-label>
                        <ion-input v-model="displayName" placeholder="Voer je display naam in"></ion-input>
                    </ion-item>
                    <ion-item>
                        <ion-label>Wachtwoord</ion-label>
                        <ion-input type="password" v-model="password"
                            placeholder="Voer je nieuwe wachtwoord in"></ion-input>
                    </ion-item>
                    <ion-item>
                        <ion-label>Geboortedatum</ion-label>
                        <ion-datetime v-model="birthdate" display-format="YYYY-MM-DD"
                            placeholder="Selecteer je geboortedatum"></ion-datetime>
                    </ion-item>
                    <ion-item>
                        <ion-label>Avatar</ion-label>
                        <ion-avatar>
                            <img :src="avatarUrl" alt="Avatar">
                        </ion-avatar>
                        <input type="file" @change="handleFileChange" />
                    </ion-item>
                </ion-list>
                <ion-button expand="full" @click="updateUserProfile">Update Profiel</ion-button>
                <ion-button expand="full" color="danger" @click="logout">Uitloggen</ion-button>
            </form>
        </ion-content>
    </ion-modal>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { defineProps, defineEmits } from 'vue';
import { useRouter } from 'vue-router';
import { auth, db, storage } from '../firebase';
import { updateProfile as firebaseUpdateProfile, updatePassword as firebaseUpdatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { uploadBytes, getDownloadURL, ref as storageRef } from 'firebase/storage';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{ isOpen: boolean }>();
const emit = defineEmits(['close']);
const router = useRouter();

const displayName = ref('');
const password = ref('');
const birthdate = ref('');
const avatarUrl = ref('');
const avatarFile = ref<File | null>(null);

onMounted(async () => {
    const user = auth.currentUser;
    if (user) {
        displayName.value = user.displayName || '';
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            birthdate.value = data.birthdate || new Date().toISOString().substring(0, 10); // Fallback naar huidige datum in ISO 8601 formaat
            avatarUrl.value = data.avatarUrl || '';
        }
    }
});

function close() {
    emit('close');
}

async function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
        avatarFile.value = target.files[0];
        avatarUrl.value = URL.createObjectURL(avatarFile.value);
    }
}

async function updateUserProfile() {
    const user = auth.currentUser;
    if (user) {
        if (displayName.value) {
            await firebaseUpdateProfile(user, { displayName: displayName.value });
        }
        if (password.value) {
            await firebaseUpdatePassword(user, password.value);
        }
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { birthdate: birthdate.value });

        if (avatarFile.value) {
            const avatarStorageRef = storageRef(storage, `avatars/${user.uid}`);
            await uploadBytes(avatarStorageRef, avatarFile.value);
            const avatarDownloadUrl = await getDownloadURL(avatarStorageRef);
            await updateDoc(userDocRef, { avatarUrl: avatarDownloadUrl });
            avatarUrl.value = avatarDownloadUrl;
        }
    }
    close();
}

function logout() {
    auth.signOut().then(() => {
        router.push('/home');  // Navigeer naar het home-scherm
    });
    close();
}
</script>

<style scoped>
/* Voeg hier je stijlen toe */
</style>