import * as THREE from 'three'
import { Canvas, events } from '@react-three/fiber' // Add events import
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Detect Safari for conditional optimizations
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

function Main() {
  return (
    <Canvas
      // Camera settings
      camera={{ fov: 25, position: [0, 0, 3] }}

      // GL context settings optimized for Safari
      gl={{
        alpha: true,
        antialias: !isSafari, // Disable on Safari for better iframe performance
        powerPreference: "high-performance",
        desynchronized: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false,
        stencil: false,
        depth: true,
        // Safari-specific optimizations
        ...(isSafari && {
          // Force discrete GPU on Safari if available
          powerPreference: "high-performance",
          // Reduce alpha complexity
          premultipliedAlpha: true,
          // Conservative pixel ratio
          pixelRatio: Math.min(window.devicePixelRatio, isMobile ? 1 : 2)
        })
      }}

      // Performance settings
      linear={true}
      frameloop="always" // Equivalent to your current setup

      // Built-in resize handling (better than manual)
      resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}

      // Event handling optimizations
      events={(store) => ({
        ...events(store),
        // Optimize event handling for Safari iframes
        filter: isSafari ? (intersections, state) => {
          // Reduce event processing overhead on Safari
          return intersections.slice(0, 1); // Only process first intersection
        } : undefined
      })}

      // Performance monitoring and optimizations
      onCreated={({ gl, camera, scene, size }) => {
        if (isSafari) {
          console.log('Canvas created - applying Safari optimizations...');

          // Set conservative pixel ratio for Safari
          const pixelRatio = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);
          gl.setPixelRatio(pixelRatio);

          // Apply canvas optimizations
          const canvas = gl.domElement;
          canvas.style.willChange = 'contents';
          canvas.style.transform = 'translateZ(0)';

          // Force hardware acceleration
          gl.outputColorSpace = THREE.SRGBColorSpace;

          // Optimize for Safari's compositor
          if (isMobile) {
            // Mobile Safari specific optimizations
            canvas.style.webkitTransform = 'translate3d(0,0,0)';
            canvas.style.webkitBackfaceVisibility = 'hidden';
          }

          console.log('WebGL version:', gl.capabilities.isWebGL2 ? 'WebGL2' : 'WebGL1');
        }
      }}

      // Error handling for Safari compatibility
      onError={(error) => {
        console.warn('Canvas error (possibly Safari-related):', error);
        // Could implement fallback here
      }}
    >
      <App />
    </Canvas>
  );
}

// Export for use in your main file
export default Main;





const container = document.getElementById('root')
const root = createRoot(container)
root.render(<Main />)