/* Maskot CaseBase: Dibi (MySQL), Kura (PostgreSQL), Doku (MongoDB), Cici (Redis), Lumi (SQLite). Diambil dari prototipe klik. */
/* eslint-disable */
export type MascotKey = "sql" | "pg" | "mongo" | "redis" | "lite";
export type Mood = "idle" | "think" | "happy" | "sad" | "celebrate";
function dibiSVG(state: string = 'idle'): string {
 return `<svg class="dibi mk-sql dibi--${state}" viewBox="0 0 150 156" role="img" aria-label="Dibi, maskot detektif MySQL">
<ellipse class="d-shadow" cx="72" cy="146" rx="34" ry="6"/>
<g class="d-fx d-spark"><path d="M18 46l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/><path d="M128 18l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M12 104l2 4 4 2-4 2-2 4-2-4-4-2 4-2z"/></g>
<g class="d-all">
 <g class="d-body">
  <path class="d-arm" d="M40 98 q-15 3 -18 17"/>
  <path class="d-cyl" d="M36 62 v62 a36 12 0 0 0 72 0 v-62 z"/>
  <path class="d-band" d="M36 86 a36 12 0 0 0 72 0 M36 108 a36 12 0 0 0 72 0"/>
  <ellipse class="d-top" cx="72" cy="62" rx="36" ry="12"/>
  <g class="d-face">
   <g class="e-normal"><ellipse class="d-white" cx="58" cy="90" rx="8.5" ry="9.5"/><ellipse class="d-white" cx="86" cy="90" rx="8.5" ry="9.5"/><g class="d-pupils"><circle class="d-pupil" cx="59" cy="91" r="4.6"/><circle class="d-pupil" cx="87" cy="91" r="4.6"/><circle class="d-white" cx="60.6" cy="89" r="1.5"/><circle class="d-white" cx="88.6" cy="89" r="1.5"/></g></g>
   <g class="e-happy"><path d="M50 93 q8 -10 16 0 M78 93 q8 -10 16 0"/></g>
   <g class="e-sad"><path d="M49 77 l13 4 M95 77 l-13 4"/></g>
   <ellipse class="d-cheek" cx="48" cy="103" rx="6" ry="3.6"/><ellipse class="d-cheek" cx="96" cy="103" rx="6" ry="3.6"/>
   <path class="m m-idle" d="M66 104 q6 5 12 0"/>
   <path class="m m-happy" d="M62 102 h20 q-2 11 -10 11 q-8 0 -10 -11z"/>
   <path class="m m-sad" d="M65 109 q7 -6 14 0"/>
   <ellipse class="m m-wow" cx="72" cy="106" rx="6" ry="7"/>
  </g>
  <g class="d-glass">
   <path class="d-arm" d="M106 100 q15 -3 19 -16"/>
   <path class="d-handle" d="M124 82 l6 -10"/>
   <circle class="d-lens" cx="134" cy="61" r="12"/>
   <path class="d-glint" d="M127 57 q3 -5 9 -5"/>
  </g>
 </g>
 <g class="d-hat">
  <path class="h-dark" d="M40 58 q-12 0 -15 7 q14 4 25 -3z"/>
  <path class="h-main" d="M38 60 q1 -32 34 -34 q33 2 34 34 q-34 9 -68 0z"/>
  <path class="h-check" d="M55 32 l-5 27 M72 26 v35 M89 32 l5 27 M42 46 q30 -9 60 0"/>
  <path class="h-dark" d="M92 60 q17 -3 25 6 q-15 5 -28 -1z"/>
  <path class="h-band" d="M38 60 q34 9 68 0"/>
  <path class="h-dark" d="M72 27 q-10 -8 -5 -11 q5 0 5 11 q0 -11 5 -11 q5 3 -5 11z"/>
 </g>
</g>
<path class="d-fx d-sweat" d="M113 70 q-6 9 0 12 q6 -3 0 -12z"/>
</svg>`;
}

const SPARK=`<g class="d-fx d-spark"><path d="M18 46l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/><path d="M128 18l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M12 104l2 4 4 2-4 2-2 4-2-4-4-2 4-2z"/></g>`;
function face(lx: number, rx: number, ey: number): string {
 const cx=(lx+rx)/2;
 return `<g class="d-face"><g class="e-normal"><ellipse class="d-white" cx="${lx}" cy="${ey}" rx="8.5" ry="9.5"/><ellipse class="d-white" cx="${rx}" cy="${ey}" rx="8.5" ry="9.5"/><g class="d-pupils"><circle class="d-pupil" cx="${lx+1}" cy="${ey+1}" r="4.6"/><circle class="d-pupil" cx="${rx+1}" cy="${ey+1}" r="4.6"/><circle class="d-white" cx="${lx+2.6}" cy="${ey-1}" r="1.5"/><circle class="d-white" cx="${rx+2.6}" cy="${ey-1}" r="1.5"/></g></g>
<g class="e-happy"><path d="M${lx-8} ${ey+3} q8 -10 16 0 M${rx-8} ${ey+3} q8 -10 16 0"/></g>
<g class="e-sad"><path d="M${lx-9} ${ey-13} l13 4 M${rx+9} ${ey-13} l-13 4"/></g>
<ellipse class="d-cheek" cx="${lx-10}" cy="${ey+13}" rx="6" ry="3.6"/><ellipse class="d-cheek" cx="${rx+10}" cy="${ey+13}" rx="6" ry="3.6"/>
<path class="m m-idle" d="M${cx-6} ${ey+14} q6 5 12 0"/><path class="m m-happy" d="M${cx-10} ${ey+12} h20 q-2 11 -10 11 q-8 0 -10 -11z"/><path class="m m-sad" d="M${cx-7} ${ey+19} q7 -6 14 0"/><ellipse class="m m-wow" cx="${cx}" cy="${ey+16}" rx="6" ry="7"/></g>`;
}
function mkSVG(k: string, state: string, label: string, shadow: string, body: string, hat: string, sweat: string): string {
 return `<svg class="dibi mk-${k} dibi--${state}" viewBox="0 0 150 156" role="img" aria-label="${label}"><ellipse class="d-shadow" ${shadow}/>${SPARK}<g class="d-all"><g class="d-body">${body}</g><g class="d-hat">${hat}</g></g><path class="d-fx d-sweat" d="${sweat}"/></svg>`;
}
const ARM = (d: string, c: string, w: number = 9): string =>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
const DRAW: Record<MascotKey, (s: string) => string> = {
 sql:(s: string)=>dibiSVG(s),
 /* Kura: kura-kura penjaga arsip, cangkangnya berlapis seperti piringan disk */
 pg:(s: string)=>mkSVG('pg',s,'Kura, maskot kura-kura penjaga arsip PostgreSQL','cx="72" cy="146" rx="40" ry="6"',
  ARM('M40 104 q-14 4 -16 18','#8CCB7E')+
  `<ellipse cx="52" cy="138" rx="12" ry="7" fill="#5FA458"/><ellipse cx="92" cy="138" rx="12" ry="7" fill="#5FA458"/>
  <ellipse cx="72" cy="108" rx="42" ry="34" fill="#2F7FD1"/>
  <path d="M31 100 a41 30 0 0 0 82 0" fill="none" stroke="#1F5FA3" stroke-width="3"/><path d="M33 114 a39 26 0 0 0 78 0" fill="none" stroke="#6FAEEB" stroke-width="3"/>
  <ellipse cx="72" cy="112" rx="27" ry="27" fill="#F7E9B8"/>
  <path d="M50 104 h44 M48 118 h48 M72 86 v52" fill="none" stroke="#E0C982" stroke-width="2.5"/>
  <circle cx="72" cy="64" r="30" fill="#8CCB7E"/><ellipse cx="60" cy="48" rx="9" ry="5" fill="#B4E2A7"/>`+
  face(61,83,66)+
  `<g class="d-glass">${ARM('M104 104 q14 -2 18 -16','#8CCB7E')}<rect x="113" y="62" width="25" height="30" rx="4" fill="#fff" stroke="#1B1D3A" stroke-width="3"/><rect x="119.5" y="57" width="12" height="8" rx="2" fill="#9B6430"/><path d="M119 73 h13 M119 80 h13 M119 87 h8" stroke="#2F7FD1" stroke-width="2.6" stroke-linecap="round"/></g>`,
  `<path d="M44 42 q4 -20 28 -20 q24 0 26 18 q-26 -6 -54 2z" fill="#2F3561"/><path d="M44 42 q26 -8 54 -2" fill="none" stroke="#1E2246" stroke-width="5" stroke-linecap="round"/><circle cx="70" cy="21" r="4" fill="#2F3561"/><circle cx="88" cy="34" r="3.6" fill="#FFBE2E"/>`,
  'M106 44 q-6 9 0 12 q6 -3 0 -12z'),
 /* Doku: jeli berbentuk lembar dokumen, tangannya kurung kurawal */
 mongo:(s: string)=>mkSVG('mongo',s,'Doku, maskot jeli dokumen MongoDB','cx="75" cy="146" rx="36" ry="6"',
  `<path d="M34 84 q-9 0 -9 8 v4 q0 6 -7 6 q7 0 7 6 v4 q0 8 9 8" fill="none" stroke="#1E9C6A" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M54 50 h32 l22 22 v52 q0 4 -4 6 q-6 3 -8 -2 q-3 8 -10 8 q-7 0 -9 -7 q-4 7 -11 7 q-8 0 -10 -7 q-3 6 -9 4 q-5 -2 -5 -8 v-63 q0 -12 12 -12z" fill="#4CD69B"/>
  <path d="M86 50 v16 q0 6 6 6 h16z" fill="#A6F0CF"/>
  <path d="M50 70 q0 -9 9 -10" fill="none" stroke="#C9F7E2" stroke-width="5" stroke-linecap="round"/>
  <path d="M56 120 h16 M78 120 h14" stroke="#1E9C6A" stroke-width="3" stroke-linecap="round" opacity=".45"/>`+
  face(63,87,88)+
  `<g class="d-glass"><path d="M114 96 q9 0 9 -8 v-4 q0 -6 7 -6 q-7 0 -7 -6 v-4 q0 -8 -9 -8" fill="none" stroke="#1E9C6A" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></g>`,
  `<path d="M42 54 q2 -24 24 -24 q20 0 22 20 q-24 -5 -46 4z" fill="#FF8FB1"/><path d="M40 54 q24 -9 50 -4" fill="none" stroke="#E96A93" stroke-width="6" stroke-linecap="round"/><circle cx="66" cy="28" r="7" fill="#FFD0DF"/>`,
  'M112 54 q-6 9 0 12 q6 -3 0 -12z'),
 /* Cici: tupai kurir kilat, menyimpan semua yang sering dipakai di pipinya */
 redis:(s: string)=>mkSVG('redis',s,'Cici, maskot tupai kurir Redis','cx="82" cy="146" rx="38" ry="6"',
  `<g class="k-tail"><path d="M66 130 q-52 6 -54 -44 q-2 -38 30 -40 q24 0 22 22 q-2 18 -20 16 q8 22 22 46z" fill="#E8663F"/><path d="M58 124 q-36 2 -38 -36 q0 -26 22 -28" fill="none" stroke="#F59A72" stroke-width="6" stroke-linecap="round"/></g>
  <ellipse cx="70" cy="138" rx="11" ry="7" fill="#B8442A"/><ellipse cx="96" cy="138" rx="11" ry="7" fill="#B8442A"/>
  <ellipse cx="84" cy="110" rx="27" ry="28" fill="#E8663F"/><ellipse cx="84" cy="116" rx="17" ry="19" fill="#FFE3CC"/>`+
  ARM('M62 106 q-9 8 -5 19','#E8663F')+
  `<ellipse cx="58" cy="128" rx="6.5" ry="7.5" fill="#C98B4B"/><path d="M50.5 125 q7.5 -8 15 0z" fill="#7A4A22"/>
  <path d="M62 52 l-8 -23 q15 4 21 17z" fill="#E8663F"/><path d="M102 52 l8 -23 q-15 4 -21 17z" fill="#E8663F"/>
  <path d="M62 46 l-3.5 -11 q7 3 10 9z" fill="#FFB3A0"/><path d="M102 46 l3.5 -11 q-7 3 -10 9z" fill="#FFB3A0"/>
  <ellipse cx="82" cy="72" rx="31" ry="27" fill="#E8663F"/>
  <ellipse cx="59" cy="84" rx="9" ry="7" fill="#F59A72"/><ellipse cx="105" cy="84" rx="9" ry="7" fill="#F59A72"/>
  <ellipse cx="82" cy="87" rx="13" ry="8" fill="#FFE3CC"/>`+
  face(71,93,72)+
  `<ellipse cx="82" cy="81" rx="3.4" ry="2.5" fill="#5A2A1A"/>
  <g class="d-glass">${ARM('M108 106 q14 -2 17 -16','#E8663F')}<circle cx="127" cy="84" r="7" fill="none" stroke="#FFBE2E" stroke-width="4.5"/><path d="M131 78 l9 -16 M136 70 l5 3 M138.5 65.5 l5 3" fill="none" stroke="#FFBE2E" stroke-width="4.5" stroke-linecap="round"/></g>`,
  `<path d="M52 56 q30 -16 60 0" fill="none" stroke="#5A3A1F" stroke-width="5" stroke-linecap="round"/><circle cx="72" cy="49" r="8.5" fill="#9AD8FF" stroke="#5A3A1F" stroke-width="4"/><circle cx="92" cy="49" r="8.5" fill="#9AD8FF" stroke="#5A3A1F" stroke-width="4"/><path d="M68 46 q2 -3 5 -3 M88 46 q2 -3 5 -3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`,
  'M118 50 q-6 9 0 12 q6 -3 0 -12z'),
 /* Lumi: kunang-kunang mungil, seluruh databasenya muat di satu toples */
 lite:(s: string)=>mkSVG('lite',s,'Lumi, maskot kunang-kunang SQLite','cx="72" cy="148" rx="26" ry="5"',
  `<circle class="k-glow" cx="72" cy="124" r="27" fill="#FFE98A"/>
  <g class="k-wingL"><ellipse cx="44" cy="68" rx="21" ry="13" transform="rotate(-32 44 68)" fill="#E3F5FF" stroke="#9BC9E6" stroke-width="2.5"/></g>
  <g class="k-wingR"><ellipse cx="100" cy="68" rx="21" ry="13" transform="rotate(32 100 68)" fill="#E3F5FF" stroke="#9BC9E6" stroke-width="2.5"/></g>
  <ellipse cx="72" cy="124" rx="18" ry="14" fill="#FFF6B0"/><path d="M57 121 q15 6 30 0" fill="none" stroke="#E0B000" stroke-width="2.5"/>`+
  ARM('M46 100 q-12 4 -13 16','#E0A800',7)+
  `<ellipse cx="72" cy="92" rx="30" ry="31" fill="#FFD23F"/><ellipse cx="59" cy="73" rx="9" ry="5.5" fill="#FFE98A"/>`+
  face(61,83,88)+
  `<g class="d-glass">${ARM('M100 100 q13 -2 16 -14','#E0A800',7)}<rect x="107" y="61" width="25" height="27" rx="7" fill="#FFF6B0" stroke="#1B1D3A" stroke-width="3"/><rect x="110.5" y="55" width="18" height="7" rx="2" fill="#9B6430"/><rect x="114" y="69" width="11" height="13" rx="2" fill="#4F5BE0"/><ellipse cx="119.5" cy="69" rx="5.5" ry="2.2" fill="#8592FF"/></g>`,
  `<path d="M65 63 q-6 -17 -17 -23 M79 63 q6 -17 17 -23" fill="none" stroke="#7A5A00" stroke-width="3.5" stroke-linecap="round"/><circle class="k-bulb" cx="47" cy="39" r="5.5" fill="#FFF6B0" stroke="#E0A800" stroke-width="2"/><circle class="k-bulb" cx="97" cy="39" r="5.5" fill="#FFF6B0" stroke="#E0A800" stroke-width="2"/>`,
  'M104 62 q-6 9 0 12 q6 -3 0 -12z')
};
export function mascotSVG(k: MascotKey, state: Mood = "idle"): string { return DRAW[k](state); }
