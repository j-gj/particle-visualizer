import * as THREE from 'three/webgpu';
import { tslFn, vec3, vec4, float, storage, uniform } from 'three/tsl';

// Optimized Simplex Noise in TSL
const mod289 = tslFn(([x]) => {
  return x.sub(x.div(289.0).floor().mul(289.0));
});

const permute = tslFn(([x]) => {
  return mod289(x.mul(34.0).add(1.0).mul(x));
});

const taylorInvSqrt = tslFn(([r]) => {
  return float(1.79284291400159).sub(float(0.85373472095314).mul(r));
});

const snoise = tslFn(([v]) => {
  const C = vec3(float(1.0 / 6.0), float(1.0 / 3.0));
  const D = vec4(0.0, 0.5, 1.0, 2.0);

  const i = v.add(v.dot(C.yyy)).floor();
  const x0 = v.sub(i).add(i.dot(C.xxx));

  const g = x0.yzx.step(x0.xyz);
  const l = float(1.0).sub(g);
  const i1 = g.xyz.min(l.zxy);
  const i2 = g.xyz.max(l.zxy);

  const x1 = x0.sub(i1).add(C.xxx);
  const x2 = x0.sub(i2).add(C.yyy);
  const x3 = x0.sub(D.yyy);

  const i_mod = mod289(i);
  const p = permute(
    permute(permute(i_mod.z.add(vec4(0.0, i1.z, i2.z, 1.0)))
      .add(i_mod.y)
      .add(vec4(0.0, i1.y, i2.y, 1.0)))
      .add(i_mod.x)
      .add(vec4(0.0, i1.x, i2.x, 1.0))
  );

  const n_ = float(0.142857142857);
  const ns = n_.mul(D.wyz).sub(D.xzx);

  const j = p.sub(p.mul(ns.z).mul(ns.z).mul(49.0).floor());

  const x_ = j.mul(ns.z).floor();
  const y_ = j.sub(x_.mul(7.0)).floor();

  const x = x_.mul(ns.x).add(ns.yyyy);
  const y = y_.mul(ns.x).add(ns.yyyy);
  const h = float(1.0).sub(x.abs()).sub(y.abs());

  const b0 = vec4(x.xy, y.xy);
  const b1 = vec4(x.zw, y.zw);

  const s0 = b0.floor().mul(2.0).add(1.0);
  const s1 = b1.floor().mul(2.0).add(1.0);
  const sh = h.step(float(0.0)).negate();

  const a0 = b0.xzyw.add(s0.xzyw.mul(sh.xxyy));
  const a1 = b1.xzyw.add(s1.xzyw.mul(sh.zzww));

  const p0 = vec3(a0.xy, h.x);
  const p1 = vec3(a0.zw, h.y);
  const p2 = vec3(a1.xy, h.z);
  const p3 = vec3(a1.zw, h.w);

  const norm = taylorInvSqrt(vec4(p0.dot(p0), p1.dot(p1), p2.dot(p2), p3.dot(p3)));
  p0.assign(p0.mul(norm.x));
  p1.assign(p1.mul(norm.y));
  p2.assign(p2.mul(norm.z));
  p3.assign(p3.mul(norm.w));

  const m = vec4(x0.dot(x0), x1.dot(x1), x2.dot(x2), x3.dot(x3)).max(float(0.6)).max(float(0));
  m.assign(m.mul(m));

  return float(42.0).mul(m.mul(m).dot(vec4(p0.dot(x0), p1.dot(x1), p2.dot(x2), p3.dot(x3))));
});

const snoiseVec3 = tslFn(([x]) => {
  const s = snoise(x);
  const s1 = snoise(vec3(x.y.sub(19.1), x.z.add(33.4), x.x.add(47.2)));
  const s2 = snoise(vec3(x.z.add(74.2), x.x.sub(124.5), x.y.add(99.4)));
  return vec3(s, s1, s2);
});

const curlNoise = tslFn(([p]) => {
  const e = float(0.1);
  const dx = vec3(e, 0.0, 0.0);
  const dy = vec3(0.0, e, 0.0);
  const dz = vec3(0.0, 0.0, e);

  const p_x0 = snoiseVec3(p.sub(dx));
  const p_x1 = snoiseVec3(p.add(dx));
  const p_y0 = snoiseVec3(p.sub(dy));
  const p_y1 = snoiseVec3(p.add(dy));
  const p_z0 = snoiseVec3(p.sub(dz));
  const p_z1 = snoiseVec3(p.add(dz));

  const x = p_y1.z.sub(p_y0.z).sub(p_z1.y).add(p_z0.y);
  const y = p_z1.x.sub(p_z0.x).sub(p_x1.z).add(p_x0.z);
  const z = p_x1.y.sub(p_x0.y).sub(p_y1.x).add(p_y0.x);

  return vec3(x, y, z).mul(float(1.0).div(e.mul(2.0))).normalize();
});

// Simulation compute function
const SimulationMaterial = tslFn(([positionsStorage, uFrequency, uTime]) => {
  const index = THREE.computeIndex;
  let pos = positionsStorage.element(index).xyz;
  let curlPos = pos;

  const time = uTime.mul(0.015);
  pos.assign(curlNoise(pos.mul(uFrequency).add(time)));
  curlPos.assign(curlNoise(curlPos.mul(uFrequency).add(time)));
  curlPos.addAssign(curlNoise(curlPos.mul(uFrequency.mul(2))).mul(0.5));
  curlPos.addAssign(curlNoise(curlPos.mul(uFrequency.mul(4))).mul(0.25));

  const mixed = pos.mix(curlPos, snoise(pos.add(time)).mul(0.5).add(0.5));

  positionsStorage.element(index).assign(vec4(mixed, 1));
});

export { SimulationMaterial };