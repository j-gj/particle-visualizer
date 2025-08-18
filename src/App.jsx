import { OrbitControls } from '@react-three/drei'
import { useControls } from 'leva'
import { Particles } from './Particles'
import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'

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
  const transparentBg = urlParams.get('transparent') === 'true'

  // Helper function to add # to hex colors
  const formatHexColor = (color) => color ? `#${color}` : null

  // Only show controls in development
  const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
  const controlValues = isDev ? useControls({
    frequency: { value: densityFromUrl ? parseFloat(densityFromUrl) : 0.15, min: 0, max: 1, step: 0.001 },
    speedFactor: { value: speedFromUrl ? parseFloat(speedFromUrl) : 4, min: 0.1, max: 100, step: 0.1 },
    fov: { value: 35, min: 0, max: 200 },
    blur: { value: 25, min: 0, max: 50, step: 0.1 },
    focus: { value: 3.45, min: 3, max: 7, step: 0.01 },
    backgroundColor: { value: transparentBg ? 'transparent' : (formatHexColor(bgFromUrl) || '#000000') },
    initialCameraZ: { value: 2.5, min: 0.5, max: 10, step: 0.1 },
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
    frequency: densityFromUrl ? parseFloat(densityFromUrl) : 0.15,
    speedFactor: speedFromUrl ? parseFloat(speedFromUrl) : 4,
    fov: 35,
    blur: 21,
    focus: 3.45,
    backgroundColor: transparentBg ? 'transparent' : (formatHexColor(bgFromUrl) || '#000000'),
    initialCameraZ: 2.5,
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

  const { camera, gl } = useThree()
  const controlsRef = useRef()


  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Update camera aspect ratio
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()

      // Update renderer size
      gl.setSize(window.innerWidth, window.innerHeight)
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }

    // Add event listener
    window.addEventListener('resize', handleResize)

    // Initial setup
    handleResize()

    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [camera, gl])

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



  return (
    <>
      <OrbitControls ref={controlsRef} makeDefault autoRotate autoRotateSpeed={1.4} enableZoom={false} />
      <ambientLight />
      <Particles
        frequency={frequency}
        speedFactor={speedFactor}
        fov={fov}
        blur={blur}
        focus={focus}
        position={[0, 0, 0]}
        // Pass gradient props
        gradientColors={[gradientColor1, gradientColor2, gradientColor3, gradientColor4]}
        gradientStops={[gradientStop1, gradientStop2, gradientStop3, gradientStop4]}
        gradientRadius={gradientRadius}
      />
    </>
  )
}