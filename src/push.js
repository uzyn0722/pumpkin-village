import { rpc } from './supabase.js';

const VAPID_PUBLIC = 'BApU82oIgJG6AEYbZqk7KxTxqRyXQx_ZBZK4j6CQynMnRNWODSOJiO2qsD_-q-P6gdLrxnCOrcxV-jIwq5S0YgY';

export const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

// 'on' | 'off' | 'denied' | 'ios-home' | 'unsupported'
export function pushState() {
  if (isIOS() && !isStandalone()) return 'ios-home';
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  try { if (localStorage.getItem('pv_push') && Notification.permission === 'granted') return 'on'; } catch { /* ignore */ }
  return 'off';
}

function keyBytes(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function enablePush(slug, key) {
  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return perm === 'denied' ? 'denied' : 'off';
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC) });
  await rpc('save_push', { p_slug: slug, p_key: key, p_sub: sub.toJSON() });
  try { localStorage.setItem('pv_push', '1'); } catch { /* ignore */ }
  return 'on';
}
