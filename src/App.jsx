import { OrbitControls } from '@react-three/drei'
import { useControls } from 'leva'
import { Particles } from './Particles'
import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'

export default function App() {
  // Read URL parameters
  const urlParams = new URLSearchParams(window.location.search)
  const themeFromUrl = urlParams.get('theme') // 'light' or 'dark'
  const bgColorFromUrl = urlParams.get('bg') // hex color without #

  // Set background based on theme
  const getBackgroundColor = () => {
    if (bgColorFromUrl) return `#${bgColorFromUrl}`
    return themeFromUrl === 'light' ? '#ffffff' : '#000000'
  }
  
  // Set particle colors based on theme
  const getParticleColors = () => {
    if (themeFromUrl === 'light') {
      return {
        gradientColor1: '#0B85F8',
        gradientColor2: '#637AFF',
        gradientColor3: '#372CD5',
        gradientColor4: '#0B85F8'
      }
    }
    // Dark theme colors
    return {
      gradientColor1: '#0B85F8',
      gradientColor2: '#637AFF', 
      gradientColor3: '#372CD5',
      gradientColor4: '#0B85F8'
    }
  }

  // Only show controls in development
  const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
  const controlValues = isDev ? useControls({
    frequency: { value: 0.15, min: 0, max: 1,  step: 0.001 },
    speedFactor: { value: 4, min: 0.1, max: 100, step: 0.1 },
    fov: { value: 35, min: 0, max: 200 },
    blur: { value: 25, min: 0, max: 50, step: 0.1 },
    focus: { value: 3.45, min: 3, max: 7, step: 0.01 },
    backgroundColor: { value: getBackgroundColor() },
    initialCameraZ: { value: 2.5, min: 0.5, max: 10, step: 0.1 },
    // Gradient controls
    ...getParticleColors(),
    gradientStop1: { value: 0.6, min: 0, max: 1, step: 0.01 },
    gradientStop2: { value: 0.65, min: 0, max: 1, step: 0.01 },
    gradientStop3: { value: 0.75, min: 0, max: 1, step: 0.01 },
    gradientStop4: { value: 0.8, min: 0, max: 1, step: 0.01 },
    gradientRadius: { value: 1.35, min: 1.35, max: 2, step: 0.01 }
  }) : {
    // Default values for production
    frequency: 0.15,
    speedFactor: 4,
    fov: 35,
    blur: 21,
    focus: 3.45,
    backgroundColor: '#000000',
    initialCameraZ: 2.5,
    ...getParticleColors(),
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

  // Update background color
  useEffect(() => {
    document.body.style.background = backgroundColor
  }, [backgroundColor])

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