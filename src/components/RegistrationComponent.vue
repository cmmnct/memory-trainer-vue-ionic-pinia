<template>
    <form @submit.prevent="register">
      <input v-model="username" placeholder="Username" required />
      <input v-model="email" placeholder="Email" type="email" required />
      <input v-model="password" placeholder="Password" type="password" required />
      <button type="submit">Register</button>
    </form>
  </template>

<script lang="ts" setup>

const model = defineModel()

</script>