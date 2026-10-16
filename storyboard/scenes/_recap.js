// Builds the six recap shots from window.RECAP, so every company's recap shares one template.
const R = window.RECAP
Object.entries({ bg: R.bg, fg: R.ink, mute: R.mute, line: R.line, grad: R.grad }).forEach(([k, v]) => document.documentElement.style.setProperty('--' + k, v))
const piece = (file, t) => `../../companies/${R.slug}/versions/${R.v}/pieces/${file}.html?t=${t}&muted=1`
const frame = (cls, file, t, style = '') => `<div class="frame ${cls}" style="${style}"><iframe src="${piece(file, t)}" scrolling="no"></iframe></div>`
const label = (n, txt) => `<p class="m label"><b>${n} ·</b> ${txt}</p>`
const head = `<div class="top m">Motion · ${R.name} · ${R.v}</div>`
const safe = `<div class="safe" style="top:220px">safe area ↓</div><div class="safe" style="top:1540px">↑ safe area</div>`
const shots = [
  `<div class="top m">Motion · by noletorious</div>
   <div class="mid"><div class="f" style="font-size:230px;line-height:.9">${R.name},</div>
   <div class="f grad" style="font-size:150px;line-height:1;margin-top:10px">in motion</div>
   <div class="dots">${R.colors.map((c) => `<i style="background:${c}"></i>`).join('')}</div>
   <p class="m" style="margin-top:80px;color:var(--fg)">${R.v} · <span style="font-family:Fraunces;font-style:italic;text-transform:none;letter-spacing:0;font-size:40px">${R.vname}</span></p></div>`,
  `${head}<div class="mid">${label('01', 'Logo sting')}${frame('w169', 'logo-sting', R.t.sting)}</div>`,
  `${head}<div class="mid">${label('02', '15s promo')}${frame('w169', 'promo-15s', R.t.promoA)}<div style="height:40px"></div>${frame('w169', 'promo-15s', R.t.promoB)}</div>`,
  `${head}<div class="mid">${label('03', 'Social loop')}${frame('sq', 'social-loop', R.t.loop)}</div>`,
  `${head}<div class="mid"><div class="collage">
     ${frame('w169', 'promo-15s', R.t.promoA, 'top:0;transform:translateX(-56%) rotate(-4deg) scale(.82)')}
     ${frame('w169', 'logo-sting', R.t.sting, 'top:330px;transform:translateX(-44%) rotate(3deg) scale(.82)')}
     ${frame('sq', 'social-loop', R.t.loop, 'top:610px;transform:translateX(-50%) rotate(-2deg) scale(.56)')}
   </div><div class="f" style="font-size:96px;line-height:1;margin-top:-20px">Three pieces.<br><i style="color:var(--mute)">All code.</i></div></div>`,
  `<div class="mid end"><div class="mark"><img src="_logo-light.svg"><span class="f name">Motion</span></div>
   <p class="m" style="margin-top:50px;color:var(--fg);font-size:34px">motion.noletorious.com</p>
   <p class="m next">Next → ${R.v2}</p></div>`,
]
document.querySelector('.stage').innerHTML = shots.map((s, i) => `<section class="shot" data-shot="${i + 1}">${s}${safe}</section>`).join('')
const shot = new URLSearchParams(location.search).get('shot') || '1'
for (const s of document.querySelectorAll('.shot')) s.hidden = s.dataset.shot !== shot
