import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css' // ose App.css nëse nuk ke index.css

const container = document.getElementById('root')
const root = createRoot(container)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
