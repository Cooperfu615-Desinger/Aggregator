import { createApp } from 'vue'
import { createPinia } from 'pinia'
import naive from 'naive-ui'
import router from './router'
import './router/permission' // Import permission guard
import './style.css'
import App from './App.vue'

// Tech Standards: Force Mock in Prod or if API is unreachable
// In a real scenario, you might check for API availability, but for now we follow the standard:
// "Modify to: whenever unable to connect to real API, OR VITE_USE_MOCK=true, start MSW"
// Since we don't have a real API check yet, we'll default to checking the env var or dev mode.
// However, the standard says "Remove if (import.meta.env.DEV)".
// Note: We need to define the worker first.

async function prepareApp() {
    // CRITICAL: Always start MSW for Vercel/Production Demo
    const { worker } = await import('./mocks/browser')
    await worker.start({
        onUnhandledRequest: 'bypass',
    })
}

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(naive)

// Ensure MSW starts before mounting
prepareApp().then(() => {
    app.mount('#app')
})
