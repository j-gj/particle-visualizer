import * as THREE from 'three/webgpu';
import { useMemo, useRef } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { compute, storage, uniform, vec4, float } from 'three/tsl';
import './shaders/simulationMaterial';
import './shaders/dofPointsMaterial';

// Extend RTF with WebGPU compute pass
extend({ WebGPUComputePass });

// Helper to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : null;
}

// Helper to create random positions
function getRandomSphere(count) {
  const data = new Float32Array(count * 4);
  for (let i = 0; i < count * 4; i += 4) {
    data[i] = (Math.random() - 0.5) * 4;
    data[i + 1] = (Math.random() - 0.5) * 4;
    data[i + 2] = (Math.random() - 0.5) * 4;
    data[i + 3] = 1;
  }
  return data;
}

export function Particles({
  frequency = 0.2,
  speedFactor = 50,
  fov = 60,
  blur = 30,
  focus = 5,
  size = 256,
  gradientColors = ['#ffffff', '#637AFF', '#ffffff', '#372CD5'],
  gradientStops = [0.0, 0.3, 0.7, 1.0],
  gradientRadius = 2.0,
  ...props
}) {
  const renderRef = useRef();

  // Create storage buffer for positions
  const positionsBuffer = useMemo(() => {
    const buffer = new THREE.StorageBufferAttribute(getRandomSphere(size * size), 4);
    buffer.setUsage(THREE.StorageBufferUsage);
    return buffer;
  }, [size]);

  // Generate particle positions as UV coordinates for rendering
  const particles = useMemo(() => {
    const length = size * size;
    const particles = new Float32Array(length * 3);
    for (let i = 0; i < length; i++) {
      const i3 = i * 3;
      particles[i3 + 0] = (i % size) / size;
      particles[i3 + 1] = Math.floor(i / size) / size;
      particles[i3 + 2] = 0;
    }
    return particles;
  }, [size]);

  // Convert gradient colors to uniform format
  const gradientData = useMemo(() => {
    const colors = gradientColors.map((color) => {
      const rgb = hexToRgb(color);
      return [rgb.r, rgb.g, rgb.b];
    });
    return {
      colors: new Float32Array(colors.flat()),
      stops: new Float32Array(gradientStops),
    };
  }, [gradientColors, gradientStops]);

  // Uniforms for compute and render
  const uFrequency = uniform(frequency);
  const uTime = uniform(0);

  // Create compute pass
  const computePass = useMemo(
    () =>
      new THREE.WebGPUComputePass(
        'simulation',
        compute(
          THREE.SimulationMaterial([storage(positionsBuffer), uFrequency, uTime]),
          Math.ceil(size * size / 64), // Workgroup size
          1,
          1
        )
      ),
    [positionsBuffer, size]
  );

  // Particle geometry using storage buffer
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', positionsBuffer);
    return geom;
  }, [positionsBuffer]);

  useFrame(({ gl, clock }) => {
    if (!renderRef.current) return;

    // Update compute uniforms
    uTime.value = clock.elapsedTime * speedFactor;
    uFrequency.value = THREE.MathUtils.lerp(uFrequency.value, frequency, 0.1);

    // Run compute pass
    gl.compute(computePass);

    // Update render material uniforms
    renderRef.current.uniforms.uTime.value = clock.elapsedTime;
    renderRef.current.uniforms.uFocus.value = focus;
    renderRef.current.uniforms.uFov.value = fov;
    renderRef.current.uniforms.uBlur.value = blur;
    renderRef.current.uniforms.uGradientColors.value = gradientData.colors;
    renderRef.current.uniforms.uGradientStops.value = gradientData.stops;
    renderRef.current.uniforms.uGradientRadius.value = gradientRadius;
  });

  return (
    <points {...props} geometry={geometry}>
      <depthOfFieldMaterial ref={renderRef} />
    </points>
  );
}