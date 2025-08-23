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
          vGradientDistance = length(worldPosition.xyz) / uGradientRadius; // Unchanged

          // Simplify step if possible; assuming it's for culling, but if always active, remove
          float sizeFactor = step(1.0 - (1.0 / uFov), position.x); // If this is often 1.0, consider const
          gl_PointSize = sizeFactor * vDistance * uBlur;
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

        vec3 getGradientColor(float t) {
          t = clamp(t, 0.0, 1.0);
          // Flattened mix chain instead of if-else for potentially better compiler optimization
          vec3 color = mix(uGradientColors[0], uGradientColors[1], smoothstep(uGradientStops[0], uGradientStops[1], t));
          color = mix(color, uGradientColors[2], smoothstep(uGradientStops[1], uGradientStops[2], t));
          color = mix(color, uGradientColors[3], smoothstep(uGradientStops[2], uGradientStops[3], t));
          return color;
        }

        void main() {
          vec2 cxy = 2.0 * gl_PointCoord - 1.0;
          float r2 = dot(cxy, cxy);
          // Replace discard with alpha modulation for better perf (avoids early-Z disable)
          if (r2 > 1.0) discard; // Keep as fallback, but prefer:
          float mask = 1.0 - smoothstep(0.95, 1.0, r2); // Soft edge; adjust 0.95 for sharpness match

          float alpha = (1.04 - clamp(vDistance, 0.0, 1.0)) * mask; // Multiply by mask

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