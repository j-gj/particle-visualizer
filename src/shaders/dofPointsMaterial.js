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
        uGradientRadius: { value: 2.0 },
        // Add performance mode toggle
        uPerformanceMode: { value: 1.0 } // 1.0 = high performance, 0.0 = high quality
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
        uniform float uPerformanceMode;
        varying float vDistance;
        varying float vGradientDistance;
        varying vec3 vWorldPosition;

        void main() {
          vec3 pos = texture2D(positions, position.xy).xyz;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          vec4 worldPosition = modelMatrix * vec4(pos, 1.0);

          gl_Position = projectionMatrix * mvPosition;

          // Simplified distance calculation for performance mode
          if (uPerformanceMode > 0.5) {
            vDistance = abs(uFocus - (-mvPosition.z));
            vGradientDistance = length(worldPosition.xyz) / uGradientRadius;
          } else {
            vDistance = abs(uFocus - (-mvPosition.z));
            vGradientDistance = length(worldPosition.xyz) / uGradientRadius;
          }
          
          vWorldPosition = worldPosition.xyz;

          // Reduce point size calculation complexity
          float sizeFactor = mix(2.0, uBlur, uPerformanceMode);
          gl_PointSize = (step(1.0 - (1.0 / uFov), position.x)) * vDistance * sizeFactor;
        }
      `,
      fragmentShader: `
        precision mediump float;
        varying float vDistance;
        varying float vGradientDistance;
        varying vec3 vWorldPosition;
        uniform vec3 uGradientColors[4];
        uniform float uGradientStops[4];
        uniform float uTime;
        uniform float uPerformanceMode;

        // Simplified gradient function for performance
        vec3 getGradientColorFast(float t) {
          t = clamp(t, 0.0, 1.0);
          
          // Use only 2 colors in performance mode
          if (uPerformanceMode > 0.5) {
            return mix(uGradientColors[0], uGradientColors[2], t);
          }
          
          // Full gradient calculation for quality mode
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

          // Simplified alpha calculation
          float alpha = mix(
            (1.04 - clamp(vDistance, 0.0, 1.0)), // Full calculation
            0.8, // Fixed alpha for performance
            uPerformanceMode
          );

          // Simplified time animation
          float timeOffset = mix(
            sin(uTime * 0.5) * 0.1, // Full animation
            0.0, // No animation for performance
            uPerformanceMode
          );
          
          vec3 gradientColor = getGradientColorFast(vGradientDistance + timeOffset);

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