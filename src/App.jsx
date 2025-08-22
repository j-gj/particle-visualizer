import { OrbitControls } from '@react-three/drei'
import { useControls } from 'leva'
import { Particles } from './Particles'
import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'

export default function App() {
  // Read URL parameters
  const urlParams = new URLSearchParams(window.location.search)
  const bgFromUrl = urlParams.get('bg')
  const gc1FromUrl = urlParams.get('gc1')
  const gc2FromUrl = urlParams.get('gc2')
  const gc3FromUrl = urlParams.get('gc3')
  const gc4FromUrl = urlParams.get('gc4')
  const densityFromUrl = urlParams.get('d')
  const speedFromUrl = urlParams.get('s')
  const rotationFromUrl = urlParams.get('r')
  const transparentBg = urlParams.get('transparent') === 'true'
  const rotationVerticalParam = urlParams.get('rotationVertical')

  // Enhanced device detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  const isInIframe = window.self !== window.top
  const isFramer = window.location.href.includes('framer') || window.parent?.location?.href?.includes('framer')
  
  // Detect if we're in a problematic environment (Safari + iframe/Framer)
  const isProblematicEnvironment = (isSafari && isInIframe) || isFramer
  
  // Adjust sizes based on environment
  const safariSizes = isMobile ? 64 : 128
  const otherBrowserSizes = isMobile ? 128 : 256
  const actualSize = isSafari ? safariSizes : otherBrowserSizes  // Use less on mobile, otherwise use prop
  console.log('isSafari', isSafari,'actualSize', actualSize)
  
  console.log('Environment:', { isSafari, isMobile, isInIframe, isFramer, isProblematicEnvironment, actualSize })

  // Determine vertical rotation: URL param takes priority, otherwise auto-detect based on device
  const enableVRotation = rotationVerticalParam !== null
    ? rotationVerticalParam === 'true'
    : !isMobile // Enable on desktop by default, disable on mobile

  // Helper function to add # to hex colors
  const formatHexColor = (color) => color ? `#${color}` : null
  
  // Reduce default values for problematic environments
  const rotation = rotationFromUrl ? parseFloat(rotationFromUrl) : (isProblematicEnvironment ? 0.1 : 0.3)
  const density = densityFromUrl ? parseFloat(densityFromUrl) : (isProblematicEnvironment ? 0.05 : 0.15)
  const speed = speedFromUrl ? parseFloat(speedFromUrl) : (isProblematicEnvironment ? 1 : 4)

  // Only show controls in development
  const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
  const controlValues = isDev ? useControls({
    frequency: { value: density, min: 0, max: 1, step: 0.001 },
    speedFactor: { value: speed, min: 0.1, max: 100, step: 0.1 },
    fov: { value: 35, min: 0, max: 200 },
    blur: { value: isProblematicEnvironment ? 5 : 25, min: 0, max: 50, step: 0.1 },
    focus: { value: 3.45, min: 3, max: 7, step: 0.01 },
    backgroundColor: { value: transparentBg ? 'transparent' : (formatHexColor(bgFromUrl) || '#000000') },
    initialCameraZ: { value: 2.5, min: 0.5, max: 10, step: 0.1 },
    rotationSpeed: { value: rotation, min: 0, max: 5, step: 0.1 },
    enableVerticalRotation: { value: enableVRotation },
    performanceMode: { value: isProblematicEnvironment },
    // Gradient controls
    gradientColor1: { value: formatHexColor(gc1FromUrl) || '#F0F4FF' },
    gradientColor2: { value: formatHexColor(gc2FromUrl) || '#637AFF' },
    gradientColor3: { value: formatHexColor(gc3FromUrl) || '#372CD5' },
    gradientColor4: { value: formatHexColor(gc4FromUrl) || '#F0F4FF' },
    gradientStop1: { value: 0.6, min: 0, max: 1, step: 0.01 },
    gradientStop2: { value: 0.65, min: 0, max: 1, step: 0.01 },
    gradientStop3: { value: 0.75, min: 0, max: 1, step: 0.01 },
    gradientStop4: { value: 0.8, min: 0, max: 1, step: 0.01 },
    gradientRadius: { value: 1.35, min: 1.35, max: 2, step: 0.01 }
  }) : {
    // Default values for production
    frequency: density,
    speedFactor: speed,
    fov: 35,
    blur: isProblematicEnvironment ? 5 : 21,
    focus: 3.45,
    backgroundColor: transparentBg ? 'transparent' : (formatHexColor(bgFromUrl) || '#000000'),
    initialCameraZ: 2.5,
    rotationSpeed: rotation,
    enableVerticalRotation: enableVRotation,
    performanceMode: isProblematicEnvironment,
    gradientColor1: formatHexColor(gc1FromUrl) || '#F0F4FF',
    gradientColor2: formatHexColor(gc2FromUrl) || '#637AFF',
    gradientColor3: formatHexColor(gc3FromUrl) || '#372CD5',
    gradientColor4: formatHexColor(gc4FromUrl) || '#F0F4FF',
    gradientStop1: 0.6,
    gradientStop2: 0.65,
    gradientStop3: 0.75,
    gradientStop4: 0.8,
    gradientRadius: 1.35
  }

  const {
    frequency,
    speedFactor,
    fov,
    blur,
    focus,
    backgroundColor,
    initialCameraZ,
    rotationSpeed,
    enableVerticalRotation,
    performanceMode,
    // Gradient controls
    gradientColor1,
    gradientColor2,
    gradientColor3,
    gradientColor4,
    gradientStop1,
    gradientStop2,
    gradientStop3,
    gradientStop4,
    gradientRadius
  } = controlValues

  const { camera, gl } = useThree()
  const controlsRef = useRef()

  // Throttle frame updates for problematic environments
  const frameCount = useRef(0)
  const shouldSkipFrame = isProblematicEnvironment && (frameCount.current % 2 === 0)

  // Use useFrame to pass delta time to OrbitControls.update()
  useFrame((state, delta) => {
    frameCount.current++
    
    if (shouldSkipFrame) return
    
    if (controlsRef.current) {
      // Pass delta time to make autoRotate frame-rate independent
      controlsRef.current.update(delta)
    }
  })

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Update camera aspect ratio
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()

      // Update renderer size
      gl.setSize(window.innerWidth, window.innerHeight)
      gl.setPixelRatio(Math.min(window.devicePixelRatio, isProblematicEnvironment ? 1 : 2))
    }

    // Add event listener
    window.addEventListener('resize', handleResize)

    // Initial setup
    handleResize()

    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [camera, gl, isProblematicEnvironment])

  // Update background color (or make transparent)
  useEffect(() => {
    if (transparentBg) {
      document.body.style.background = 'transparent'
      document.body.style.backgroundColor = 'transparent'
      // Also make the canvas container transparent
      const canvas = document.querySelector('canvas')
      if (canvas && canvas.parentElement) {
        canvas.parentElement.style.background = 'transparent'
      }
    } else {
      document.body.style.background = backgroundColor
    }
  }, [backgroundColor, transparentBg])

  // Update camera position when initialCameraZ changes
  useEffect(() => {
    camera.position.set(0, 0, initialCameraZ)
  }, [initialCameraZ, camera])

  // Simplified GPU warmup for problematic environments
  useEffect(() => {
    if (isProblematicEnvironment) return // Skip warmup in problematic environments
    
    const warmUpGPU = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, `
          attribute vec2 position;
          void main() {
            gl_Position = vec4(position, 0.0, 1.0);
          }
        `);
        gl.compileShader(vertexShader);
        
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, `
          precision mediump float;
          void main() {
            gl_FragColor = vec4(1.0);
          }
        `);
        gl.compileShader(fragmentShader);
        
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        gl.useProgram(program);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.finish();
        
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
      }
      
      canvas.remove();
    };
    
    const timeoutId = setTimeout(warmUpGPU, 0);
    return () => clearTimeout(timeoutId);
  }, [isProblematicEnvironment]);

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        autoRotate={true}
        autoRotateSpeed={rotationSpeed}
        enableZoom={false}
        enableDamping={true}
        dampingFactor={isProblematicEnvironment ? 0.1 : 0.05}
        enableRotate={true}
        minPolarAngle={enableVRotation ? 0 : Math.PI / 2}
        maxPolarAngle={enableVRotation ? Math.PI : Math.PI / 2}
      />
      <ambientLight />
      <Particles
        frequency={frequency}
        speedFactor={speedFactor}
        fov={fov}
        blur={blur}
        focus={focus}
        position={[0, 0, 0]}
        size={actualSize}
        performanceMode={performanceMode}
        // Pass gradient props
        gradientColors={[gradientColor1, gradientColor2, gradientColor3, gradientColor4]}
        gradientStops={[gradientStop1, gradientStop2, gradientStop3, gradientStop4]}
        gradientRadius={gradientRadius}
      />
    </>
  )
}