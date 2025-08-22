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
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
    // Add these for Safari iframe performance
    desynchronized: true,           // Reduces input lag
    premultipliedAlpha: false,      // Better color handling
    preserveDrawingBuffer: false,   // Save memory (default, but explicit)
    // Safari-specific optimizations
    failIfMajorPerformanceCaveat: false, // Don't fall back to software rendering
    stencil: false,                 // Disable stencil buffer if not needed
    depth: true                     // Keep depth buffer for your 3D particles
  },
  // Force continuous rendering (equivalent to frameloop="always")
  frameloop: 'always'
})

function renderApp() {
  root.render(<App />)
}

window.addEventListener('resize', renderApp)
renderApp() // Initial render