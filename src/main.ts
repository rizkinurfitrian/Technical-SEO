// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)

// Mendaftarkan Pinia ke dalam aplikasi Vue
app.use(createPinia())

app.mount('#app')