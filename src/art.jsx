import { SPRITES } from './sprites.js';

export function Sprites() {
  return <div aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: SPRITES }} />;
}

function Use({ id, w, h, className, style }) {
  return (
    <svg className={className} style={style} width={w} height={h} aria-hidden="true">
      <use href={`#${id}`} width={w} height={h} />
    </svg>
  );
}

export const Ghost = ({ v = 1, size = 60, ...p }) => <Use id={`gk${v}`} w={size} h={Math.round(size * 168 / 148)} {...p} />;
export const Pumpkin = ({ v = 1, size = 120, ...p }) => <Use id={`pk${v}`} w={size} h={Math.round(size * 158 / 188)} {...p} />;
export const Candy = ({ t = 1, size = 60, ...p }) => <Use id={`ck${t}`} w={size} h={Math.round(size * 128 / 148)} {...p} />;
export const Heart = ({ size = 14, ...p }) => <Use id="hrt" w={size} h={Math.round(size * 0.9)} {...p} />;
export const Sparkle = ({ size = 18, ...p }) => <Use id="spk" w={size} h={size} {...p} />;
export const Flower = ({ size = 40, ...p }) => <Use id="flw" w={size} h={size} {...p} />;

// Full semicircle that always fits inside its box (no flat cut at the top).
export function Rainbow({ width = 390, height = 120, className, style }) {
  const cx = width / 2; const base = height + 2; const r0 = Math.min(width / 2 - 12, height - 12);
  const cols = ['#FF4B3E', '#FF8A2E', '#FFC93C', '#3FBF6A', '#2B7BE4'];
  return (
    <svg className={className} style={style} width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      {cols.map((c, i) => {
        const r = r0 - i * 20;
        return <path key={c} d={`M${cx - r} ${base}A${r} ${r} 0 0 1 ${cx + r} ${base}`} stroke={c} strokeWidth="20" fill="none" />;
      })}
    </svg>
  );
}

export function BasketArt({ style = 1, count = 0, size = 240 }) {
  const n = Math.min(3, count === 0 ? 0 : count < 3 ? 1 : count < 8 ? 2 : 3);
  return (
    <svg width={size} height={Math.round(size * 240 / 240)} viewBox="0 48 240 240" aria-hidden="true">
      {n >= 2 && <g transform="translate(58 66) rotate(-18 30 26)"><use href="#ck3" width="64" height="55" /></g>}
      {n >= 3 && <g transform="translate(116 56) rotate(14 30 26)"><use href="#ck2" width="62" height="54" /></g>}
      {n >= 1 && <g transform="translate(88 78)"><use href="#ck1" width="70" height="60" /></g>}
      <use href={`#pk${style}`} x="8" y="96" width="224" height="188" />
    </svg>
  );
}
