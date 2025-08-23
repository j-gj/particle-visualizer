import React from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import './styles.css';
import App from './App.jsx';

const root = createRoot(document.getElementById('root'));

function CanvasApp() {
  return (
    <Canvas
      camera={{ fov: 25, position: [0, 0, 2.5] }}
      gl={{
        alpha: false,                      // Unless you need transparent background
        antialias: false,                  // Use postprocessing AA instead
        powerPreference: "high-performance",
        desynchronized: true,              // Chrome benefit, ignored by Safari
        premultipliedAlpha: true,          // Default; better Safari compositing
        preserveDrawingBuffer: false,      // Faster, lower memory
        failIfMajorPerformanceCaveat: false,
        stencil: false,
        depth: true
      }}
      linear={true}
      frameloop="always"
      resize={{ scroll: false }}
      dpr={[1, 2]}
    >
      <App />
    </Canvas>
  );
}

root.render(<CanvasApp />);