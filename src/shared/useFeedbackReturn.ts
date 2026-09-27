import { useEffect, useRef, type Dispatch } from 'react';
import type { SupportAction, SupportState } from '../domain/demo';

export const FEEDBACK_ABSENCE_MS = 30 * 60 * 1000;
export const CHAT_VISIT_KEY = 'piglet-chat-last-visit';

// Record time spent away, not time spent silently reading an open conversation.
export function useFeedbackReturn(state: SupportState, dispatch: Dispatch<SupportAction>) {
  const current = useRef(state);
  current.current = state;
  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem(CHAT_VISIT_KEY, JSON.stringify({ at: Date.now(), lastMessage: current.current.messages.at(-1)?.id }));
      } catch { /* The chat remains usable without persistence. */ }
    };
    const resume = () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const visit = JSON.parse(localStorage.getItem(CHAT_VISIT_KEY) || 'null');
        if (visit && Number.isFinite(visit.at) && Date.now() - visit.at >= FEEDBACK_ABSENCE_MS && visit.lastMessage === current.current.messages.at(-1)?.id) {
          dispatch({ type: 'offerFeedback' });
        }
      } catch { /* Missing or invalid visit data should not trigger a prompt. */ }
      save();
    };
    const visibility = () => document.visibilityState === 'hidden' ? save() : resume();
    resume();
    const heartbeat = window.setInterval(() => { if (document.visibilityState === 'visible') save(); }, 30000);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', save);
    window.addEventListener('pageshow', resume);
    return () => {
      save();
      clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', save);
      window.removeEventListener('pageshow', resume);
    };
  }, [dispatch]);
}
