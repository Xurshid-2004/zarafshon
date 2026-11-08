'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { PALETTE } from '@/lib/palette';
import { useApp } from '@/lib/store';
import type { Theme } from '@/lib/types';

const VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  varying vec3 vDir;

  uniform vec3  uZenith;
  uniform vec3  uHorizon;
  uniform vec3  uGround;
  uniform vec3  uSunColor;
  uniform vec3  uSunDir;
  uniform float uCloud;

  // cheap hash noise for the cloud band
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * vnoise(p); p *= 2.07; a *= 0.5; }
    return v;
  }

  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;

    // vertical gradient, denser toward the horizon.
    // The exponent decides how far up the warm horizon band creeps: at 0.30
    // it washed the whole dome, which read as smog rather than golden hour.
    float t = pow(clamp(h, 0.0, 1.0), 0.55);
    vec3 col = mix(uHorizon, uZenith, t);

    // below the horizon fades into haze over the ground
    col = mix(uGround, col, smoothstep(-0.10, 0.015, h));

    // sun: broad atmospheric glow plus a defined disc
    vec3 sd = normalize(uSunDir);
    float c = max(dot(d, sd), 0.0);
    float glow = pow(c, 16.0) * 0.26 + pow(c, 220.0) * 0.5;
    float disc = smoothstep(0.9985, 0.9995, c);
    col += uSunColor * (glow + disc * 2.2);

    // thin cloud band, stretched along the horizon and fading at the zenith
    if (uCloud > 0.001 && h > 0.0) {
      vec2 uv = vec2(atan(d.z, d.x) * 1.6, h * 3.4);
      float n = fbm(uv * 1.7);
      float band = smoothstep(0.46, 0.82, n) * smoothstep(0.015, 0.22, h) * (1.0 - smoothstep(0.62, 1.0, h));
      vec3 cloudLit = mix(vec3(0.72), uSunColor, 0.35 + pow(c, 3.0) * 0.5);
      col = mix(col, cloudLit, band * uCloud);
    }

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

/**
 * Procedural sky dome.
 *
 * Written by hand rather than using a packaged sky so the gradient, the sun
 * glow and the cloud band can be tuned against the rest of the grade, and so
 * the same shader can be captured into the environment map that lights the
 * glass and the car paint.
 */
export default function SkyDome({
  followCamera = true,
  palette,
}: {
  followCamera?: boolean;
  /** Overrides the app-wide colours, for scenes with a fixed time of day. */
  palette?: (typeof PALETTE)[Theme];
}) {
  const theme = useApp((s) => s.theme);
  const p = palette ?? PALETTE[theme];
  const ref = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uZenith: { value: new THREE.Color(p.skyZenith) },
      uHorizon: { value: new THREE.Color(p.skyHorizon) },
      uGround: { value: new THREE.Color(p.skyGround) },
      uSunColor: { value: new THREE.Color(p.sunDisc) },
      uSunDir: { value: new THREE.Vector3(...p.sun).normalize() },
      uCloud: { value: p.cloudAmount },
    }),
    [p],
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: VERT,
        fragmentShader: FRAG,
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: false,
        fog: false,
        toneMapped: false,
      }),
    [uniforms],
  );

  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    if (followCamera && ref.current) ref.current.position.copy(state.camera.position);
  });

  return (
    <mesh ref={ref} material={material} renderOrder={-1000} frustumCulled={false}>
      <sphereGeometry args={[400, 32, 20]} />
    </mesh>
  );
}
