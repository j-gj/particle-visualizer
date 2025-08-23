import React from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import App from './App.jsx'

// Create the root for React DOM
const root = createRoot(document.getElementById('root'))

function CanvasApp() {
  return (
    <Canvas
      // Camera settings
      camera={{
        fov: 25,
        position: [0, 0, 2.5]
      }}

      // WebGL context settings optimized for Safari iframes
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        // Safari iframe optimizations
        desynchronized: true,           // Reduces input lag
        premultipliedAlpha: false,      // Better color handling
        preserveDrawingBuffer: false,   // Save memory
        failIfMajorPerformanceCaveat: false, // Don't fall back to software rendering
        stencil: false,                 // Disable stencil buffer if not needed
        depth: true                     // Keep depth buffer for 3D particles
      }}

      // Performance settings
      // linear={true}                     // Linear color space
      // frameloop="always"                // Continuous rendering

      // Safari iframe specific optimizations
      resize={{ scroll: false }}       // Optimize resize handling
      dpr={[1, 2]}                     // Limit pixel ratio for performance
    >
      <App />
    </Canvas>
  )
}

// Render the Canvas component
root.render(<CanvasApp />)