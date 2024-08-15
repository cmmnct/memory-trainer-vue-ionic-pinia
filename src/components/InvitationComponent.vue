<template>
    <ion-modal :is-open="isOpen" @didDismiss="close">
        <ion-header>
            <ion-toolbar>
                <ion-title>Invitations</ion-title>
                <ion-buttons slot="end">
                    <ion-button @click="close">Sluiten</ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>
        <ion-content>
            <form>
                <ion-label>Find user: </ion-label><ion-input v-model="searchTerm"
                    placeholder="Find user name"></ion-input>
                <ion-button @click="searchPlayer(searchTerm)">Find user</ion-button>
            </form>
            <div v-if="users">
                <div v-for="(user, index) in users" :key="`${user.username}-${index}`">
                    <p class="results" @click="sendInvitation(user.id, user.id)">{{ user.username }}. <ion-button>Nodig {{ user.username }} uit</ion-button></p>
                </div>
            </div>
            <div v-else>
                <h2>Helaas geen zoekresultaten</h2>
            </div>

            <ion-card>
                <ion-card-header>
                    <ion-card-title>Uitnodigingen</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                    <ul>
                        <ion-list v-for="invitation in gameStore.state.invitations" :key="invitation.id">
                            <p>{{ invitation }} heeft je uitgenodigd</p>
                            <ion-button @click="acceptInvitation(invitation.id)">Accepteren</ion-button>
                            <ion-button @click="rejectInvitation(invitation.id)">Afwijzen</ion-button>
                        </ion-list>
                    </ul>
                </ion-card-content>

            </ion-card>

        </ion-content>
    </ion-modal>
</template>

<script lang="ts" setup>

import { ref, onMounted } from 'vue';
import { db, auth  } from '@/firebase';
import { query, collection, orderBy, startAt, endAt, getDocs } from 'firebase/firestore';
import { updateDoc, arrayUnion, doc } from 'firebase/firestore';
import { Invitation } from '../models/models'
import { useGameStore } from '../stores/gameStore';


// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{ isOpen: boolean }>();
const emit = defineEmits(['close']);
const users = ref()
const searchTerm = ref('')
const gameStore = useGameStore();
const userId = ref(auth.currentUser!.uid); // Haal de huidige gebruiker op uit je authenticatiesysteem
   
function close() {
    emit('close');
}

onMounted(() => {
    console.log(userId.value)
      gameStore.listenForInvitations(userId.value);
    });

    const acceptInvitation = (invitationId: string) => {
      gameStore.acceptInvitation(userId.value, invitationId);
    };

    const rejectInvitation = (invitationId: string) => {
      gameStore.rejectInvitation(userId.value, invitationId);
    };


async function searchPlayer(username: string) {
    if (!auth.currentUser) {
        console.error("User not authenticated");
        return;
    }
    const q = query(collection(db, 'users'),
        orderBy('username'),
        startAt(username),
        endAt(username + '\uf8ff'));
    const querySnapshot = await getDocs(q);
    console.log(querySnapshot.docs.map(doc => doc.data()))
    users.value = querySnapshot.docs.map(doc => doc.data());
}

async function sendInvitation(fromPlayerId: string, toPlayerId: string) {
    console.log("id1 : " + fromPlayerId);
    console.log("id2 : " + toPlayerId);

    const invitation: Invitation = {
        id: fromPlayerId + toPlayerId,
        fromPlayerId,
        toPlayerId,
        status: 'pending',
        createdAt: new Date(),
    };

    await updateDoc(doc(db, 'users', toPlayerId), {
        'invitations.pending': arrayUnion(invitation),
    });
}
</script>
<style>
.results {
    cursor: pointer;
}
</style>