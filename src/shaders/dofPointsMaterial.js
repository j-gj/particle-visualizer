import * as THREE from 'three/webgpu';
import { NodeMaterial, attribute, uniform, varying, vec3, vec4, float, texture, modelViewMatrix, projectionMatrix, modelMatrix, smoothstep, sin, clamp, mix } from 'three/tsl';
import { extend } from '@react-three/fiber';

class DepthOfFieldMaterial extends NodeMaterial {
  constructor() {
    super({
      uniforms: {
        positions: { value: null },
        pointSize: { value: 3 },
        uTime: { value: 0 },
        uFocus: { value: 4 },
        uFov: { value: 45 },
        uBlur: { value: 30 },
        uGradientColors: { value: new Float32Array([1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1]) },
        uGradientStops: { value: new Float32Array([0.0, 0.3, 0.7, 1.0]) },
        uGradientRadius: { value: 2.0 },
      },
    });

    // Vertex shader in TSL
    const vertexNode = (() => {
      const pos = texture(uniform('positions'), attribute('position').xy).xyz;
      const mvPosition = modelViewMatrix.mul(vec4(pos, 1));
      const worldPosition = modelMatrix.mul(vec4(pos, 1));

      const vDistance = varying(float(uniform('uFocus').sub(mvPosition.z.negate()).abs()), 'vDistance');
      const vGradientDistance = varying(float(worldPosition.xyz.length().div(uniform('uGradientRadius'))), 'vGradientDistance');
      const vWorldPosition = varying(worldPosition.xyz, 'vWorldPosition');

      const sizeFactor = float(uniform('uFov').recip().negate().add(1).step(attribute('position').x));
      THREE.position.assign(projectionMatrix.mul(mvPosition));
      THREE.pointSize.assign(sizeFactor.mul(vDistance).mul(uniform('uBlur')));

      return null; // TSL vertex doesn't need return
    })();

    // Fragment shader in TSL
    const getGradientColor = (() => {
      const t = float().clamp(0, 1);
      const color = mix(
        uniform('uGradientColors').slice(0, 3),
        uniform('uGradientColors').slice(3, 6),
        smoothstep(uniform('uGradientStops').slice(0, 1), uniform('uGradientStops').slice(1, 2), t)
      );
      const color2 = mix(
        color,
        uniform('uGradientColors').slice(6, 9),
        smoothstep(uniform('uGradientStops').slice(1, 2), uniform('uGradientStops').slice(2, 3), t)
      );
      return mix(
        color2,
        uniform('uGradientColors').slice(9, 12),
        smoothstep(uniform('uGradientStops').slice(2, 3), uniform('uGradientStops').slice(3, 4), t)
      );
    })();

    const fragmentNode = (() => {
      const cxy = vec3(gl_PointCoord.mul(2).sub(1));
      const r2 = cxy.dot(cxy);
      const mask = float(1).sub(smoothstep(float(0.95), float(1), r2));

      const vDistance = varying(float(), 'vDistance');
      const vGradientDistance = varying(float(), 'vGradientDistance');
      const alpha = float(1.04).sub(clamp(vDistance, 0, 1)).mul(mask);

      const timeOffset = sin(uniform('uTime').mul(0.5)).mul(0.1);
      const gradientColor = getGradientColor(vGradientDistance.add(timeOffset));

      return vec4(gradientColor, alpha);
    })();

    this.vertexNode = vertexNode;
    this.fragmentNode = fragmentNode;
    this.transparent = true;
    this.blending = THREE.NormalBlending;
    this.depthWrite = false;
  }
}

extend({ DepthOfFieldMaterial });