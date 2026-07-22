import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ListaBizneseve from './ListaBizneseve.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ListaBizneseve />
  </StrictMode>
)
