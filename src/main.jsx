import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ListaBizneseve from './ListaBizneseve.jsx'
import { AppProvider } from './AppContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <ListaBizneseve />
    </AppProvider>
  </StrictMode>
)
