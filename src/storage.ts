import { blank, parseResume, type Resume } from './model';

export const KEY = 'folio-resume-v1';
export const RECOVERY_KEY = 'folio-resume-recovery';

export type Loaded = { resume: Resume; recovery: string | null; saveBlocked: boolean };

/**
 * Load the saved draft. If it cannot be read, the raw text is stashed under RECOVERY_KEY
 * before anything else happens, so the next autosave can never destroy it. If stashing
 * fails too, autosave is blocked until the user deals with the recovered data.
 */
export function loadDraft(storage: Storage = localStorage): Loaded {
  let saved: string | null = null;
  try {
    saved = storage.getItem(KEY);
  } catch {
    return { resume: blank(), recovery: null, saveBlocked: false };
  }
  let recovery: string | null = null;
  try {
    recovery = storage.getItem(RECOVERY_KEY);
  } catch {
    /* ignore */
  }
  if (!saved) return { resume: blank(), recovery, saveBlocked: false };
  try {
    return { resume: parseResume(JSON.parse(saved)), recovery, saveBlocked: false };
  } catch {
    try {
      storage.setItem(RECOVERY_KEY, saved);
      return { resume: blank(), recovery: saved, saveBlocked: false };
    } catch {
      return { resume: blank(), recovery: saved, saveBlocked: true };
    }
  }
}

export function clearRecovery(storage: Storage = localStorage) {
  try {
    storage.removeItem(RECOVERY_KEY);
  } catch {
    /* ignore */
  }
}
