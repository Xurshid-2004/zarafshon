'use client';

import dynamic from 'next/dynamic';

/** WebGL only runs in the browser. */
const EnginePreview = dynamic(() => import('@/components/engine/EnginePreview'), { ssr: false });

export default function EnginePage() {
  return <EnginePreview />;
}
