import * as THREE from 'three'
import { extend } from '@react-three/fiber'

class DepthOfFieldMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        positions: { value: null },
        pointSize: { value: 3 },
        uTime: { value: 0 },
        uFocus: { value: 4 },
        uFov: { value: 45 },
        uBlur: { value: 30 },
        uGradientColors: { value: new Float32Array([1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1]) }, // 4 RGB colors
        uGradientStops: { value: new Float32Array([0.0, 0.3, 0.7, 1.0]) }, // 4 stops
        uGradientRadius: { value: 2.0 }
      },
      vertexShader: `
        precision mediump float;
        uniform sampler2D positions;
        uniform float pointSize;
        uniform float uTime;
        uniform float uFocus;
        uniform float uFov;
        uniform float uBlur;
        uniform float uGradientRadius;
        varying float vDistance;
        varying float vGradientDistance;
        varying vec3 vWorldPosition;

        void main() {
          vec3 pos = texture2D(positions, position.xy).xyz;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          vec4 worldPosition = modelMatrix * vec4(pos, 1.0);

          gl_Position = projectionMatrix * mvPosition;

          vDistance = abs(uFocus - -mvPosition.z);
          vGradientDistance = length(worldPosition.xyz) / uGradientRadius;
          vWorldPosition = worldPosition.xyz;

          gl_PointSize = (step(1.0 - (1.0 / uFov), position.x)) * vDistance * uBlur;
        }
      `,
      fragmentShader: `
        precision mediump float;
        varying float vDistance;
        varying float vGradientDistance;
        varying vec3 vWorldPosition;
        uniform vec3 uGradientColors[4];
        uniform float uGradientStops[4];

        uniform float uTime; // Add the time uniform

        // Function to interpolate between gradient colors
        vec3 getGradientColor(float t) {
          // Clamp t to [0, 1]
          t = clamp(t, 0.0, 1.0);
          
          // Find which segment we're in
          if (t <= uGradientStops[0]) {
            return uGradientColors[0];
          } else if (t <= uGradientStops[1]) {
            float factor = (t - uGradientStops[0]) / (uGradientStops[1] - uGradientStops[0]);
            return mix(uGradientColors[0], uGradientColors[1], factor);
          } else if (t <= uGradientStops[2]) {
            float factor = (t - uGradientStops[1]) / (uGradientStops[2] - uGradientStops[1]);
            return mix(uGradientColors[1], uGradientColors[2], factor);
          } else if (t <= uGradientStops[3]) {
            float factor = (t - uGradientStops[2]) / (uGradientStops[3] - uGradientStops[2]);
            return mix(uGradientColors[2], uGradientColors[3], factor);
          } else {
            return uGradientColors[3];
          }
        }

        void main() {
          vec2 cxy = 2.0 * gl_PointCoord - 1.0;
          if (dot(cxy, cxy) > 1.0) discard;

          float alpha = (1.04 - clamp(vDistance, 0.0, 1.0));

          // Add a sinusoidal time-based offset to the gradient lookup
          float timeOffset = sin(uTime * 0.5) * 0.1;
          vec3 gradientColor = getGradientColor(vGradientDistance + timeOffset);

          gl_FragColor = vec4(gradientColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false
    })
  }
}

extend({ DepthOfFieldMaterial })