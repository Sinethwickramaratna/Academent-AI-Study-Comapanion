// Import React StrictMode for highlighting potential problems in an application
import { StrictMode } from 'react'
// Import createRoot from React DOM to bootstrap/render the application
import { createRoot } from 'react-dom/client'
// Import BrowserRouter to enable declarative routing in our application using react-router-dom
import { BrowserRouter } from 'react-router-dom'
// Import AuthProvider context to wrap our app and manage Firebase authentication state
import { AuthProvider } from './context/AuthContext'
// Import global styling
import './index.css'
// Import the core App component
import App from './App.jsx'

// Find the HTML root element and render the application tree
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* AuthProvider supplies current user & loading state to the rest of the application */}
    <AuthProvider>
      {/* BrowserRouter wraps the app to handle client-side routing routes */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)

