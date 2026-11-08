// ============================================================================
//  Curtain-wall material with parallax interior mapping.
//
//  Why this exists
//  ---------------
//  A glass box lit by an environment map still reads as a plastic box, because
//  there is nothing behind the glass. Real curtain wall is convincing for one
//  reason: you can see rooms receding behind every pane, each a slightly
//  different depth and colour, some lit, some with blinds down.
//
//  Interior mapping fakes that for the cost of a ray/box intersection per
//  fragment. No texture, no extra geometry, no extra draw call.
//
//  Division of labour with three's own BRDF
//  ----------------------------------------
//  The interior is written into `totalEmissiveRadiance`, NOT into
//  `diffuseColor`. That matters: anything in diffuseColor gets lit a second
//  time by every light in the scene, so a "room" would brighten when the sun
//  moved — visibly wrong. As emissive it is simply what the glass transmits,
//  and three's existing physical BRDF puts the Fresnel-weighted environment
//  reflection on top of it for free. We never hand-roll Schlick: the built-in
//  one is already energy-correct and respects clearcoat and the env map.
// ============================================================================

import * as THREE from 'three';

export interface FacadeUniforms {
  uColumns: { value: number };
  uRows: { value: number };
  uMullion: { value: number };
  uRoomDepth: { value: number };
  uLitRatio: { value: number };
  uSeed: { value: number };
  uFrameColor: { value: THREE.Color };
  uRoomWarm: { value: THREE.Color };
  uRoomCool: { value: THREE.Color };
  uInterior: { value: number };
}

export interface FacadeMaterial {
  material: THREE.MeshPhysicalMaterial;
  uniforms: FacadeUniforms;
}

export interface FacadeOptions {
  /** Window bays across one facade; panes = columns * 2. */
  columns: number;
  /** Pane rows per storey (a transom splits the storey in two). */
  rows?: number;
  /** Mullion half-width, in cell UV units. */
  mullion?: number;
  /** Room depth, in cell UV units. 1.0 is as deep as the pane is wide. */
  roomDepth?: number;
  /** Share of rooms with the light on. */
  litRatio?: number;
  /** Frame (mullion) colour. */
  frameColor: string;
  /** Interior colours. */
  warm: string;
  cool: string;
  /** Overall brightness of what shows through the glass. */
  interior?: number;
  /** Changes the per-pane random pattern. */
  seed?: number;
}

const COMMON = /* glsl */ `
  uniform float uColumns;
  uniform float uRows;
  uniform float uMullion;
  uniform float uRoomDepth;
  uniform float uLitRatio;
  uniform float uSeed;
  uniform vec3  uFrameColor;
  uniform vec3  uRoomWarm;
  uniform vec3  uRoomCool;
  uniform float uInterior;

  float fhash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  /*
    Cotangent frame derived from screen-space derivatives.

    The glass shell is a box, so a hard-coded tangent would be correct on one
    face and wrong on the other three. Deriving the frame from the derivatives
    of position and UV gives the right tangent on every face with no tangent
    attribute and no per-face branching.
  */
  mat3 facadeTBN(vec3 p, vec3 n, vec2 uv) {
    vec3 dp1 = dFdx(p);
    vec3 dp2 = dFdy(p);
    vec2 duv1 = dFdx(uv);
    vec2 duv2 = dFdy(uv);

    vec3 dp2perp = cross(dp2, n);
    vec3 dp1perp = cross(n, dp1);
    vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
    vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;

    float invmax = inversesqrt(max(dot(T, T), dot(B, B)));
    return mat3(T * invmax, B * invmax, n);
  }

  /* Exit point of a ray fired into a unit-footprint box of depth d. */
  vec3 roomColour(vec2 cell, vec2 cellUv, vec3 rayDir) {
    float r1 = fhash(cell + uSeed);
    float r2 = fhash(cell * 1.7 + uSeed + 11.0);
    float r3 = fhash(cell * 3.1 + uSeed + 23.0);

    float depth = uRoomDepth * (0.78 + 0.5 * r1);

    vec3 ro = vec3(cellUv - 0.5, 0.0);
    vec3 inv = 1.0 / rayDir;
    vec3 t1 = (vec3(-0.5, -0.5, -depth) - ro) * inv;
    vec3 t2 = (vec3(0.5, 0.5, 0.0) - ro) * inv;
    vec3 tmax = max(t1, t2);
    float t = min(min(tmax.x, tmax.y), tmax.z);

    /*
      Which surface was hit is decided by comparing t against the per-axis exit
      distances, not by testing the hit position against a plane with an
      epsilon: at grazing angles the epsilon test picks the wrong face and the
      room flickers between floor and wall.
    */
    vec3 back  = mix(vec3(0.20, 0.21, 0.23), vec3(0.42, 0.39, 0.35), r2);
    vec3 side  = back * 0.82;
    vec3 floorC = mix(vec3(0.13, 0.10, 0.07), vec3(0.30, 0.22, 0.15), r3);
    vec3 ceil  = vec3(0.68, 0.69, 0.71);

    vec3 surface = back;
    if (t == tmax.x)      surface = side;
    else if (t == tmax.y) surface = (rayDir.y > 0.0) ? ceil : floorC;

    // blinds: a flat panel hung at a random height in front of the room
    float blind = step(0.62, r2);
    float blindAt = mix(0.25, 0.78, r3);
    if (blind > 0.5 && cellUv.y > blindAt) {
      float slat = sin((cellUv.y - blindAt) * 220.0) * 0.06;
      surface = vec3(0.70, 0.68, 0.63) * (0.9 + slat);
    }

    float lit = step(1.0 - uLitRatio, r1);
    vec3 lamp = mix(uRoomCool, uRoomWarm, lit);
    // rooms get dimmer toward the back, which is what sells the depth
    float falloff = mix(1.0, 0.45, clamp(-((ro + rayDir * t).z) / max(depth, 0.001), 0.0, 1.0));

    return surface * lamp * falloff * (0.35 + lit * 1.25);
  }
`;

export function makeFacadeMaterial(o: FacadeOptions): FacadeMaterial {
  const uniforms: FacadeUniforms = {
    uColumns: { value: Math.max(1, o.columns) * 2 },
    uRows: { value: o.rows ?? 2 },
    uMullion: { value: o.mullion ?? 0.035 },
    uRoomDepth: { value: o.roomDepth ?? 1.15 },
    uLitRatio: { value: o.litRatio ?? 0.3 },
    uSeed: { value: o.seed ?? 0 },
    uFrameColor: { value: new THREE.Color(o.frameColor) },
    uRoomWarm: { value: new THREE.Color(o.warm) },
    uRoomCool: { value: new THREE.Color(o.cool) },
    uInterior: { value: o.interior ?? 1 },
  };

  const material = new THREE.MeshPhysicalMaterial({
    color: '#0A0E13',
    roughness: 0.05,
    metalness: 0,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    envMapIntensity: 3.4,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    emissive: new THREE.Color('#000000'),
    emissiveIntensity: 0,
  });

  // vUv only exists when three thinks a map needs it.
  material.defines = { ...(material.defines ?? {}), USE_UV: '' };

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.fragmentShader = COMMON + shader.fragmentShader;

    // --- the pane grid, the frame, and the room behind the glass ----------
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      /* glsl */ `
      #include <map_fragment>

      vec2 gridUv = vUv * vec2(uColumns, uRows);
      vec2 fCell = floor(gridUv);
      vec2 cellUv = fract(gridUv);

      // analytic anti-aliasing: one texel of coverage, so mullions stay a
      // crisp line at any zoom instead of aliasing into a dotted mess
      vec2 fw = fwidth(gridUv);
      vec2 edge = min(cellUv, 1.0 - cellUv);
      vec2 m2 = smoothstep(vec2(uMullion), vec2(uMullion) + fw, edge);
      float glassMask = m2.x * m2.y;

      vec3 nv = normalize(vNormal);
      // the top and bottom caps of the glass box are not windows
      float faceMask = 1.0 - smoothstep(0.55, 0.78, abs(nv.y));
      glassMask *= faceMask;

      vec3 viewDirVS = normalize(vViewPosition);
      mat3 tbn = facadeTBN(-vViewPosition, nv, vUv);
      vec3 rayDir = normalize(-viewDirVS * tbn);
      rayDir.z = min(rayDir.z, -0.04); // never let the ray run along the pane

      vec3 interior = roomColour(fCell, cellUv, rayDir) * uInterior;

      diffuseColor.rgb = mix(uFrameColor, vec3(0.012), glassMask);
      `,
    );

    // frames are anodised metal; glass is not
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      /* glsl */ `
      #include <roughnessmap_fragment>
      roughnessFactor = mix(0.42, roughnessFactor, glassMask);
      `,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <metalnessmap_fragment>',
      /* glsl */ `
      #include <metalnessmap_fragment>
      metalnessFactor = mix(0.85, metalnessFactor, glassMask);
      `,
    );

    // what the glass transmits, added on top of the hover glow
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      /* glsl */ `
      #include <emissivemap_fragment>
      totalEmissiveRadiance += interior * glassMask;
      `,
    );
  };

  /*
    Every storey builds its own material so it can animate its own opacity,
    but they all compile to the same program. Without a shared cache key three
    would compile the shader 18 times and stall the first frames.
  */
  material.customProgramCacheKey = () => `facade-${uniforms.uColumns.value}-${uniforms.uRows.value}`;

  return { material, uniforms };
}
