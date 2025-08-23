import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame, extend } from '@react-three/fiber'

// Simple vertex shader for particle positioning
const vertexShader = `
  attribute vec3 position;
  attribute vec2 uv;
  
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uFrequency;
  uniform float uFocus;
  uniform float uFov;
  uniform float uBlur;
  
  varying float vDistance;
  varying vec3 vWorldPosition;
  varying float vGradientDistance;
  
  // Simplex noise function
  vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  
  vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  
  vec4 permute(vec4 x) {
    return mod289(((x*34.0)+1.0)*x);
  }
  
  vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
  }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  vec3 curlNoise(vec3 p) {
    float e = 0.1;
    vec3 dx = vec3(e, 0.0, 0.0);
    vec3 dy = vec3(0.0, e, 0.0);
    vec3 dz = vec3(0.0, 0.0, e);
    
    float p_x0 = snoise(p - dx);
    float p_x1 = snoise(p + dx);
    float p_y0 = snoise(p - dy);
    float p_y1 = snoise(p + dy);
    float p_z0 = snoise(p - dz);
    float p_z1 = snoise(p + dz);
    
    float x = p_y1 - p_y0 - p_z1 + p_z0;
    float y = p_z1 - p_z0 - p_x1 + p_x0;
    float z = p_x1 - p_x0 - p_y1 + p_y0;
    
    return normalize(vec3(x, y, z) / (2.0 * e));
  }
  
  void main() {
    // Create position from UV coordinates with noise
    vec3 pos = vec3((uv.x - 0.5) * 8.0, (uv.y - 0.5) * 8.0, sin(uv.x * 10.0) * 0.5);
    
    // Apply curl noise animation
    float time = uTime * 0.01;
    vec3 noisePos = pos * uFrequency + time;
    vec3 offset = curlNoise(noisePos) * 2.0;
    
    pos += offset;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vec4 worldPosition = vec4(pos, 1.0);
    
    vDistance = abs(uFocus - (-mvPosition.z));
    vWorldPosition = worldPosition.xyz;
    vGradientDistance = length(worldPosition.xyz) / 2.0;
    
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = (1.0 / uFov) * vDistance * uBlur;
  }
`

// Fragment shader for particle rendering
const fragmentShader = `
  uniform float uTime;
  uniform vec3 uGradientColors[4];
  uniform float uGradientStops[4];
  uniform float uGradientRadius;
  
  varying float vDistance;
  varying vec3 vWorldPosition;
  varying float vGradientDistance;
  
  vec3 getGradientColor(float t) {
    t = clamp(t, 0.0, 1.0);
    
    vec3 color = mix(uGradientColors[0], uGradientColors[1], 
                     smoothstep(uGradientStops[0], uGradientStops[1], t));
    color = mix(color, uGradientColors[2], 
                smoothstep(uGradientStops[1], uGradientStops[2], t));
    color = mix(color, uGradientColors[3], 
                smoothstep(uGradientStops[2], uGradientStops[3], t));
    
    return color;
  }
  
  void main() {
    vec2 cxy = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(cxy, cxy);
    
    if (r2 > 1.0) discard;
    
    float mask = 1.0 - smoothstep(0.95, 1.0, r2);
    float alpha = (1.04 - clamp(vDistance, 0.0, 1.0)) * mask;
    
    float timeOffset = sin(uTime * 0.5) * 0.1;
    vec3 gradientColor = getGradientColor(vGradientDistance + timeOffset);
    
    gl_FragColor = vec4(gradientColor, alpha);
  }
`

// Custom shader material
class ParticlesMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uFrequency: { value: 0.2 },
        uFocus: { value: 5 },
        uFov: { value: 60 },
        uBlur: { value: 30 },
        uGradientColors: { value: [
          new THREE.Vector3(1, 1, 1),
          new THREE.Vector3(0.39, 0.48, 1),
          new THREE.Vector3(0.22, 0.17, 0.83),
          new THREE.Vector3(1, 1, 1)
        ]},
        uGradientStops: { value: [0.0, 0.3, 0.7, 1.0] },
        uGradientRadius: { value: 2.0 }
      },
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false
    })
  }
}

extend({ ParticlesMaterial })

// Helper to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 1, g: 1, b: 1 }
}

export function Particles({
  frequency = 0.2,
  speedFactor = 50,
  fov = 60,
  blur = 30,
  focus = 5,
  size = 256,
  gradientColors = ['#ffffff', '#637AFF', '#372CD5', '#ffffff'],
  gradientStops = [0.0, 0.3, 0.7, 1.0],
  gradientRadius = 2.0,
  ...props
}) {
  const materialRef = useRef()

  // Generate particle positions as UV coordinates
  const particles = useMemo(() => {
    const length = size * size
    const positions = new Float32Array(length * 3)
    const uvs = new Float32Array(length * 2)
    
    for (let i = 0; i < length; i++) {
      const i3 = i * 3
      const i2 = i * 2
      
      // Position (will be modified by shader)
      positions[i3 + 0] = (Math.random() - 0.5) * 4
      positions[i3 + 1] = (Math.random() - 0.5) * 4
      positions[i3 + 2] = (Math.random() - 0.5) * 4
      
      // UV coordinates for noise calculation
      uvs[i2 + 0] = (i % size) / size
      uvs[i2 + 1] = Math.floor(i / size) / size
    }
    
    return { positions, uvs }
  }, [size])

  // Convert gradient colors to Three.js vectors
  const gradientData = useMemo(() => {
    const colors = gradientColors.map((color) => {
      const rgb = hexToRgb(color)
      return new THREE.Vector3(rgb.r, rgb.g, rgb.b)
    })
    return colors
  }, [gradientColors])

  // Create geometry
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.Float32BufferAttribute(particles.positions, 3))
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(particles.uvs, 2))
    return geom
  }, [particles])

  useFrame(({ clock }) => {
    if (!materialRef.current) return

    // Update uniforms
    materialRef.current.uniforms.uTime.value = clock.elapsedTime * speedFactor * 0.01
    materialRef.current.uniforms.uFrequency.value = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uFrequency.value, 
      frequency, 
      0.1
    )
    materialRef.current.uniforms.uFocus.value = focus
    materialRef.current.uniforms.uFov.value = 1.0 / fov
    materialRef.current.uniforms.uBlur.value = blur
    materialRef.current.uniforms.uGradientColors.value = gradientData
    materialRef.current.uniforms.uGradientStops.value = gradientStops
    materialRef.current.uniforms.uGradientRadius.value = gradientRadius
  })

  return (
    <points {...props} geometry={geometry}>
      <particlesMaterial ref={materialRef} />
    </points>
  )
}