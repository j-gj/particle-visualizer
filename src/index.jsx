import React from "react"
import { createRoot } from "react-dom/client"
import { Canvas } from "@react-three/fiber"
import App from "./App.jsx"

const root = createRoot(document.getElementById("root"))

function CanvasApp() {
  return (
    <Canvas
      frameloop="never" // important: disable default loop
      camera={{ fov: 35, position: [0, 0, 7.6] }}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        desynchronized: true,           // Reduces input lag
        premultipliedAlpha: false,      // Better color handling
        preserveDrawingBuffer: false,   // Save memory
        failIfMajorPerformanceCaveat: false, // Don't fall back to software rendering
        stencil: false,                 // Disable stencil buffer if not needed
        depth: true                     // Keep depth buffer for 3D particles
      }}
      resize={{ scroll: false }}
      dpr={[1, 2]}
    >
      <App />
    </Canvas>
  )
}

root.render(<CanvasApp />)