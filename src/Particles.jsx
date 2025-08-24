import * as THREE from 'three'
import { useMemo, useState, useRef, useEffect } from 'react'
import { createPortal, useFrame } from '@react-three/fiber'
import { useFBO } from '@react-three/drei'
import './simulationMaterial'
import './dofPointsMaterial'

// Helper function to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : null;
}

export function Particles({ 
  frequency = 0.2,
  speedFactor = 50, 
  fov = 60, 
  blur = 30, 
  focus = 5,
  size = 256, //will use what App.jsx gives it
  gradientColors = ['#ffffff', '#637AFF', '#ffffff', '#372CD5'],
  gradientStops = [0.0, 0.3, 0.7, 1.0],
  gradientRadius = 2.0,
  ...props 
}) {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  const simRef = useRef()
  const renderRef = useRef()
  const frameCount = useRef(0);

  //delay start
  const [ready, setReady] = useState(false);
  
  // Set up FBO scene
  const [scene] = useState(() => new THREE.Scene())
  const [camera] = useState(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1))
  const [positions] = useState(() => new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]))
  const [uvs] = useState(() => new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]))
  
  const target = useFBO(size, size, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    stencilBuffer: false,
    type: THREE.FloatType
  })
  
  // Generate particle positions as UV coordinates
  const particles = useMemo(() => {
    const length = size * size
    const particles = new Float32Array(length * 3)
    
    for (let i = 0; i < length; i++) {
      const i3 = i * 3
      particles[i3 + 0] = (i % size) / size      // u coordinate
      particles[i3 + 1] = Math.floor(i / size) / size  // v coordinate  
      particles[i3 + 2] = 0                      // z = 0
    }

    return particles
  }, [size])
  
  // Convert gradient colors to uniform format
  const gradientData = useMemo(() => {
    const colors = gradientColors.map(color => {
      const rgb = hexToRgb(color);
      return [rgb.r, rgb.g, rgb.b];
    });
    
    return {
      colors: new Float32Array(colors.flat()),
      stops: new Float32Array(gradientStops)
    };
  }, [gradientColors, gradientStops]);
  
  // Update simulation every frame
  useFrame(({ gl, clock }) => {
    if (ready === false) {
      console.log('not yet ready')
      return
    }
    frameCount.current++;
    if ((isSafari || isMobile) && frameCount.current % 2 === 0) return;
    if (!simRef.current || !renderRef.current) return
    
    // Render simulation to FBO
    gl.setRenderTarget(target)
    gl.clear()
    gl.render(scene, camera)
    gl.setRenderTarget(null)
    
    // Update render material
    renderRef.current.uniforms.positions.value = target.texture
    renderRef.current.uniforms.uFocus.value = focus
    renderRef.current.uniforms.uFov.value = fov
    renderRef.current.uniforms.uBlur.value = blur
    renderRef.current.uniforms.uGradientColors.value = gradientData.colors
    renderRef.current.uniforms.uGradientStops.value = gradientData.stops
    renderRef.current.uniforms.uGradientRadius.value = gradientRadius
    // In Particles.jsx -> useFrame
    renderRef.current.uniforms.uTime.value = clock.elapsedTime;
    
    // Update simulation material
    simRef.current.uniforms.uTime.value = clock.elapsedTime * speedFactor
    simRef.current.uniforms.uFrequency.value = THREE.MathUtils.lerp(
      simRef.current.uniforms.uFrequency.value, 
      frequency, 
      0.1
    )
  })

  //delay start
  useEffect(() => { setTimeout(() => setReady(true), 500); }, []);
  
  return (
    <>
      {/* Simulation mesh rendered to FBO */}
      {createPortal(
        <mesh>
          <simulationMaterial ref={simRef} args={[size]} />
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
            <bufferAttribute attach="attributes-uv" count={uvs.length / 2} array={uvs} itemSize={2} />
          </bufferGeometry>
        </mesh>,
        scene
      )}
      
      {/* Points using FBO texture for positions */}
      <points {...props}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={particles.length / 3} array={particles} itemSize={3} />
        </bufferGeometry>
        <depthOfFieldMaterial ref={renderRef} />
      </points>
    </>
  )
}