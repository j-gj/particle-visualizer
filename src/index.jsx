import { WebGPURenderer } from 'three/webgpu'
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
      // Use WebGPURenderer instead of implicit WebGL
      renderer={() => new WebGPURenderer({
        alpha: true,
        antialias: true,
        // WebGPU-specific: Enables async compilation for faster startup
        forceSync: false,
        // Safari optimizations: Reduces power draw
        powerPreference: 'high-performance', // Still applicable
      })}
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