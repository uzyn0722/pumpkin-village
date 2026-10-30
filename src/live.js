import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from './supabase.js';
import { deviceId } from './lib.js';

// One shared realtime channel for the whole village.
// Each visitor tracks { nick, ghost, at } where `at` is the basket slug they are looking at (or null on the village).
let channel = null;
let status = 'idle';
let current = { nick: '', ghost: 1, at: null };
const listeners = new Set();
const eventListeners = new Set();
let peers = [];

function emit() { listeners.forEach((fn) => fn({ peers, status })); }

function readPeers() {
  if (!channel) return [];
  const state = channel.presenceState();
  const out = [];
  Object.keys(state).forEach((key) => {
    const metas = state[key];
    if (metas && metas.length) out.push({ key, ...metas[metas.length - 1] });
  });
  return out;
}

function connect() {
  if (channel) return;
  status = 'connecting';
  channel = supabase.channel('village', { config: { presence: { key: deviceId() }, broadcast: { self: false } } });
  channel
    .on('presence', { event: 'sync' }, () => { peers = readPeers(); emit(); })
    .on('broadcast', { event: 'act' }, ({ payload }) => { eventListeners.forEach((fn) => fn(payload)); })
    .subscribe(async (s) => {
      if (s === 'SUBSCRIBED') {
        status = 'live';
        if (current.nick) { try { await channel.track({ ...current, t: Date.now() }); } catch { /* ignore */ } }
      } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') {
        status = 'offline';
      }
      emit();
    });
  setTimeout(() => { if (status === 'connecting') { status = 'offline'; emit(); } }, 12000);
}

export function setPresence(next) {
  current = { ...current, ...next };
  if (channel && status === 'live' && current.nick) channel.track({ ...current, t: Date.now() }).catch(() => {});
}

let lastSend = 0;
export function sendAct(payload) {
  const now = Date.now();
  if (now - lastSend < 600) return false;
  lastSend = now;
  const full = { ...payload, key: deviceId(), nick: current.nick, ghost: current.ghost, at: current.at };
  eventListeners.forEach((fn) => fn({ ...full, self: true }));
  if (channel && status === 'live') channel.send({ type: 'broadcast', event: 'act', payload: full }).catch(() => {});
  return true;
}

export function useLive(me, at) {
  const [state, setState] = useState({ peers, status });
  useEffect(() => {
    connect();
    const fn = (s) => setState({ ...s });
    listeners.add(fn);
    fn({ peers, status });
    return () => { listeners.delete(fn); };
  }, []);
  useEffect(() => {
    if (me) setPresence({ nick: me.nick, ghost: me.ghost, at: at || null });
  }, [me && me.nick, me && me.ghost, at]);
  return state;
}

export function useActs(handler) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const fn = (p) => ref.current(p);
    eventListeners.add(fn);
    return () => { eventListeners.delete(fn); };
  }, []);
}

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((text) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-2), { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);
  return [toasts, push];
}
