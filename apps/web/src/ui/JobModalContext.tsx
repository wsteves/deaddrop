import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

type ModalState = {
  openId: string | null;
  open: (id: string) => void;
  close: () => void;
};

const ctx = createContext<ModalState>({ openId: null, open: () => {}, close: () => {} });

export function JobModalProvider({ children }: { children: React.ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  // Open modal and push a history entry so Back closes it
  const open = useCallback((id: string) => {
    try { prevFocusRef.current = document.activeElement as HTMLElement | null; } catch {}
    setOpenId(id);
    try {
      window.history.pushState({ jobModal: id }, '', window.location.pathname + `#job-${id}`);
    } catch {}
  }, []);

  const close = useCallback(() => {
    setOpenId(null);
    // restore focus
    try { if (prevFocusRef.current) prevFocusRef.current.focus(); } catch {}
    // If this close corresponds to a history entry we pushed, go back to pop it.
    try {
      if (window.history.state && (window.history.state as any).jobModal) window.history.back();
    } catch {}
  }, []);

  // If user navigates back via browser, close modal
  useEffect(() => {
    function onPop() {
      // If there's an open modal, close it. If not, ignore.
      setOpenId((cur) => cur ? null : cur);
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return (
    <ctx.Provider value={{ openId, open, close }}>{children}</ctx.Provider>
  );
}

export function useJobModal() {
  return useContext(ctx);
}

export default ctx;
