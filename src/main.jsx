import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/Globals.css'
import App from './app/App.jsx'
import { NotificationProvider } from './features/notifications/NotificationContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </StrictMode>,
)

