/* DATA ONLY — two acts, one destination: the Torii-Gate Mandap on the mountain.
   Act 1 (him): Mumbai monsoon → climbs the mountain → reaches the mandap, WAITS.
   Act 2 (her): Calgary snow → climbs the same mountain → finds him there.
   Rings appear at the finale (no pickup). No planes, no Act 3.
   x = world px · ground top = y 400 · laddoo/token dy = height above ground. */
window.LEVELS = {
  acts: ['act1', 'act2'],

  act1: {
    id: 'act1',
    style: 'mumbai',
    player: 'mayank',
    music: 'india',
    name: 'ACT 1 - MUMBAI',
    chapter: ['ACT 1 - MUMBAI', '', '2018. TWO STRANGERS', 'AT ENDEAVOUR,', 'GRINDING THROUGH', 'MBA PREP.'],
    clearLine: ['ACT 1 CLEAR \u2726', '', 'HE REACHED THE MANDAP.', 'AND HE WAITED.'],
    nextLabel: '\u25B6 HER TURN',
    endScene: 'torii',
    speed: 175,
    flagX: 3600,
    tokenIndex: 0,
    tokenToast: '\u2726 Memory unlocked: 2018 - where it all began',
    monster: { x: 2870, hp: 4, name: 'THE LONG-DISTANCE MONSTER',
               toast: '\u{1F498} Distance: defeated. For now\u2026' },
    physics: { jumpScale: 0.92 },
    weather: 'rain',
    platforms: [
      { x: 620,  y: 340, w: 70, kind: 'trainroof' },
      { x: 700,  y: 340, w: 70, kind: 'trainroof' },
      { x: 780,  y: 340, w: 70, kind: 'trainroof' },
      { x: 1180, y: 352, w: 56, kind: 'scaffold' },
      { x: 1252, y: 312, w: 56, kind: 'scaffold' },
      { x: 1820, y: 336, w: 70, kind: 'trainroof' },
      { x: 1892, y: 336, w: 70, kind: 'trainroof' },
      { x: 1964, y: 336, w: 70, kind: 'trainroof' },
      { x: 3080, y: 364, w: 200, kind: 'terrace' },
      { x: 3320, y: 330, w: 200, kind: 'terrace' }
    ],
    blocks: [
      { x: 380,  y: 316, drop: 'heart' },
      { x: 950,  y: 316, drop: 'heart' },
      { x: 1330, y: 266, drop: 'prop:chai' },
      { x: 2150, y: 316, drop: 'invite:date' },
      { x: 2560, y: 316, drop: 'invite:venue' }
    ],
    enemies: [
      { x: 940,  kind: 'dog' },
      { x: 1450, kind: 'auto' },
      { x: 2240, kind: 'dog' }
    ],
    icicles: [],
    items: [
      { t: 'puddle', x: 300 },
      { t: 'heartc', x: 470,  dy: -46 },
      { t: 'heartc', x: 510,  dy: -68 },
      { t: 'heartc', x: 550,  dy: -46 },
      { t: 'heartc', x: 640,  dy: -80 },
      { t: 'heartc', x: 710,  dy: -80 },
      { t: 'heartc', x: 790,  dy: -80 },
      { t: 'cart',   x: 880 },
      { t: 'heartc', x: 1060, dy: -40 },
      { t: 'heartc', x: 1100, dy: -40 },
      { t: 'heartc', x: 1140, dy: -40 },
      { t: 'heartc', x: 1290, dy: -96 },
      { t: 'puddle', x: 1560 },
      { t: 'heartc', x: 1650, dy: -46 },
      { t: 'heartc', x: 1690, dy: -68 },
      { t: 'heartc', x: 1730, dy: -46 },
      { t: 'token',  x: 1940, dy: -100 },
      { t: 'heartc', x: 2060, dy: -40 },
      { t: 'puddle', x: 2330 },
      { t: 'heartc', x: 2390, dy: -46 },
      { t: 'heartc', x: 2430, dy: -68 },
      { t: 'heartc', x: 2470, dy: -46 },
      { t: 'heartc', x: 3140, dy: -112 },
      { t: 'heartc', x: 3200, dy: -112 },
      { t: 'heartc', x: 3400, dy: -146 },
      { t: 'heartc', x: 3460, dy: -146 }
    ],
    taunts: [
      { x: 260,  text: 'MUMBAI MONSOON' },
      { x: 650,  text: 'BETA, SHAADI KAB?' },
      { x: 1550, text: 'LOG KYA KAHENGE?' },
      { x: 2500, text: 'SAME MOON, 12,000 KM' },
      { x: 3150, text: 'THE MANDAP \u2192' }
    ]
  },

  act2: {
    id: 'act2',
    style: 'calgary',
    player: 'neha',
    music: 'canada',
    name: 'ACT 2 - CALGARY',
    chapter: ['ACT 2 - CALGARY', '', '2024. NEHA, CANADA.', 'NEW CITY. NEW SNOW.', 'SAME 2 AM CALLS.'],
    clearLine: ['IT\u2019S NOT GAME OVER.', 'IT\u2019S GAME START. \u2726'],
    endScene: 'torii',
    groomWaiting: true,
    speed: 180,
    flagX: 3600,
    tokenIndex: 6,
    tokenToast: '\u2726 Memory unlocked: 2024 - Calgary, an ocean away',
    monster: { x: 2870, hp: 5, name: 'IT FOLLOWED HER ACROSS THE OCEAN',
               toast: '\u{1F498} Distance: defeated. FOREVER.' },
    physics: {},
    platforms: [
      { x: 560,  y: 352, w: 54, kind: 'icefloe', move: { dy: 5,  speed: 2.1 } },
      { x: 640,  y: 348, w: 54, kind: 'icefloe', move: { dy: 6,  speed: 1.8 } },
      { x: 720,  y: 352, w: 54, kind: 'icefloe', move: { dy: 5,  speed: 2.3 } },
      { x: 1150, y: 330, w: 120, kind: 'rooftop' },
      { x: 1520, y: 300, w: 46, kind: 'skilift', move: { dy: 22, speed: 1.1 } },
      { x: 1660, y: 280, w: 46, kind: 'skilift', move: { dy: 22, speed: 1.1 } },
      { x: 2050, y: 336, w: 110, kind: 'rooftop' },
      { x: 3080, y: 364, w: 200, kind: 'terrace' },
      { x: 3320, y: 330, w: 200, kind: 'terrace' }
    ],
    blocks: [
      { x: 480,  y: 316, drop: 'heart' },
      { x: 1210, y: 270, drop: 'invite:dress' },
      { x: 2100, y: 276, drop: 'prop:scarf' },
      { x: 2560, y: 316, drop: 'invite:rsvp' },
      { x: 3150, y: 316, drop: 'prop:coffee' }
    ],
    enemies: [
      { x: 1350, kind: 'plow' },
      { x: 2260, kind: 'plow' }
    ],
    icicles: [ { x: 980 }, { x: 1445 }, { x: 2330 } ],
    items: [
      { t: 'snowdrift', x: 380 },
      { t: 'heartc', x: 470,  dy: -46 },
      { t: 'heartc', x: 585,  dy: -80 },
      { t: 'heartc', x: 665,  dy: -84 },
      { t: 'heartc', x: 745,  dy: -80 },
      { t: 'blackice', x: 900 },
      { t: 'gate',   x: 1030 },
      { t: 'heartc', x: 1180, dy: -95 },
      { t: 'heartc', x: 1230, dy: -95 },
      { t: 'clock',  x: 1400 },
      { t: 'heartc', x: 1540, dy: -120 },
      { t: 'token',  x: 1685, dy: -150 },
      { t: 'snowdrift', x: 1840 },
      { t: 'blackice', x: 1900 },
      { t: 'heartc', x: 1990, dy: -40 },
      { t: 'heartc', x: 2080, dy: -100 },
      { t: 'heartc', x: 2130, dy: -100 },
      { t: 'gate',   x: 2280 },
      { t: 'heartc', x: 2400, dy: -46 },
      { t: 'heartc', x: 2440, dy: -68 },
      { t: 'heartc', x: 2480, dy: -46 },
      { t: 'heartc', x: 3140, dy: -112 },
      { t: 'heartc', x: 3200, dy: -112 },
      { t: 'heartc', x: 3400, dy: -146 },
      { t: 'heartc', x: 3460, dy: -146 }
    ],
    taunts: [
      { x: 320,  text: 'CALGARY. -30\u00B0C.' },
      { x: 840,  text: 'BLACK ICE!' },
      { x: 1550, text: '12.5 HOURS APART' },
      { x: 2450, text: 'DOORON DOORON\u2026' },
      { x: 3150, text: 'HE\u2019S AT THE MANDAP \u2192' }
    ]
  }
};
