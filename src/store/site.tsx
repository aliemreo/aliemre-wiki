/* React bindings for the Engine.  Two contexts so a keystroke in the prompt
   re-renders the terminal, not the document. */
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { Lang } from '@/content/types.ts';
import { MSG, UI } from '@/content/ui.ts';
import { resolver } from '@/lib/i18n.ts';
import { Engine, INITIAL_DOC, INITIAL_TERM, type DocState, type TermState } from './engine.ts';

const DocCtx = createContext<DocState>(INITIAL_DOC);
const TermCtx = createContext<TermState>(INITIAL_TERM);
const EngineCtx = createContext<Engine | null>(null);

export function SiteProvider({ children }: { children: ReactNode }) {
  const [doc, setDoc] = useState<DocState>(INITIAL_DOC);
  const [term, setTerm] = useState<TermState>(INITIAL_TERM);
  const ref = useRef<Engine | null>(null);
  if (!ref.current) ref.current = new Engine(setDoc, setTerm);
  const engine = ref.current;

  /* Prefs were set on <html> by the boot script before first paint; React reads
     them after hydration so the server render (always English) and the first
     client render match.  A Turkish reader's page is hidden by CSS until this
     has run, so they never see an English frame. */
  useEffect(() => {
    engine.boot();
    return engine.attach();
  }, [engine]);
  useLayoutEffect(() => {
    if (doc.ready) document.documentElement.setAttribute('data-hydrated', '');
  }, [doc.ready]);

  return (
    <EngineCtx.Provider value={engine}>
      <DocCtx.Provider value={doc}>
        <TermCtx.Provider value={term}>{children}</TermCtx.Provider>
      </DocCtx.Provider>
    </EngineCtx.Provider>
  );
}

export const useDoc = () => useContext(DocCtx);
export const useTerm = () => useContext(TermCtx);
export function useEngine(): Engine {
  const e = useContext(EngineCtx);
  if (!e) throw new Error('useEngine outside SiteProvider');
  return e;
}
/* language helpers bound to the current language */
export function useLang() {
  const { lang } = useDoc();
  return {
    lang,
    L: resolver(() => lang),
    ui: UI[lang],
    msg: MSG[lang],
    upper: (s: string) => (s || '').toLocaleUpperCase(lang),
    lower: (s: string) => (s || '').toLocaleLowerCase(lang),
  };
}
export type { Lang };
