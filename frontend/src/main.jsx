import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ContentProvider } from './context/ContentContext'
import { App } from './App.jsx'
import './index.css'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <BrowserRouter>
      <AuthProvider>
        <ContentProvider>
          <App />
          <Toaster position="top-right" toastOptions={{ style: { borderRadius: '8px' } }} />
        </ContentProvider>
      </AuthProvider>
    </BrowserRouter>
  </GoogleOAuthProvider>
)
