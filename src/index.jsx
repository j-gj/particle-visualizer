import * as THREE from 'three'
import { extend, createRoot, events } from '@react-three/fiber'
import './styles.css'
import App from './App.jsx'

// https://docs.pmnd.rs/react-three-fiber/api/canvas
extend(THREE)

const root = createRoot(document.querySelector('canvas'), {
  events,
  linear: true,
  camera: { fov: 25, position: [0, 0, 3] },
  gl: { 
    alpha: true, // Enable transparency
    antialias: true,
    powerPreference: "high-performance" // Optional: prioritize performance
  }
})

function renderApp() {
  root.render(<App />)
}

window.addEventListener('resize', renderApp)
renderApp() // Initial render