/** @type {import('next').NextConfig} */
const nextConfig = {
  // The construction sequence registers its GSAP tweens in mount effects.
  // StrictMode's double-invoke would register every tween twice.
  reactStrictMode: false,

  // three.js ships untranspiled ESM examples; keep them in the compile graph
  transpilePackages: ['three'],

  // There is no server code in this project, so it can be exported as a plain
  // static site:  $env:STATIC_EXPORT=1 ; npm run build   ->  out/
  output: process.env.STATIC_EXPORT ? 'export' : undefined,
  images: { unoptimized: true },
};

export default nextConfig;
