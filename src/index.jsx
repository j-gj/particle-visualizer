import React, { useEffect } from "react"
import { createRoot } from "react-dom/client"
import { Canvas, useThree } from "@react-three/fiber"
import App from "./App.jsx"

const root = createRoot(document.getElementById("root"))

function VideoFrameLoop() {
  const { invalidate, gl } = useThree()

  useEffect(() => {
    let handle

    const renderLoop = (now, metadata) => {
      invalidate() // tell R3F to render one frame
      // Safari-only API, fallback to RAF if missing
      if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) {
        handle = gl.domElement.requestVideoFrameCallback(renderLoop)
      } else {
        handle = requestAnimationFrame(renderLoop)
      }
    }

    // Kick off the loop
    if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) {
      handle = gl.domElement.requestVideoFrameCallback(renderLoop)
    } else {
      handle = requestAnimationFrame(renderLoop)
    }

    return () => {
      if (gl.domElement.cancelVideoFrameCallback && handle) {
        gl.domElement.cancelVideoFrameCallback(handle)
      } else if (handle) {
        cancelAnimationFrame(handle)
      }
    }
  }, [invalidate, gl])

  return null
}

function CanvasApp() {
  return (
    <Canvas
      frameloop="never" // important: disable default loop
      camera={{ fov: 35, position: [0, 0, 7.6] }}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        desynchronized: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false,
        stencil: false,
        depth: true,
      }}
      resize={{ scroll: false }}
      dpr={[1, 2]}
    >
      <App />
      <VideoFrameLoop /> {/* custom render driver */}
    </Canvas>
  )
}

root.render(<CanvasApp />)