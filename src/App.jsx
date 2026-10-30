import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Sprites, Heart, Sparkle } from './art.jsx';
import { GhostPicker, HowSheet } from './ui.jsx';
import { ensureMe, saveMe, deviceId } from './lib.js';
import { rpc } from './supabase.js';
import Village from './pages/Village.jsx';
import Create from './pages/Create.jsx';
import Share from './pages/Share.jsx';
import Basket from './pages/Basket.jsx';
import Write from './pages/Write.jsx';
import Done from './pages/Done.jsx';
import Admin from './pages/Admin.jsx';
import NotFound from './pages/NotFound.jsx';

const DECO = [
  { t: 'h', x: 4, y: 12 }, { t: 's', x: 93, y: 8 }, { t: 'h', x: 96, y: 46 }, { t: 's', x: 3, y: 62 },
  { t: 'h', x: 90, y: 88 }, { t: 's', x: 12, y: 92 }, { t: 'h', x: 50, y: 3 },
];

export default function App() {
  const [me, setMe] = useState(() => ensureMe());
  const [picker, setPicker] = useState(false);
  const isAdmin = useLocation().pathname.startsWith('/admin');

  useEffect(() => { rpc('log_visit', { p_device: deviceId() }).catch(() => {}); }, []);

  const updateMe = (next) => { const m = { ...me, ...next }; saveMe(m); setMe(m); setPicker(false); };
  const [how, setHow] = useState(false);
  const ctx = { me, openPicker: () => setPicker(true), openHow: () => setHow(true) };

  return (
    <div className="app">
      <Sprites />
      <div className="bg-deco" aria-hidden="true">
        {DECO.map((d, i) => (
          <span key={i} style={{ left: `${d.x}%`, top: `${d.y}%` }}>{d.t === 'h' ? <Heart size={16} /> : <Sparkle size={18} />}</span>
        ))}
      </div>
      <Routes>
        <Route path="/" element={<Village {...ctx} />} />
        <Route path="/new" element={<Create {...ctx} />} />
        <Route path="/b/:slug" element={<Basket {...ctx} />} />
        <Route path="/b/:slug/share" element={<Share {...ctx} />} />
        <Route path="/b/:slug/write" element={<Write {...ctx} />} />
        <Route path="/b/:slug/done" element={<Done {...ctx} />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isAdmin && picker && <GhostPicker me={me} onSave={updateMe} onClose={() => setPicker(false)} />}
      {!isAdmin && how && <HowSheet onClose={() => setHow(false)} />}
    </div>
  );
}
