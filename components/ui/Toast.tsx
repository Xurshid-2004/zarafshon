'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useApp } from '@/lib/store';
import { PANEL_SOLID, cx } from '@/lib/ui';

export default function Toast() {
  const toast = useApp((s) => s.toast);
  const setToast = useApp((s) => s.setToast);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(id);
  }, [toast, setToast]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="pointer-events-none absolute bottom-24 left-1/2 z-50 -translate-x-1/2"
        >
          <div className={cx(PANEL_SOLID, 'px-4 py-2.5 text-xs font-medium')}>{toast}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
