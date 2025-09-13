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
  const particlesFromUrl = urlParams.get('particles')

  // Detect if device is mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const safariSizes = isMobile ? 128 : 320
  const otherBrowserSizes = isMobile ? 128 : 400
  const actualSize = isSafari ? safariSizes : otherBrowserSizes  // Use less on mobile, otherwise use prop
  const shouldRotate = isSafari ? true : true;
  console.log('isSafari', isSafari, 'actualSize', actualSize)
  // Determine vertical rotation: URL param takes priority, otherwise auto-detect based on device
  const enableVRotation = rotationVerticalParam !== null
    ? rotationVerticalParam === 'true'
    : !isMobile // Enable on desktop by default, disable on mobile

  // Helper function to add # to hex colors
  const formatHexColor = (color) => color ? `#${color}` : null
  const rotation = rotationFromUrl ? parseFloat(rotationFromUrl) : 0.3
  const d = densityFromUrl ? parseFloat(densityFromUrl) : 0.15
  const speed = speedFromUrl ? parseFloat(speedFromUrl) : 1
  const particlesOverride = particlesFromUrl ? parseFloat(particlesFromUrl) : actualSize

  const colorOptions = {
    White: "#fff",
    Black: "#000",
    Brand_Primary: "#372CD5",
    Brand_Secondary: "#637AFF",
    Brand_Tertiary: "#050033",
    Accent1: "#F0F4FF",
    Accent2: "#1607ED",
    Accent3: "#9FADED"
  }

  // Only show controls in development
  // const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
  const isDev = 'true'
  const controlValues = isDev ? useControls({
    density: { value: d, min: 0, max: 1, step: 0.001 },
    speedFactor: { value: speed, min: 0.1, max: 100, step: 0.1 },
    fov: { value: 35, min: 0, max: 200 },
    blur: { value: 24, min: 0, max: 50, step: 0.1 },
    focus: { value: 6.7, min: 3, max: 10, step: 0.01 },
    cameraZ: { value: 6, min: 0.5, max: 15, step: 0.1 },
    // Add rotation speed control for dev mode
    rotationSpeed: { value: rotation, min: 0, max: 5, step: 0.1 },
    enableVerticalRotation: { value: enableVRotation },
    backgroundColor: { value: transparentBg ? 'transparent' : (formatHexColor(bgFromUrl) || colorOptions.White), options: colorOptions },
    // Gradient controls
    gradient1: { value: formatHexColor(gc1FromUrl) || colorOptions.Accent1, options: colorOptions },
    gradient2: { value: formatHexColor(gc2FromUrl) || colorOptions.Brand_Primary, options: colorOptions },
    gradient3: { value: formatHexColor(gc3FromUrl) || colorOptions.Brand_Secondary, options: colorOptions },
    gradient4: { value: formatHexColor(gc4FromUrl) || colorOptions.Brand_Tertiary, options: colorOptions },
    gradientStop1: { value: 0.6, min: 0, max: 1, step: 0.01 },
    gradientStop2: { value: 0.65, min: 0, max: 1, step: 0.01 },
    gradientStop3: { value: 0.75, min: 0, max: 1, step: 0.01 },
    gradientStop4: { value: 0.8, min: 0, max: 1, step: 0.01 },
    gradientRadius: { value: 1.35, min: 1.35, max: 2, step: 0.01 }
  }) : {
    // Default values for production
    density: d,
    speedFactor: speed,
    fov: 35,
    blur: 24,
    focus: 6.7,
    cameraZ: 6,
    rotationSpeed: rotation,
    enableVerticalRotation: enableVRotation,
    backgroundColor: transparentBg ? 'transparent' : (formatHexColor(bgFromUrl) || '#fff'),
    gradient1: formatHexColor(gc1FromUrl) || '#372cd5',
    gradient2: formatHexColor(gc2FromUrl) || '#637aff',
    gradient3: formatHexColor(gc3FromUrl) || '#1e10e2',
    gradient4: formatHexColor(gc4FromUrl) || '#050033',
    gradientStop1: 0.6,
    gradientStop2: 0.65,
    gradientStop3: 0.75,
    gradientStop4: 0.8,
    gradientRadius: 1.35
  }

  const {
    density,
    speedFactor,
    fov,
    blur,
    focus,
    cameraZ,
    rotationSpeed,
    enableVerticalRotation,
    backgroundColor,
    // New gradient controls
    gradient1,
    gradient2,
    gradient3,
    gradient4,
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
    // if (isSafari && frameCount.current % 2 === 0) {
    //   return; // Skip every other frame
    // }
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

  // Update camera position when cameraZ changes
  useEffect(() => {
    camera.position.set(0, 0, cameraZ)
  }, [cameraZ, camera])

  //make sure controls stay on top
  useEffect(() => {
    // try common leva selectors and bump z-index so panel is never covered by canvas
    const levaSelectors = ['.leva', '.leva__container', '.leva-panel', '.leva__panel']
    for (const s of levaSelectors) {
      const node = document.querySelector(s)
      if (node) {
        node.style.zIndex = '999999'
        node.style.position = 'fixed'
        break
      }
    }

    const canvas = document.querySelector('canvas')
    if (canvas) {
      canvas.style.position = canvas.style.position || 'relative'
      canvas.style.zIndex = canvas.style.zIndex || '0'
    }
  }, [])

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
        frequency={density}
        speedFactor={speedFactor}
        fov={fov}
        blur={blur}
        focus={focus}
        position={[0, 0, 0]}
        size={particlesOverride}
        // Pass gradient props
        gradientColors={[gradient1, gradient2, gradient3, gradient4]}
        gradientStops={[gradientStop1, gradientStop2, gradientStop3, gradientStop4]}
        gradientRadius={gradientRadius}
        backgroundColor={backgroundColor}
        transparentBg={transparentBg}
      />
    </>
  )
}