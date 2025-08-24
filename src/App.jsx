import { OrbitControls } from '@react-three/drei'
import { useControls } from 'leva'
import { Particles } from './Particles'
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber' // Added useThree back for camera control

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

  // Detect if device is mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const safariSizes = isMobile ? 128 : 256
  const otherBrowserSizes = isMobile ? 128 : 300
  const actualSize = isSafari ? safariSizes : otherBrowserSizes  // Use less on mobile, otherwise use prop
  const shouldRotate = isSafari ? false : true;
  console.log('isSafari', isSafari, 'actualSize', actualSize)
  // Determine vertical rotation: URL param takes priority, otherwise auto-detect based on device
  const enableVRotation = rotationVerticalParam !== null
    ? rotationVerticalParam === 'true'
    : !isMobile // Enable on desktop by default, disable on mobile

  // Helper function to add # to hex colors
  const formatHexColor = (color) => color ? `#${color}` : null
  const rotation = rotationFromUrl ? parseFloat(rotationFromUrl) : 0.3
  const density = densityFromUrl ? parseFloat(densityFromUrl) : 0.15
  const speed = speedFromUrl ? parseFloat(speedFromUrl) : 4

  // Only show controls in development
  const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
  // const isDev = 'true'
  const controlValues = isDev ? useControls({
    frequency: { value: density, min: 0, max: 1, step: 0.001 },
    speedFactor: { value: speed, min: 0.1, max: 100, step: 0.1 },
    fov: { value: 35, min: 0, max: 200 },
    blur: { value: 24, min: 0, max: 50, step: 0.1 },
    focus: { value: 8.7, min: 3, max: 10, step: 0.01 },
    backgroundColor: { value: transparentBg ? 'transparent' : (formatHexColor(bgFromUrl) || '#fff') },
    initialCameraZ: { value: 7.6, min: 0.5, max: 15, step: 0.1 },
    // Add rotation speed control for dev mode
    rotationSpeed: { value: rotation, min: 0, max: 5, step: 0.1 },
    enableVerticalRotation: { value: enableVRotation },
    // Gradient controls
    gradientColor1: { value: formatHexColor(gc1FromUrl) || '#99A6F0' },
    gradientColor2: { value: formatHexColor(gc2FromUrl) || '#637AFF' },
    gradientColor3: { value: formatHexColor(gc3FromUrl) || '#372CD5' },
    gradientColor4: { value: formatHexColor(gc4FromUrl) || '#070245' },
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
    blur: 24,
    focus: 8.7,
    backgroundColor: transparentBg ? 'transparent' : (formatHexColor(bgFromUrl) || '#000000'),
    initialCameraZ: 7.6,
    rotationSpeed: rotation,
    enableVerticalRotation: enableVRotation,
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
    // New gradient controls
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

  const { camera } = useThree() // Get camera reference for position control
  const controlsRef = useRef()
  const frameCount = useRef(0);

  // Use useFrame to pass delta time to OrbitControls.update()
  useFrame((state, delta) => {
    frameCount.current++;
    // Skip frames on Safari in iframe to reduce load
    if (isSafari && frameCount.current % 2 === 0) {
      return; // Skip every other frame
    }
    if (controlsRef.current) {
      // Pass delta time to make autoRotate frame-rate independent
      controlsRef.current.update(delta)
    }
  })

  // Handle background color for transparent mode
  useEffect(() => {
    if (transparentBg) {
      document.body.style.background = 'transparent'
      document.body.style.backgroundColor = 'transparent'
      // Find the canvas and make its container transparent
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

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        autoRotate={shouldRotate}
        autoRotateSpeed={rotationSpeed}
        enableZoom={false}
        enableDamping={true}
        dampingFactor={0.05}
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
        // Pass gradient props
        gradientColors={[gradientColor1, gradientColor2, gradientColor3, gradientColor4]}
        gradientStops={[gradientStop1, gradientStop2, gradientStop3, gradientStop4]}
        gradientRadius={gradientRadius}
      />
    </>
  )
}