var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};

// src/core/static/data.ts
function getPagesUrl(layout) {
  const url = staticData.pages?.[layout];
  if (!url) throw new Error(`Pages not found: ${layout}`);
  return url;
}
function getSurahNameFontUrl() {
  const url = staticData.shared?.surahname;
  if (!url) throw new Error(`Surah name font not found`);
  return url;
}
function getSurahFrameUrl() {
  const url = staticData.assets?.surahFrame;
  if (!url) throw new Error(`Surah frame SVG not found`);
  return url;
}
var staticData;
var init_data = __esm({
  "src/core/static/data.ts"() {
    "use strict";
    staticData = {
      pages: {
        "hafs-unicode": new URL(
          "../../data/pages/hafs-unicode/pages.json",
          import.meta.url
        ).href,
        "hafs-v2": new URL("../../data/pages/hafs-v2/pages.json", import.meta.url).href,
        "hafs-v4": new URL("../../data/pages/hafs-v4/pages.json", import.meta.url).href
      },
      metadata: {
        juz: new URL("../../data/metadata/juz.json", import.meta.url).href,
        surahs: new URL("../../data/metadata/surahs.json", import.meta.url).href
      },
      shared: {
        surahname: new URL("../../data/shared/surah-name-v4.woff2", import.meta.url).href
      },
      assets: {
        surahFrame: new URL(
          "../../data/assets/surah-frame-wikipedia.svg",
          import.meta.url
        ).href
      }
    };
  }
});

// src/core/data-loader.ts
async function loadPages(layout, pageNumber) {
  if (pagesCache[layout] === null) {
    const pagesUrl = getPagesUrl(layout);
    const response = await fetch(pagesUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to load pages from ${pagesUrl}: ${response.status} ${response.statusText}`
      );
    }
    pagesCache[layout] = await response.json();
  }
  const pages = pagesCache[layout];
  if (pageNumber !== void 0) {
    const pageIndex = pageNumber - 1;
    if (pageIndex < 0 || pageIndex >= pages.length) {
      return null;
    }
    return pages[pageIndex];
  }
  return pages;
}
async function loadPage(layout, pageNumber) {
  return await loadPages(layout, pageNumber);
}
var pagesCache;
var init_data_loader = __esm({
  "src/core/data-loader.ts"() {
    "use strict";
    init_data();
    pagesCache = {
      "hafs-v2": null,
      "hafs-v4": null,
      "hafs-unicode": null
    };
  }
});

// src/view/react/index.tsx
import { useCallback, useEffect as useEffect2, useRef as useRef2, useState as useState3 } from "react";

// src/core/index.ts
init_data_loader();

// src/core/static/fonts.ts
var staticFonts = {
  "hafs-v2": {
    1: new URL("../../data/fonts/hafs-v2/p1.woff2", import.meta.url).href,
    10: new URL("../../data/fonts/hafs-v2/p10.woff2", import.meta.url).href,
    100: new URL("../../data/fonts/hafs-v2/p100.woff2", import.meta.url).href,
    101: new URL("../../data/fonts/hafs-v2/p101.woff2", import.meta.url).href,
    102: new URL("../../data/fonts/hafs-v2/p102.woff2", import.meta.url).href,
    103: new URL("../../data/fonts/hafs-v2/p103.woff2", import.meta.url).href,
    104: new URL("../../data/fonts/hafs-v2/p104.woff2", import.meta.url).href,
    105: new URL("../../data/fonts/hafs-v2/p105.woff2", import.meta.url).href,
    106: new URL("../../data/fonts/hafs-v2/p106.woff2", import.meta.url).href,
    107: new URL("../../data/fonts/hafs-v2/p107.woff2", import.meta.url).href,
    108: new URL("../../data/fonts/hafs-v2/p108.woff2", import.meta.url).href,
    109: new URL("../../data/fonts/hafs-v2/p109.woff2", import.meta.url).href,
    11: new URL("../../data/fonts/hafs-v2/p11.woff2", import.meta.url).href,
    110: new URL("../../data/fonts/hafs-v2/p110.woff2", import.meta.url).href,
    111: new URL("../../data/fonts/hafs-v2/p111.woff2", import.meta.url).href,
    112: new URL("../../data/fonts/hafs-v2/p112.woff2", import.meta.url).href,
    113: new URL("../../data/fonts/hafs-v2/p113.woff2", import.meta.url).href,
    114: new URL("../../data/fonts/hafs-v2/p114.woff2", import.meta.url).href,
    115: new URL("../../data/fonts/hafs-v2/p115.woff2", import.meta.url).href,
    116: new URL("../../data/fonts/hafs-v2/p116.woff2", import.meta.url).href,
    117: new URL("../../data/fonts/hafs-v2/p117.woff2", import.meta.url).href,
    118: new URL("../../data/fonts/hafs-v2/p118.woff2", import.meta.url).href,
    119: new URL("../../data/fonts/hafs-v2/p119.woff2", import.meta.url).href,
    12: new URL("../../data/fonts/hafs-v2/p12.woff2", import.meta.url).href,
    120: new URL("../../data/fonts/hafs-v2/p120.woff2", import.meta.url).href,
    121: new URL("../../data/fonts/hafs-v2/p121.woff2", import.meta.url).href,
    122: new URL("../../data/fonts/hafs-v2/p122.woff2", import.meta.url).href,
    123: new URL("../../data/fonts/hafs-v2/p123.woff2", import.meta.url).href,
    124: new URL("../../data/fonts/hafs-v2/p124.woff2", import.meta.url).href,
    125: new URL("../../data/fonts/hafs-v2/p125.woff2", import.meta.url).href,
    126: new URL("../../data/fonts/hafs-v2/p126.woff2", import.meta.url).href,
    127: new URL("../../data/fonts/hafs-v2/p127.woff2", import.meta.url).href,
    128: new URL("../../data/fonts/hafs-v2/p128.woff2", import.meta.url).href,
    129: new URL("../../data/fonts/hafs-v2/p129.woff2", import.meta.url).href,
    13: new URL("../../data/fonts/hafs-v2/p13.woff2", import.meta.url).href,
    130: new URL("../../data/fonts/hafs-v2/p130.woff2", import.meta.url).href,
    131: new URL("../../data/fonts/hafs-v2/p131.woff2", import.meta.url).href,
    132: new URL("../../data/fonts/hafs-v2/p132.woff2", import.meta.url).href,
    133: new URL("../../data/fonts/hafs-v2/p133.woff2", import.meta.url).href,
    134: new URL("../../data/fonts/hafs-v2/p134.woff2", import.meta.url).href,
    135: new URL("../../data/fonts/hafs-v2/p135.woff2", import.meta.url).href,
    136: new URL("../../data/fonts/hafs-v2/p136.woff2", import.meta.url).href,
    137: new URL("../../data/fonts/hafs-v2/p137.woff2", import.meta.url).href,
    138: new URL("../../data/fonts/hafs-v2/p138.woff2", import.meta.url).href,
    139: new URL("../../data/fonts/hafs-v2/p139.woff2", import.meta.url).href,
    14: new URL("../../data/fonts/hafs-v2/p14.woff2", import.meta.url).href,
    140: new URL("../../data/fonts/hafs-v2/p140.woff2", import.meta.url).href,
    141: new URL("../../data/fonts/hafs-v2/p141.woff2", import.meta.url).href,
    142: new URL("../../data/fonts/hafs-v2/p142.woff2", import.meta.url).href,
    143: new URL("../../data/fonts/hafs-v2/p143.woff2", import.meta.url).href,
    144: new URL("../../data/fonts/hafs-v2/p144.woff2", import.meta.url).href,
    145: new URL("../../data/fonts/hafs-v2/p145.woff2", import.meta.url).href,
    146: new URL("../../data/fonts/hafs-v2/p146.woff2", import.meta.url).href,
    147: new URL("../../data/fonts/hafs-v2/p147.woff2", import.meta.url).href,
    148: new URL("../../data/fonts/hafs-v2/p148.woff2", import.meta.url).href,
    149: new URL("../../data/fonts/hafs-v2/p149.woff2", import.meta.url).href,
    15: new URL("../../data/fonts/hafs-v2/p15.woff2", import.meta.url).href,
    150: new URL("../../data/fonts/hafs-v2/p150.woff2", import.meta.url).href,
    151: new URL("../../data/fonts/hafs-v2/p151.woff2", import.meta.url).href,
    152: new URL("../../data/fonts/hafs-v2/p152.woff2", import.meta.url).href,
    153: new URL("../../data/fonts/hafs-v2/p153.woff2", import.meta.url).href,
    154: new URL("../../data/fonts/hafs-v2/p154.woff2", import.meta.url).href,
    155: new URL("../../data/fonts/hafs-v2/p155.woff2", import.meta.url).href,
    156: new URL("../../data/fonts/hafs-v2/p156.woff2", import.meta.url).href,
    157: new URL("../../data/fonts/hafs-v2/p157.woff2", import.meta.url).href,
    158: new URL("../../data/fonts/hafs-v2/p158.woff2", import.meta.url).href,
    159: new URL("../../data/fonts/hafs-v2/p159.woff2", import.meta.url).href,
    16: new URL("../../data/fonts/hafs-v2/p16.woff2", import.meta.url).href,
    160: new URL("../../data/fonts/hafs-v2/p160.woff2", import.meta.url).href,
    161: new URL("../../data/fonts/hafs-v2/p161.woff2", import.meta.url).href,
    162: new URL("../../data/fonts/hafs-v2/p162.woff2", import.meta.url).href,
    163: new URL("../../data/fonts/hafs-v2/p163.woff2", import.meta.url).href,
    164: new URL("../../data/fonts/hafs-v2/p164.woff2", import.meta.url).href,
    165: new URL("../../data/fonts/hafs-v2/p165.woff2", import.meta.url).href,
    166: new URL("../../data/fonts/hafs-v2/p166.woff2", import.meta.url).href,
    167: new URL("../../data/fonts/hafs-v2/p167.woff2", import.meta.url).href,
    168: new URL("../../data/fonts/hafs-v2/p168.woff2", import.meta.url).href,
    169: new URL("../../data/fonts/hafs-v2/p169.woff2", import.meta.url).href,
    17: new URL("../../data/fonts/hafs-v2/p17.woff2", import.meta.url).href,
    170: new URL("../../data/fonts/hafs-v2/p170.woff2", import.meta.url).href,
    171: new URL("../../data/fonts/hafs-v2/p171.woff2", import.meta.url).href,
    172: new URL("../../data/fonts/hafs-v2/p172.woff2", import.meta.url).href,
    173: new URL("../../data/fonts/hafs-v2/p173.woff2", import.meta.url).href,
    174: new URL("../../data/fonts/hafs-v2/p174.woff2", import.meta.url).href,
    175: new URL("../../data/fonts/hafs-v2/p175.woff2", import.meta.url).href,
    176: new URL("../../data/fonts/hafs-v2/p176.woff2", import.meta.url).href,
    177: new URL("../../data/fonts/hafs-v2/p177.woff2", import.meta.url).href,
    178: new URL("../../data/fonts/hafs-v2/p178.woff2", import.meta.url).href,
    179: new URL("../../data/fonts/hafs-v2/p179.woff2", import.meta.url).href,
    18: new URL("../../data/fonts/hafs-v2/p18.woff2", import.meta.url).href,
    180: new URL("../../data/fonts/hafs-v2/p180.woff2", import.meta.url).href,
    181: new URL("../../data/fonts/hafs-v2/p181.woff2", import.meta.url).href,
    182: new URL("../../data/fonts/hafs-v2/p182.woff2", import.meta.url).href,
    183: new URL("../../data/fonts/hafs-v2/p183.woff2", import.meta.url).href,
    184: new URL("../../data/fonts/hafs-v2/p184.woff2", import.meta.url).href,
    185: new URL("../../data/fonts/hafs-v2/p185.woff2", import.meta.url).href,
    186: new URL("../../data/fonts/hafs-v2/p186.woff2", import.meta.url).href,
    187: new URL("../../data/fonts/hafs-v2/p187.woff2", import.meta.url).href,
    188: new URL("../../data/fonts/hafs-v2/p188.woff2", import.meta.url).href,
    189: new URL("../../data/fonts/hafs-v2/p189.woff2", import.meta.url).href,
    19: new URL("../../data/fonts/hafs-v2/p19.woff2", import.meta.url).href,
    190: new URL("../../data/fonts/hafs-v2/p190.woff2", import.meta.url).href,
    191: new URL("../../data/fonts/hafs-v2/p191.woff2", import.meta.url).href,
    192: new URL("../../data/fonts/hafs-v2/p192.woff2", import.meta.url).href,
    193: new URL("../../data/fonts/hafs-v2/p193.woff2", import.meta.url).href,
    194: new URL("../../data/fonts/hafs-v2/p194.woff2", import.meta.url).href,
    195: new URL("../../data/fonts/hafs-v2/p195.woff2", import.meta.url).href,
    196: new URL("../../data/fonts/hafs-v2/p196.woff2", import.meta.url).href,
    197: new URL("../../data/fonts/hafs-v2/p197.woff2", import.meta.url).href,
    198: new URL("../../data/fonts/hafs-v2/p198.woff2", import.meta.url).href,
    199: new URL("../../data/fonts/hafs-v2/p199.woff2", import.meta.url).href,
    2: new URL("../../data/fonts/hafs-v2/p2.woff2", import.meta.url).href,
    20: new URL("../../data/fonts/hafs-v2/p20.woff2", import.meta.url).href,
    200: new URL("../../data/fonts/hafs-v2/p200.woff2", import.meta.url).href,
    201: new URL("../../data/fonts/hafs-v2/p201.woff2", import.meta.url).href,
    202: new URL("../../data/fonts/hafs-v2/p202.woff2", import.meta.url).href,
    203: new URL("../../data/fonts/hafs-v2/p203.woff2", import.meta.url).href,
    204: new URL("../../data/fonts/hafs-v2/p204.woff2", import.meta.url).href,
    205: new URL("../../data/fonts/hafs-v2/p205.woff2", import.meta.url).href,
    206: new URL("../../data/fonts/hafs-v2/p206.woff2", import.meta.url).href,
    207: new URL("../../data/fonts/hafs-v2/p207.woff2", import.meta.url).href,
    208: new URL("../../data/fonts/hafs-v2/p208.woff2", import.meta.url).href,
    209: new URL("../../data/fonts/hafs-v2/p209.woff2", import.meta.url).href,
    21: new URL("../../data/fonts/hafs-v2/p21.woff2", import.meta.url).href,
    210: new URL("../../data/fonts/hafs-v2/p210.woff2", import.meta.url).href,
    211: new URL("../../data/fonts/hafs-v2/p211.woff2", import.meta.url).href,
    212: new URL("../../data/fonts/hafs-v2/p212.woff2", import.meta.url).href,
    213: new URL("../../data/fonts/hafs-v2/p213.woff2", import.meta.url).href,
    214: new URL("../../data/fonts/hafs-v2/p214.woff2", import.meta.url).href,
    215: new URL("../../data/fonts/hafs-v2/p215.woff2", import.meta.url).href,
    216: new URL("../../data/fonts/hafs-v2/p216.woff2", import.meta.url).href,
    217: new URL("../../data/fonts/hafs-v2/p217.woff2", import.meta.url).href,
    218: new URL("../../data/fonts/hafs-v2/p218.woff2", import.meta.url).href,
    219: new URL("../../data/fonts/hafs-v2/p219.woff2", import.meta.url).href,
    22: new URL("../../data/fonts/hafs-v2/p22.woff2", import.meta.url).href,
    220: new URL("../../data/fonts/hafs-v2/p220.woff2", import.meta.url).href,
    221: new URL("../../data/fonts/hafs-v2/p221.woff2", import.meta.url).href,
    222: new URL("../../data/fonts/hafs-v2/p222.woff2", import.meta.url).href,
    223: new URL("../../data/fonts/hafs-v2/p223.woff2", import.meta.url).href,
    224: new URL("../../data/fonts/hafs-v2/p224.woff2", import.meta.url).href,
    225: new URL("../../data/fonts/hafs-v2/p225.woff2", import.meta.url).href,
    226: new URL("../../data/fonts/hafs-v2/p226.woff2", import.meta.url).href,
    227: new URL("../../data/fonts/hafs-v2/p227.woff2", import.meta.url).href,
    228: new URL("../../data/fonts/hafs-v2/p228.woff2", import.meta.url).href,
    229: new URL("../../data/fonts/hafs-v2/p229.woff2", import.meta.url).href,
    23: new URL("../../data/fonts/hafs-v2/p23.woff2", import.meta.url).href,
    230: new URL("../../data/fonts/hafs-v2/p230.woff2", import.meta.url).href,
    231: new URL("../../data/fonts/hafs-v2/p231.woff2", import.meta.url).href,
    232: new URL("../../data/fonts/hafs-v2/p232.woff2", import.meta.url).href,
    233: new URL("../../data/fonts/hafs-v2/p233.woff2", import.meta.url).href,
    234: new URL("../../data/fonts/hafs-v2/p234.woff2", import.meta.url).href,
    235: new URL("../../data/fonts/hafs-v2/p235.woff2", import.meta.url).href,
    236: new URL("../../data/fonts/hafs-v2/p236.woff2", import.meta.url).href,
    237: new URL("../../data/fonts/hafs-v2/p237.woff2", import.meta.url).href,
    238: new URL("../../data/fonts/hafs-v2/p238.woff2", import.meta.url).href,
    239: new URL("../../data/fonts/hafs-v2/p239.woff2", import.meta.url).href,
    24: new URL("../../data/fonts/hafs-v2/p24.woff2", import.meta.url).href,
    240: new URL("../../data/fonts/hafs-v2/p240.woff2", import.meta.url).href,
    241: new URL("../../data/fonts/hafs-v2/p241.woff2", import.meta.url).href,
    242: new URL("../../data/fonts/hafs-v2/p242.woff2", import.meta.url).href,
    243: new URL("../../data/fonts/hafs-v2/p243.woff2", import.meta.url).href,
    244: new URL("../../data/fonts/hafs-v2/p244.woff2", import.meta.url).href,
    245: new URL("../../data/fonts/hafs-v2/p245.woff2", import.meta.url).href,
    246: new URL("../../data/fonts/hafs-v2/p246.woff2", import.meta.url).href,
    247: new URL("../../data/fonts/hafs-v2/p247.woff2", import.meta.url).href,
    248: new URL("../../data/fonts/hafs-v2/p248.woff2", import.meta.url).href,
    249: new URL("../../data/fonts/hafs-v2/p249.woff2", import.meta.url).href,
    25: new URL("../../data/fonts/hafs-v2/p25.woff2", import.meta.url).href,
    250: new URL("../../data/fonts/hafs-v2/p250.woff2", import.meta.url).href,
    251: new URL("../../data/fonts/hafs-v2/p251.woff2", import.meta.url).href,
    252: new URL("../../data/fonts/hafs-v2/p252.woff2", import.meta.url).href,
    253: new URL("../../data/fonts/hafs-v2/p253.woff2", import.meta.url).href,
    254: new URL("../../data/fonts/hafs-v2/p254.woff2", import.meta.url).href,
    255: new URL("../../data/fonts/hafs-v2/p255.woff2", import.meta.url).href,
    256: new URL("../../data/fonts/hafs-v2/p256.woff2", import.meta.url).href,
    257: new URL("../../data/fonts/hafs-v2/p257.woff2", import.meta.url).href,
    258: new URL("../../data/fonts/hafs-v2/p258.woff2", import.meta.url).href,
    259: new URL("../../data/fonts/hafs-v2/p259.woff2", import.meta.url).href,
    26: new URL("../../data/fonts/hafs-v2/p26.woff2", import.meta.url).href,
    260: new URL("../../data/fonts/hafs-v2/p260.woff2", import.meta.url).href,
    261: new URL("../../data/fonts/hafs-v2/p261.woff2", import.meta.url).href,
    262: new URL("../../data/fonts/hafs-v2/p262.woff2", import.meta.url).href,
    263: new URL("../../data/fonts/hafs-v2/p263.woff2", import.meta.url).href,
    264: new URL("../../data/fonts/hafs-v2/p264.woff2", import.meta.url).href,
    265: new URL("../../data/fonts/hafs-v2/p265.woff2", import.meta.url).href,
    266: new URL("../../data/fonts/hafs-v2/p266.woff2", import.meta.url).href,
    267: new URL("../../data/fonts/hafs-v2/p267.woff2", import.meta.url).href,
    268: new URL("../../data/fonts/hafs-v2/p268.woff2", import.meta.url).href,
    269: new URL("../../data/fonts/hafs-v2/p269.woff2", import.meta.url).href,
    27: new URL("../../data/fonts/hafs-v2/p27.woff2", import.meta.url).href,
    270: new URL("../../data/fonts/hafs-v2/p270.woff2", import.meta.url).href,
    271: new URL("../../data/fonts/hafs-v2/p271.woff2", import.meta.url).href,
    272: new URL("../../data/fonts/hafs-v2/p272.woff2", import.meta.url).href,
    273: new URL("../../data/fonts/hafs-v2/p273.woff2", import.meta.url).href,
    274: new URL("../../data/fonts/hafs-v2/p274.woff2", import.meta.url).href,
    275: new URL("../../data/fonts/hafs-v2/p275.woff2", import.meta.url).href,
    276: new URL("../../data/fonts/hafs-v2/p276.woff2", import.meta.url).href,
    277: new URL("../../data/fonts/hafs-v2/p277.woff2", import.meta.url).href,
    278: new URL("../../data/fonts/hafs-v2/p278.woff2", import.meta.url).href,
    279: new URL("../../data/fonts/hafs-v2/p279.woff2", import.meta.url).href,
    28: new URL("../../data/fonts/hafs-v2/p28.woff2", import.meta.url).href,
    280: new URL("../../data/fonts/hafs-v2/p280.woff2", import.meta.url).href,
    281: new URL("../../data/fonts/hafs-v2/p281.woff2", import.meta.url).href,
    282: new URL("../../data/fonts/hafs-v2/p282.woff2", import.meta.url).href,
    283: new URL("../../data/fonts/hafs-v2/p283.woff2", import.meta.url).href,
    284: new URL("../../data/fonts/hafs-v2/p284.woff2", import.meta.url).href,
    285: new URL("../../data/fonts/hafs-v2/p285.woff2", import.meta.url).href,
    286: new URL("../../data/fonts/hafs-v2/p286.woff2", import.meta.url).href,
    287: new URL("../../data/fonts/hafs-v2/p287.woff2", import.meta.url).href,
    288: new URL("../../data/fonts/hafs-v2/p288.woff2", import.meta.url).href,
    289: new URL("../../data/fonts/hafs-v2/p289.woff2", import.meta.url).href,
    29: new URL("../../data/fonts/hafs-v2/p29.woff2", import.meta.url).href,
    290: new URL("../../data/fonts/hafs-v2/p290.woff2", import.meta.url).href,
    291: new URL("../../data/fonts/hafs-v2/p291.woff2", import.meta.url).href,
    292: new URL("../../data/fonts/hafs-v2/p292.woff2", import.meta.url).href,
    293: new URL("../../data/fonts/hafs-v2/p293.woff2", import.meta.url).href,
    294: new URL("../../data/fonts/hafs-v2/p294.woff2", import.meta.url).href,
    295: new URL("../../data/fonts/hafs-v2/p295.woff2", import.meta.url).href,
    296: new URL("../../data/fonts/hafs-v2/p296.woff2", import.meta.url).href,
    297: new URL("../../data/fonts/hafs-v2/p297.woff2", import.meta.url).href,
    298: new URL("../../data/fonts/hafs-v2/p298.woff2", import.meta.url).href,
    299: new URL("../../data/fonts/hafs-v2/p299.woff2", import.meta.url).href,
    3: new URL("../../data/fonts/hafs-v2/p3.woff2", import.meta.url).href,
    30: new URL("../../data/fonts/hafs-v2/p30.woff2", import.meta.url).href,
    300: new URL("../../data/fonts/hafs-v2/p300.woff2", import.meta.url).href,
    301: new URL("../../data/fonts/hafs-v2/p301.woff2", import.meta.url).href,
    302: new URL("../../data/fonts/hafs-v2/p302.woff2", import.meta.url).href,
    303: new URL("../../data/fonts/hafs-v2/p303.woff2", import.meta.url).href,
    304: new URL("../../data/fonts/hafs-v2/p304.woff2", import.meta.url).href,
    305: new URL("../../data/fonts/hafs-v2/p305.woff2", import.meta.url).href,
    306: new URL("../../data/fonts/hafs-v2/p306.woff2", import.meta.url).href,
    307: new URL("../../data/fonts/hafs-v2/p307.woff2", import.meta.url).href,
    308: new URL("../../data/fonts/hafs-v2/p308.woff2", import.meta.url).href,
    309: new URL("../../data/fonts/hafs-v2/p309.woff2", import.meta.url).href,
    31: new URL("../../data/fonts/hafs-v2/p31.woff2", import.meta.url).href,
    310: new URL("../../data/fonts/hafs-v2/p310.woff2", import.meta.url).href,
    311: new URL("../../data/fonts/hafs-v2/p311.woff2", import.meta.url).href,
    312: new URL("../../data/fonts/hafs-v2/p312.woff2", import.meta.url).href,
    313: new URL("../../data/fonts/hafs-v2/p313.woff2", import.meta.url).href,
    314: new URL("../../data/fonts/hafs-v2/p314.woff2", import.meta.url).href,
    315: new URL("../../data/fonts/hafs-v2/p315.woff2", import.meta.url).href,
    316: new URL("../../data/fonts/hafs-v2/p316.woff2", import.meta.url).href,
    317: new URL("../../data/fonts/hafs-v2/p317.woff2", import.meta.url).href,
    318: new URL("../../data/fonts/hafs-v2/p318.woff2", import.meta.url).href,
    319: new URL("../../data/fonts/hafs-v2/p319.woff2", import.meta.url).href,
    32: new URL("../../data/fonts/hafs-v2/p32.woff2", import.meta.url).href,
    320: new URL("../../data/fonts/hafs-v2/p320.woff2", import.meta.url).href,
    321: new URL("../../data/fonts/hafs-v2/p321.woff2", import.meta.url).href,
    322: new URL("../../data/fonts/hafs-v2/p322.woff2", import.meta.url).href,
    323: new URL("../../data/fonts/hafs-v2/p323.woff2", import.meta.url).href,
    324: new URL("../../data/fonts/hafs-v2/p324.woff2", import.meta.url).href,
    325: new URL("../../data/fonts/hafs-v2/p325.woff2", import.meta.url).href,
    326: new URL("../../data/fonts/hafs-v2/p326.woff2", import.meta.url).href,
    327: new URL("../../data/fonts/hafs-v2/p327.woff2", import.meta.url).href,
    328: new URL("../../data/fonts/hafs-v2/p328.woff2", import.meta.url).href,
    329: new URL("../../data/fonts/hafs-v2/p329.woff2", import.meta.url).href,
    33: new URL("../../data/fonts/hafs-v2/p33.woff2", import.meta.url).href,
    330: new URL("../../data/fonts/hafs-v2/p330.woff2", import.meta.url).href,
    331: new URL("../../data/fonts/hafs-v2/p331.woff2", import.meta.url).href,
    332: new URL("../../data/fonts/hafs-v2/p332.woff2", import.meta.url).href,
    333: new URL("../../data/fonts/hafs-v2/p333.woff2", import.meta.url).href,
    334: new URL("../../data/fonts/hafs-v2/p334.woff2", import.meta.url).href,
    335: new URL("../../data/fonts/hafs-v2/p335.woff2", import.meta.url).href,
    336: new URL("../../data/fonts/hafs-v2/p336.woff2", import.meta.url).href,
    337: new URL("../../data/fonts/hafs-v2/p337.woff2", import.meta.url).href,
    338: new URL("../../data/fonts/hafs-v2/p338.woff2", import.meta.url).href,
    339: new URL("../../data/fonts/hafs-v2/p339.woff2", import.meta.url).href,
    34: new URL("../../data/fonts/hafs-v2/p34.woff2", import.meta.url).href,
    340: new URL("../../data/fonts/hafs-v2/p340.woff2", import.meta.url).href,
    341: new URL("../../data/fonts/hafs-v2/p341.woff2", import.meta.url).href,
    342: new URL("../../data/fonts/hafs-v2/p342.woff2", import.meta.url).href,
    343: new URL("../../data/fonts/hafs-v2/p343.woff2", import.meta.url).href,
    344: new URL("../../data/fonts/hafs-v2/p344.woff2", import.meta.url).href,
    345: new URL("../../data/fonts/hafs-v2/p345.woff2", import.meta.url).href,
    346: new URL("../../data/fonts/hafs-v2/p346.woff2", import.meta.url).href,
    347: new URL("../../data/fonts/hafs-v2/p347.woff2", import.meta.url).href,
    348: new URL("../../data/fonts/hafs-v2/p348.woff2", import.meta.url).href,
    349: new URL("../../data/fonts/hafs-v2/p349.woff2", import.meta.url).href,
    35: new URL("../../data/fonts/hafs-v2/p35.woff2", import.meta.url).href,
    350: new URL("../../data/fonts/hafs-v2/p350.woff2", import.meta.url).href,
    351: new URL("../../data/fonts/hafs-v2/p351.woff2", import.meta.url).href,
    352: new URL("../../data/fonts/hafs-v2/p352.woff2", import.meta.url).href,
    353: new URL("../../data/fonts/hafs-v2/p353.woff2", import.meta.url).href,
    354: new URL("../../data/fonts/hafs-v2/p354.woff2", import.meta.url).href,
    355: new URL("../../data/fonts/hafs-v2/p355.woff2", import.meta.url).href,
    356: new URL("../../data/fonts/hafs-v2/p356.woff2", import.meta.url).href,
    357: new URL("../../data/fonts/hafs-v2/p357.woff2", import.meta.url).href,
    358: new URL("../../data/fonts/hafs-v2/p358.woff2", import.meta.url).href,
    359: new URL("../../data/fonts/hafs-v2/p359.woff2", import.meta.url).href,
    36: new URL("../../data/fonts/hafs-v2/p36.woff2", import.meta.url).href,
    360: new URL("../../data/fonts/hafs-v2/p360.woff2", import.meta.url).href,
    361: new URL("../../data/fonts/hafs-v2/p361.woff2", import.meta.url).href,
    362: new URL("../../data/fonts/hafs-v2/p362.woff2", import.meta.url).href,
    363: new URL("../../data/fonts/hafs-v2/p363.woff2", import.meta.url).href,
    364: new URL("../../data/fonts/hafs-v2/p364.woff2", import.meta.url).href,
    365: new URL("../../data/fonts/hafs-v2/p365.woff2", import.meta.url).href,
    366: new URL("../../data/fonts/hafs-v2/p366.woff2", import.meta.url).href,
    367: new URL("../../data/fonts/hafs-v2/p367.woff2", import.meta.url).href,
    368: new URL("../../data/fonts/hafs-v2/p368.woff2", import.meta.url).href,
    369: new URL("../../data/fonts/hafs-v2/p369.woff2", import.meta.url).href,
    37: new URL("../../data/fonts/hafs-v2/p37.woff2", import.meta.url).href,
    370: new URL("../../data/fonts/hafs-v2/p370.woff2", import.meta.url).href,
    371: new URL("../../data/fonts/hafs-v2/p371.woff2", import.meta.url).href,
    372: new URL("../../data/fonts/hafs-v2/p372.woff2", import.meta.url).href,
    373: new URL("../../data/fonts/hafs-v2/p373.woff2", import.meta.url).href,
    374: new URL("../../data/fonts/hafs-v2/p374.woff2", import.meta.url).href,
    375: new URL("../../data/fonts/hafs-v2/p375.woff2", import.meta.url).href,
    376: new URL("../../data/fonts/hafs-v2/p376.woff2", import.meta.url).href,
    377: new URL("../../data/fonts/hafs-v2/p377.woff2", import.meta.url).href,
    378: new URL("../../data/fonts/hafs-v2/p378.woff2", import.meta.url).href,
    379: new URL("../../data/fonts/hafs-v2/p379.woff2", import.meta.url).href,
    38: new URL("../../data/fonts/hafs-v2/p38.woff2", import.meta.url).href,
    380: new URL("../../data/fonts/hafs-v2/p380.woff2", import.meta.url).href,
    381: new URL("../../data/fonts/hafs-v2/p381.woff2", import.meta.url).href,
    382: new URL("../../data/fonts/hafs-v2/p382.woff2", import.meta.url).href,
    383: new URL("../../data/fonts/hafs-v2/p383.woff2", import.meta.url).href,
    384: new URL("../../data/fonts/hafs-v2/p384.woff2", import.meta.url).href,
    385: new URL("../../data/fonts/hafs-v2/p385.woff2", import.meta.url).href,
    386: new URL("../../data/fonts/hafs-v2/p386.woff2", import.meta.url).href,
    387: new URL("../../data/fonts/hafs-v2/p387.woff2", import.meta.url).href,
    388: new URL("../../data/fonts/hafs-v2/p388.woff2", import.meta.url).href,
    389: new URL("../../data/fonts/hafs-v2/p389.woff2", import.meta.url).href,
    39: new URL("../../data/fonts/hafs-v2/p39.woff2", import.meta.url).href,
    390: new URL("../../data/fonts/hafs-v2/p390.woff2", import.meta.url).href,
    391: new URL("../../data/fonts/hafs-v2/p391.woff2", import.meta.url).href,
    392: new URL("../../data/fonts/hafs-v2/p392.woff2", import.meta.url).href,
    393: new URL("../../data/fonts/hafs-v2/p393.woff2", import.meta.url).href,
    394: new URL("../../data/fonts/hafs-v2/p394.woff2", import.meta.url).href,
    395: new URL("../../data/fonts/hafs-v2/p395.woff2", import.meta.url).href,
    396: new URL("../../data/fonts/hafs-v2/p396.woff2", import.meta.url).href,
    397: new URL("../../data/fonts/hafs-v2/p397.woff2", import.meta.url).href,
    398: new URL("../../data/fonts/hafs-v2/p398.woff2", import.meta.url).href,
    399: new URL("../../data/fonts/hafs-v2/p399.woff2", import.meta.url).href,
    4: new URL("../../data/fonts/hafs-v2/p4.woff2", import.meta.url).href,
    40: new URL("../../data/fonts/hafs-v2/p40.woff2", import.meta.url).href,
    400: new URL("../../data/fonts/hafs-v2/p400.woff2", import.meta.url).href,
    401: new URL("../../data/fonts/hafs-v2/p401.woff2", import.meta.url).href,
    402: new URL("../../data/fonts/hafs-v2/p402.woff2", import.meta.url).href,
    403: new URL("../../data/fonts/hafs-v2/p403.woff2", import.meta.url).href,
    404: new URL("../../data/fonts/hafs-v2/p404.woff2", import.meta.url).href,
    405: new URL("../../data/fonts/hafs-v2/p405.woff2", import.meta.url).href,
    406: new URL("../../data/fonts/hafs-v2/p406.woff2", import.meta.url).href,
    407: new URL("../../data/fonts/hafs-v2/p407.woff2", import.meta.url).href,
    408: new URL("../../data/fonts/hafs-v2/p408.woff2", import.meta.url).href,
    409: new URL("../../data/fonts/hafs-v2/p409.woff2", import.meta.url).href,
    41: new URL("../../data/fonts/hafs-v2/p41.woff2", import.meta.url).href,
    410: new URL("../../data/fonts/hafs-v2/p410.woff2", import.meta.url).href,
    411: new URL("../../data/fonts/hafs-v2/p411.woff2", import.meta.url).href,
    412: new URL("../../data/fonts/hafs-v2/p412.woff2", import.meta.url).href,
    413: new URL("../../data/fonts/hafs-v2/p413.woff2", import.meta.url).href,
    414: new URL("../../data/fonts/hafs-v2/p414.woff2", import.meta.url).href,
    415: new URL("../../data/fonts/hafs-v2/p415.woff2", import.meta.url).href,
    416: new URL("../../data/fonts/hafs-v2/p416.woff2", import.meta.url).href,
    417: new URL("../../data/fonts/hafs-v2/p417.woff2", import.meta.url).href,
    418: new URL("../../data/fonts/hafs-v2/p418.woff2", import.meta.url).href,
    419: new URL("../../data/fonts/hafs-v2/p419.woff2", import.meta.url).href,
    42: new URL("../../data/fonts/hafs-v2/p42.woff2", import.meta.url).href,
    420: new URL("../../data/fonts/hafs-v2/p420.woff2", import.meta.url).href,
    421: new URL("../../data/fonts/hafs-v2/p421.woff2", import.meta.url).href,
    422: new URL("../../data/fonts/hafs-v2/p422.woff2", import.meta.url).href,
    423: new URL("../../data/fonts/hafs-v2/p423.woff2", import.meta.url).href,
    424: new URL("../../data/fonts/hafs-v2/p424.woff2", import.meta.url).href,
    425: new URL("../../data/fonts/hafs-v2/p425.woff2", import.meta.url).href,
    426: new URL("../../data/fonts/hafs-v2/p426.woff2", import.meta.url).href,
    427: new URL("../../data/fonts/hafs-v2/p427.woff2", import.meta.url).href,
    428: new URL("../../data/fonts/hafs-v2/p428.woff2", import.meta.url).href,
    429: new URL("../../data/fonts/hafs-v2/p429.woff2", import.meta.url).href,
    43: new URL("../../data/fonts/hafs-v2/p43.woff2", import.meta.url).href,
    430: new URL("../../data/fonts/hafs-v2/p430.woff2", import.meta.url).href,
    431: new URL("../../data/fonts/hafs-v2/p431.woff2", import.meta.url).href,
    432: new URL("../../data/fonts/hafs-v2/p432.woff2", import.meta.url).href,
    433: new URL("../../data/fonts/hafs-v2/p433.woff2", import.meta.url).href,
    434: new URL("../../data/fonts/hafs-v2/p434.woff2", import.meta.url).href,
    435: new URL("../../data/fonts/hafs-v2/p435.woff2", import.meta.url).href,
    436: new URL("../../data/fonts/hafs-v2/p436.woff2", import.meta.url).href,
    437: new URL("../../data/fonts/hafs-v2/p437.woff2", import.meta.url).href,
    438: new URL("../../data/fonts/hafs-v2/p438.woff2", import.meta.url).href,
    439: new URL("../../data/fonts/hafs-v2/p439.woff2", import.meta.url).href,
    44: new URL("../../data/fonts/hafs-v2/p44.woff2", import.meta.url).href,
    440: new URL("../../data/fonts/hafs-v2/p440.woff2", import.meta.url).href,
    441: new URL("../../data/fonts/hafs-v2/p441.woff2", import.meta.url).href,
    442: new URL("../../data/fonts/hafs-v2/p442.woff2", import.meta.url).href,
    443: new URL("../../data/fonts/hafs-v2/p443.woff2", import.meta.url).href,
    444: new URL("../../data/fonts/hafs-v2/p444.woff2", import.meta.url).href,
    445: new URL("../../data/fonts/hafs-v2/p445.woff2", import.meta.url).href,
    446: new URL("../../data/fonts/hafs-v2/p446.woff2", import.meta.url).href,
    447: new URL("../../data/fonts/hafs-v2/p447.woff2", import.meta.url).href,
    448: new URL("../../data/fonts/hafs-v2/p448.woff2", import.meta.url).href,
    449: new URL("../../data/fonts/hafs-v2/p449.woff2", import.meta.url).href,
    45: new URL("../../data/fonts/hafs-v2/p45.woff2", import.meta.url).href,
    450: new URL("../../data/fonts/hafs-v2/p450.woff2", import.meta.url).href,
    451: new URL("../../data/fonts/hafs-v2/p451.woff2", import.meta.url).href,
    452: new URL("../../data/fonts/hafs-v2/p452.woff2", import.meta.url).href,
    453: new URL("../../data/fonts/hafs-v2/p453.woff2", import.meta.url).href,
    454: new URL("../../data/fonts/hafs-v2/p454.woff2", import.meta.url).href,
    455: new URL("../../data/fonts/hafs-v2/p455.woff2", import.meta.url).href,
    456: new URL("../../data/fonts/hafs-v2/p456.woff2", import.meta.url).href,
    457: new URL("../../data/fonts/hafs-v2/p457.woff2", import.meta.url).href,
    458: new URL("../../data/fonts/hafs-v2/p458.woff2", import.meta.url).href,
    459: new URL("../../data/fonts/hafs-v2/p459.woff2", import.meta.url).href,
    46: new URL("../../data/fonts/hafs-v2/p46.woff2", import.meta.url).href,
    460: new URL("../../data/fonts/hafs-v2/p460.woff2", import.meta.url).href,
    461: new URL("../../data/fonts/hafs-v2/p461.woff2", import.meta.url).href,
    462: new URL("../../data/fonts/hafs-v2/p462.woff2", import.meta.url).href,
    463: new URL("../../data/fonts/hafs-v2/p463.woff2", import.meta.url).href,
    464: new URL("../../data/fonts/hafs-v2/p464.woff2", import.meta.url).href,
    465: new URL("../../data/fonts/hafs-v2/p465.woff2", import.meta.url).href,
    466: new URL("../../data/fonts/hafs-v2/p466.woff2", import.meta.url).href,
    467: new URL("../../data/fonts/hafs-v2/p467.woff2", import.meta.url).href,
    468: new URL("../../data/fonts/hafs-v2/p468.woff2", import.meta.url).href,
    469: new URL("../../data/fonts/hafs-v2/p469.woff2", import.meta.url).href,
    47: new URL("../../data/fonts/hafs-v2/p47.woff2", import.meta.url).href,
    470: new URL("../../data/fonts/hafs-v2/p470.woff2", import.meta.url).href,
    471: new URL("../../data/fonts/hafs-v2/p471.woff2", import.meta.url).href,
    472: new URL("../../data/fonts/hafs-v2/p472.woff2", import.meta.url).href,
    473: new URL("../../data/fonts/hafs-v2/p473.woff2", import.meta.url).href,
    474: new URL("../../data/fonts/hafs-v2/p474.woff2", import.meta.url).href,
    475: new URL("../../data/fonts/hafs-v2/p475.woff2", import.meta.url).href,
    476: new URL("../../data/fonts/hafs-v2/p476.woff2", import.meta.url).href,
    477: new URL("../../data/fonts/hafs-v2/p477.woff2", import.meta.url).href,
    478: new URL("../../data/fonts/hafs-v2/p478.woff2", import.meta.url).href,
    479: new URL("../../data/fonts/hafs-v2/p479.woff2", import.meta.url).href,
    48: new URL("../../data/fonts/hafs-v2/p48.woff2", import.meta.url).href,
    480: new URL("../../data/fonts/hafs-v2/p480.woff2", import.meta.url).href,
    481: new URL("../../data/fonts/hafs-v2/p481.woff2", import.meta.url).href,
    482: new URL("../../data/fonts/hafs-v2/p482.woff2", import.meta.url).href,
    483: new URL("../../data/fonts/hafs-v2/p483.woff2", import.meta.url).href,
    484: new URL("../../data/fonts/hafs-v2/p484.woff2", import.meta.url).href,
    485: new URL("../../data/fonts/hafs-v2/p485.woff2", import.meta.url).href,
    486: new URL("../../data/fonts/hafs-v2/p486.woff2", import.meta.url).href,
    487: new URL("../../data/fonts/hafs-v2/p487.woff2", import.meta.url).href,
    488: new URL("../../data/fonts/hafs-v2/p488.woff2", import.meta.url).href,
    489: new URL("../../data/fonts/hafs-v2/p489.woff2", import.meta.url).href,
    49: new URL("../../data/fonts/hafs-v2/p49.woff2", import.meta.url).href,
    490: new URL("../../data/fonts/hafs-v2/p490.woff2", import.meta.url).href,
    491: new URL("../../data/fonts/hafs-v2/p491.woff2", import.meta.url).href,
    492: new URL("../../data/fonts/hafs-v2/p492.woff2", import.meta.url).href,
    493: new URL("../../data/fonts/hafs-v2/p493.woff2", import.meta.url).href,
    494: new URL("../../data/fonts/hafs-v2/p494.woff2", import.meta.url).href,
    495: new URL("../../data/fonts/hafs-v2/p495.woff2", import.meta.url).href,
    496: new URL("../../data/fonts/hafs-v2/p496.woff2", import.meta.url).href,
    497: new URL("../../data/fonts/hafs-v2/p497.woff2", import.meta.url).href,
    498: new URL("../../data/fonts/hafs-v2/p498.woff2", import.meta.url).href,
    499: new URL("../../data/fonts/hafs-v2/p499.woff2", import.meta.url).href,
    5: new URL("../../data/fonts/hafs-v2/p5.woff2", import.meta.url).href,
    50: new URL("../../data/fonts/hafs-v2/p50.woff2", import.meta.url).href,
    500: new URL("../../data/fonts/hafs-v2/p500.woff2", import.meta.url).href,
    501: new URL("../../data/fonts/hafs-v2/p501.woff2", import.meta.url).href,
    502: new URL("../../data/fonts/hafs-v2/p502.woff2", import.meta.url).href,
    503: new URL("../../data/fonts/hafs-v2/p503.woff2", import.meta.url).href,
    504: new URL("../../data/fonts/hafs-v2/p504.woff2", import.meta.url).href,
    505: new URL("../../data/fonts/hafs-v2/p505.woff2", import.meta.url).href,
    506: new URL("../../data/fonts/hafs-v2/p506.woff2", import.meta.url).href,
    507: new URL("../../data/fonts/hafs-v2/p507.woff2", import.meta.url).href,
    508: new URL("../../data/fonts/hafs-v2/p508.woff2", import.meta.url).href,
    509: new URL("../../data/fonts/hafs-v2/p509.woff2", import.meta.url).href,
    51: new URL("../../data/fonts/hafs-v2/p51.woff2", import.meta.url).href,
    510: new URL("../../data/fonts/hafs-v2/p510.woff2", import.meta.url).href,
    511: new URL("../../data/fonts/hafs-v2/p511.woff2", import.meta.url).href,
    512: new URL("../../data/fonts/hafs-v2/p512.woff2", import.meta.url).href,
    513: new URL("../../data/fonts/hafs-v2/p513.woff2", import.meta.url).href,
    514: new URL("../../data/fonts/hafs-v2/p514.woff2", import.meta.url).href,
    515: new URL("../../data/fonts/hafs-v2/p515.woff2", import.meta.url).href,
    516: new URL("../../data/fonts/hafs-v2/p516.woff2", import.meta.url).href,
    517: new URL("../../data/fonts/hafs-v2/p517.woff2", import.meta.url).href,
    518: new URL("../../data/fonts/hafs-v2/p518.woff2", import.meta.url).href,
    519: new URL("../../data/fonts/hafs-v2/p519.woff2", import.meta.url).href,
    52: new URL("../../data/fonts/hafs-v2/p52.woff2", import.meta.url).href,
    520: new URL("../../data/fonts/hafs-v2/p520.woff2", import.meta.url).href,
    521: new URL("../../data/fonts/hafs-v2/p521.woff2", import.meta.url).href,
    522: new URL("../../data/fonts/hafs-v2/p522.woff2", import.meta.url).href,
    523: new URL("../../data/fonts/hafs-v2/p523.woff2", import.meta.url).href,
    524: new URL("../../data/fonts/hafs-v2/p524.woff2", import.meta.url).href,
    525: new URL("../../data/fonts/hafs-v2/p525.woff2", import.meta.url).href,
    526: new URL("../../data/fonts/hafs-v2/p526.woff2", import.meta.url).href,
    527: new URL("../../data/fonts/hafs-v2/p527.woff2", import.meta.url).href,
    528: new URL("../../data/fonts/hafs-v2/p528.woff2", import.meta.url).href,
    529: new URL("../../data/fonts/hafs-v2/p529.woff2", import.meta.url).href,
    53: new URL("../../data/fonts/hafs-v2/p53.woff2", import.meta.url).href,
    530: new URL("../../data/fonts/hafs-v2/p530.woff2", import.meta.url).href,
    531: new URL("../../data/fonts/hafs-v2/p531.woff2", import.meta.url).href,
    532: new URL("../../data/fonts/hafs-v2/p532.woff2", import.meta.url).href,
    533: new URL("../../data/fonts/hafs-v2/p533.woff2", import.meta.url).href,
    534: new URL("../../data/fonts/hafs-v2/p534.woff2", import.meta.url).href,
    535: new URL("../../data/fonts/hafs-v2/p535.woff2", import.meta.url).href,
    536: new URL("../../data/fonts/hafs-v2/p536.woff2", import.meta.url).href,
    537: new URL("../../data/fonts/hafs-v2/p537.woff2", import.meta.url).href,
    538: new URL("../../data/fonts/hafs-v2/p538.woff2", import.meta.url).href,
    539: new URL("../../data/fonts/hafs-v2/p539.woff2", import.meta.url).href,
    54: new URL("../../data/fonts/hafs-v2/p54.woff2", import.meta.url).href,
    540: new URL("../../data/fonts/hafs-v2/p540.woff2", import.meta.url).href,
    541: new URL("../../data/fonts/hafs-v2/p541.woff2", import.meta.url).href,
    542: new URL("../../data/fonts/hafs-v2/p542.woff2", import.meta.url).href,
    543: new URL("../../data/fonts/hafs-v2/p543.woff2", import.meta.url).href,
    544: new URL("../../data/fonts/hafs-v2/p544.woff2", import.meta.url).href,
    545: new URL("../../data/fonts/hafs-v2/p545.woff2", import.meta.url).href,
    546: new URL("../../data/fonts/hafs-v2/p546.woff2", import.meta.url).href,
    547: new URL("../../data/fonts/hafs-v2/p547.woff2", import.meta.url).href,
    548: new URL("../../data/fonts/hafs-v2/p548.woff2", import.meta.url).href,
    549: new URL("../../data/fonts/hafs-v2/p549.woff2", import.meta.url).href,
    55: new URL("../../data/fonts/hafs-v2/p55.woff2", import.meta.url).href,
    550: new URL("../../data/fonts/hafs-v2/p550.woff2", import.meta.url).href,
    551: new URL("../../data/fonts/hafs-v2/p551.woff2", import.meta.url).href,
    552: new URL("../../data/fonts/hafs-v2/p552.woff2", import.meta.url).href,
    553: new URL("../../data/fonts/hafs-v2/p553.woff2", import.meta.url).href,
    554: new URL("../../data/fonts/hafs-v2/p554.woff2", import.meta.url).href,
    555: new URL("../../data/fonts/hafs-v2/p555.woff2", import.meta.url).href,
    556: new URL("../../data/fonts/hafs-v2/p556.woff2", import.meta.url).href,
    557: new URL("../../data/fonts/hafs-v2/p557.woff2", import.meta.url).href,
    558: new URL("../../data/fonts/hafs-v2/p558.woff2", import.meta.url).href,
    559: new URL("../../data/fonts/hafs-v2/p559.woff2", import.meta.url).href,
    56: new URL("../../data/fonts/hafs-v2/p56.woff2", import.meta.url).href,
    560: new URL("../../data/fonts/hafs-v2/p560.woff2", import.meta.url).href,
    561: new URL("../../data/fonts/hafs-v2/p561.woff2", import.meta.url).href,
    562: new URL("../../data/fonts/hafs-v2/p562.woff2", import.meta.url).href,
    563: new URL("../../data/fonts/hafs-v2/p563.woff2", import.meta.url).href,
    564: new URL("../../data/fonts/hafs-v2/p564.woff2", import.meta.url).href,
    565: new URL("../../data/fonts/hafs-v2/p565.woff2", import.meta.url).href,
    566: new URL("../../data/fonts/hafs-v2/p566.woff2", import.meta.url).href,
    567: new URL("../../data/fonts/hafs-v2/p567.woff2", import.meta.url).href,
    568: new URL("../../data/fonts/hafs-v2/p568.woff2", import.meta.url).href,
    569: new URL("../../data/fonts/hafs-v2/p569.woff2", import.meta.url).href,
    57: new URL("../../data/fonts/hafs-v2/p57.woff2", import.meta.url).href,
    570: new URL("../../data/fonts/hafs-v2/p570.woff2", import.meta.url).href,
    571: new URL("../../data/fonts/hafs-v2/p571.woff2", import.meta.url).href,
    572: new URL("../../data/fonts/hafs-v2/p572.woff2", import.meta.url).href,
    573: new URL("../../data/fonts/hafs-v2/p573.woff2", import.meta.url).href,
    574: new URL("../../data/fonts/hafs-v2/p574.woff2", import.meta.url).href,
    575: new URL("../../data/fonts/hafs-v2/p575.woff2", import.meta.url).href,
    576: new URL("../../data/fonts/hafs-v2/p576.woff2", import.meta.url).href,
    577: new URL("../../data/fonts/hafs-v2/p577.woff2", import.meta.url).href,
    578: new URL("../../data/fonts/hafs-v2/p578.woff2", import.meta.url).href,
    579: new URL("../../data/fonts/hafs-v2/p579.woff2", import.meta.url).href,
    58: new URL("../../data/fonts/hafs-v2/p58.woff2", import.meta.url).href,
    580: new URL("../../data/fonts/hafs-v2/p580.woff2", import.meta.url).href,
    581: new URL("../../data/fonts/hafs-v2/p581.woff2", import.meta.url).href,
    582: new URL("../../data/fonts/hafs-v2/p582.woff2", import.meta.url).href,
    583: new URL("../../data/fonts/hafs-v2/p583.woff2", import.meta.url).href,
    584: new URL("../../data/fonts/hafs-v2/p584.woff2", import.meta.url).href,
    585: new URL("../../data/fonts/hafs-v2/p585.woff2", import.meta.url).href,
    586: new URL("../../data/fonts/hafs-v2/p586.woff2", import.meta.url).href,
    587: new URL("../../data/fonts/hafs-v2/p587.woff2", import.meta.url).href,
    588: new URL("../../data/fonts/hafs-v2/p588.woff2", import.meta.url).href,
    589: new URL("../../data/fonts/hafs-v2/p589.woff2", import.meta.url).href,
    59: new URL("../../data/fonts/hafs-v2/p59.woff2", import.meta.url).href,
    590: new URL("../../data/fonts/hafs-v2/p590.woff2", import.meta.url).href,
    591: new URL("../../data/fonts/hafs-v2/p591.woff2", import.meta.url).href,
    592: new URL("../../data/fonts/hafs-v2/p592.woff2", import.meta.url).href,
    593: new URL("../../data/fonts/hafs-v2/p593.woff2", import.meta.url).href,
    594: new URL("../../data/fonts/hafs-v2/p594.woff2", import.meta.url).href,
    595: new URL("../../data/fonts/hafs-v2/p595.woff2", import.meta.url).href,
    596: new URL("../../data/fonts/hafs-v2/p596.woff2", import.meta.url).href,
    597: new URL("../../data/fonts/hafs-v2/p597.woff2", import.meta.url).href,
    598: new URL("../../data/fonts/hafs-v2/p598.woff2", import.meta.url).href,
    599: new URL("../../data/fonts/hafs-v2/p599.woff2", import.meta.url).href,
    6: new URL("../../data/fonts/hafs-v2/p6.woff2", import.meta.url).href,
    60: new URL("../../data/fonts/hafs-v2/p60.woff2", import.meta.url).href,
    600: new URL("../../data/fonts/hafs-v2/p600.woff2", import.meta.url).href,
    601: new URL("../../data/fonts/hafs-v2/p601.woff2", import.meta.url).href,
    602: new URL("../../data/fonts/hafs-v2/p602.woff2", import.meta.url).href,
    603: new URL("../../data/fonts/hafs-v2/p603.woff2", import.meta.url).href,
    604: new URL("../../data/fonts/hafs-v2/p604.woff2", import.meta.url).href,
    61: new URL("../../data/fonts/hafs-v2/p61.woff2", import.meta.url).href,
    62: new URL("../../data/fonts/hafs-v2/p62.woff2", import.meta.url).href,
    63: new URL("../../data/fonts/hafs-v2/p63.woff2", import.meta.url).href,
    64: new URL("../../data/fonts/hafs-v2/p64.woff2", import.meta.url).href,
    65: new URL("../../data/fonts/hafs-v2/p65.woff2", import.meta.url).href,
    66: new URL("../../data/fonts/hafs-v2/p66.woff2", import.meta.url).href,
    67: new URL("../../data/fonts/hafs-v2/p67.woff2", import.meta.url).href,
    68: new URL("../../data/fonts/hafs-v2/p68.woff2", import.meta.url).href,
    69: new URL("../../data/fonts/hafs-v2/p69.woff2", import.meta.url).href,
    7: new URL("../../data/fonts/hafs-v2/p7.woff2", import.meta.url).href,
    70: new URL("../../data/fonts/hafs-v2/p70.woff2", import.meta.url).href,
    71: new URL("../../data/fonts/hafs-v2/p71.woff2", import.meta.url).href,
    72: new URL("../../data/fonts/hafs-v2/p72.woff2", import.meta.url).href,
    73: new URL("../../data/fonts/hafs-v2/p73.woff2", import.meta.url).href,
    74: new URL("../../data/fonts/hafs-v2/p74.woff2", import.meta.url).href,
    75: new URL("../../data/fonts/hafs-v2/p75.woff2", import.meta.url).href,
    76: new URL("../../data/fonts/hafs-v2/p76.woff2", import.meta.url).href,
    77: new URL("../../data/fonts/hafs-v2/p77.woff2", import.meta.url).href,
    78: new URL("../../data/fonts/hafs-v2/p78.woff2", import.meta.url).href,
    79: new URL("../../data/fonts/hafs-v2/p79.woff2", import.meta.url).href,
    8: new URL("../../data/fonts/hafs-v2/p8.woff2", import.meta.url).href,
    80: new URL("../../data/fonts/hafs-v2/p80.woff2", import.meta.url).href,
    81: new URL("../../data/fonts/hafs-v2/p81.woff2", import.meta.url).href,
    82: new URL("../../data/fonts/hafs-v2/p82.woff2", import.meta.url).href,
    83: new URL("../../data/fonts/hafs-v2/p83.woff2", import.meta.url).href,
    84: new URL("../../data/fonts/hafs-v2/p84.woff2", import.meta.url).href,
    85: new URL("../../data/fonts/hafs-v2/p85.woff2", import.meta.url).href,
    86: new URL("../../data/fonts/hafs-v2/p86.woff2", import.meta.url).href,
    87: new URL("../../data/fonts/hafs-v2/p87.woff2", import.meta.url).href,
    88: new URL("../../data/fonts/hafs-v2/p88.woff2", import.meta.url).href,
    89: new URL("../../data/fonts/hafs-v2/p89.woff2", import.meta.url).href,
    9: new URL("../../data/fonts/hafs-v2/p9.woff2", import.meta.url).href,
    90: new URL("../../data/fonts/hafs-v2/p90.woff2", import.meta.url).href,
    91: new URL("../../data/fonts/hafs-v2/p91.woff2", import.meta.url).href,
    92: new URL("../../data/fonts/hafs-v2/p92.woff2", import.meta.url).href,
    93: new URL("../../data/fonts/hafs-v2/p93.woff2", import.meta.url).href,
    94: new URL("../../data/fonts/hafs-v2/p94.woff2", import.meta.url).href,
    95: new URL("../../data/fonts/hafs-v2/p95.woff2", import.meta.url).href,
    96: new URL("../../data/fonts/hafs-v2/p96.woff2", import.meta.url).href,
    97: new URL("../../data/fonts/hafs-v2/p97.woff2", import.meta.url).href,
    98: new URL("../../data/fonts/hafs-v2/p98.woff2", import.meta.url).href,
    99: new URL("../../data/fonts/hafs-v2/p99.woff2", import.meta.url).href
  },
  "hafs-v4": {
    1: new URL("../../data/fonts/hafs-v4/p1.woff2", import.meta.url).href,
    10: new URL("../../data/fonts/hafs-v4/p10.woff2", import.meta.url).href,
    100: new URL("../../data/fonts/hafs-v4/p100.woff2", import.meta.url).href,
    101: new URL("../../data/fonts/hafs-v4/p101.woff2", import.meta.url).href,
    102: new URL("../../data/fonts/hafs-v4/p102.woff2", import.meta.url).href,
    103: new URL("../../data/fonts/hafs-v4/p103.woff2", import.meta.url).href,
    104: new URL("../../data/fonts/hafs-v4/p104.woff2", import.meta.url).href,
    105: new URL("../../data/fonts/hafs-v4/p105.woff2", import.meta.url).href,
    106: new URL("../../data/fonts/hafs-v4/p106.woff2", import.meta.url).href,
    107: new URL("../../data/fonts/hafs-v4/p107.woff2", import.meta.url).href,
    108: new URL("../../data/fonts/hafs-v4/p108.woff2", import.meta.url).href,
    109: new URL("../../data/fonts/hafs-v4/p109.woff2", import.meta.url).href,
    11: new URL("../../data/fonts/hafs-v4/p11.woff2", import.meta.url).href,
    110: new URL("../../data/fonts/hafs-v4/p110.woff2", import.meta.url).href,
    111: new URL("../../data/fonts/hafs-v4/p111.woff2", import.meta.url).href,
    112: new URL("../../data/fonts/hafs-v4/p112.woff2", import.meta.url).href,
    113: new URL("../../data/fonts/hafs-v4/p113.woff2", import.meta.url).href,
    114: new URL("../../data/fonts/hafs-v4/p114.woff2", import.meta.url).href,
    115: new URL("../../data/fonts/hafs-v4/p115.woff2", import.meta.url).href,
    116: new URL("../../data/fonts/hafs-v4/p116.woff2", import.meta.url).href,
    117: new URL("../../data/fonts/hafs-v4/p117.woff2", import.meta.url).href,
    118: new URL("../../data/fonts/hafs-v4/p118.woff2", import.meta.url).href,
    119: new URL("../../data/fonts/hafs-v4/p119.woff2", import.meta.url).href,
    12: new URL("../../data/fonts/hafs-v4/p12.woff2", import.meta.url).href,
    120: new URL("../../data/fonts/hafs-v4/p120.woff2", import.meta.url).href,
    121: new URL("../../data/fonts/hafs-v4/p121.woff2", import.meta.url).href,
    122: new URL("../../data/fonts/hafs-v4/p122.woff2", import.meta.url).href,
    123: new URL("../../data/fonts/hafs-v4/p123.woff2", import.meta.url).href,
    124: new URL("../../data/fonts/hafs-v4/p124.woff2", import.meta.url).href,
    125: new URL("../../data/fonts/hafs-v4/p125.woff2", import.meta.url).href,
    126: new URL("../../data/fonts/hafs-v4/p126.woff2", import.meta.url).href,
    127: new URL("../../data/fonts/hafs-v4/p127.woff2", import.meta.url).href,
    128: new URL("../../data/fonts/hafs-v4/p128.woff2", import.meta.url).href,
    129: new URL("../../data/fonts/hafs-v4/p129.woff2", import.meta.url).href,
    13: new URL("../../data/fonts/hafs-v4/p13.woff2", import.meta.url).href,
    130: new URL("../../data/fonts/hafs-v4/p130.woff2", import.meta.url).href,
    131: new URL("../../data/fonts/hafs-v4/p131.woff2", import.meta.url).href,
    132: new URL("../../data/fonts/hafs-v4/p132.woff2", import.meta.url).href,
    133: new URL("../../data/fonts/hafs-v4/p133.woff2", import.meta.url).href,
    134: new URL("../../data/fonts/hafs-v4/p134.woff2", import.meta.url).href,
    135: new URL("../../data/fonts/hafs-v4/p135.woff2", import.meta.url).href,
    136: new URL("../../data/fonts/hafs-v4/p136.woff2", import.meta.url).href,
    137: new URL("../../data/fonts/hafs-v4/p137.woff2", import.meta.url).href,
    138: new URL("../../data/fonts/hafs-v4/p138.woff2", import.meta.url).href,
    139: new URL("../../data/fonts/hafs-v4/p139.woff2", import.meta.url).href,
    14: new URL("../../data/fonts/hafs-v4/p14.woff2", import.meta.url).href,
    140: new URL("../../data/fonts/hafs-v4/p140.woff2", import.meta.url).href,
    141: new URL("../../data/fonts/hafs-v4/p141.woff2", import.meta.url).href,
    142: new URL("../../data/fonts/hafs-v4/p142.woff2", import.meta.url).href,
    143: new URL("../../data/fonts/hafs-v4/p143.woff2", import.meta.url).href,
    144: new URL("../../data/fonts/hafs-v4/p144.woff2", import.meta.url).href,
    145: new URL("../../data/fonts/hafs-v4/p145.woff2", import.meta.url).href,
    146: new URL("../../data/fonts/hafs-v4/p146.woff2", import.meta.url).href,
    147: new URL("../../data/fonts/hafs-v4/p147.woff2", import.meta.url).href,
    148: new URL("../../data/fonts/hafs-v4/p148.woff2", import.meta.url).href,
    149: new URL("../../data/fonts/hafs-v4/p149.woff2", import.meta.url).href,
    15: new URL("../../data/fonts/hafs-v4/p15.woff2", import.meta.url).href,
    150: new URL("../../data/fonts/hafs-v4/p150.woff2", import.meta.url).href,
    151: new URL("../../data/fonts/hafs-v4/p151.woff2", import.meta.url).href,
    152: new URL("../../data/fonts/hafs-v4/p152.woff2", import.meta.url).href,
    153: new URL("../../data/fonts/hafs-v4/p153.woff2", import.meta.url).href,
    154: new URL("../../data/fonts/hafs-v4/p154.woff2", import.meta.url).href,
    155: new URL("../../data/fonts/hafs-v4/p155.woff2", import.meta.url).href,
    156: new URL("../../data/fonts/hafs-v4/p156.woff2", import.meta.url).href,
    157: new URL("../../data/fonts/hafs-v4/p157.woff2", import.meta.url).href,
    158: new URL("../../data/fonts/hafs-v4/p158.woff2", import.meta.url).href,
    159: new URL("../../data/fonts/hafs-v4/p159.woff2", import.meta.url).href,
    16: new URL("../../data/fonts/hafs-v4/p16.woff2", import.meta.url).href,
    160: new URL("../../data/fonts/hafs-v4/p160.woff2", import.meta.url).href,
    161: new URL("../../data/fonts/hafs-v4/p161.woff2", import.meta.url).href,
    162: new URL("../../data/fonts/hafs-v4/p162.woff2", import.meta.url).href,
    163: new URL("../../data/fonts/hafs-v4/p163.woff2", import.meta.url).href,
    164: new URL("../../data/fonts/hafs-v4/p164.woff2", import.meta.url).href,
    165: new URL("../../data/fonts/hafs-v4/p165.woff2", import.meta.url).href,
    166: new URL("../../data/fonts/hafs-v4/p166.woff2", import.meta.url).href,
    167: new URL("../../data/fonts/hafs-v4/p167.woff2", import.meta.url).href,
    168: new URL("../../data/fonts/hafs-v4/p168.woff2", import.meta.url).href,
    169: new URL("../../data/fonts/hafs-v4/p169.woff2", import.meta.url).href,
    17: new URL("../../data/fonts/hafs-v4/p17.woff2", import.meta.url).href,
    170: new URL("../../data/fonts/hafs-v4/p170.woff2", import.meta.url).href,
    171: new URL("../../data/fonts/hafs-v4/p171.woff2", import.meta.url).href,
    172: new URL("../../data/fonts/hafs-v4/p172.woff2", import.meta.url).href,
    173: new URL("../../data/fonts/hafs-v4/p173.woff2", import.meta.url).href,
    174: new URL("../../data/fonts/hafs-v4/p174.woff2", import.meta.url).href,
    175: new URL("../../data/fonts/hafs-v4/p175.woff2", import.meta.url).href,
    176: new URL("../../data/fonts/hafs-v4/p176.woff2", import.meta.url).href,
    177: new URL("../../data/fonts/hafs-v4/p177.woff2", import.meta.url).href,
    178: new URL("../../data/fonts/hafs-v4/p178.woff2", import.meta.url).href,
    179: new URL("../../data/fonts/hafs-v4/p179.woff2", import.meta.url).href,
    18: new URL("../../data/fonts/hafs-v4/p18.woff2", import.meta.url).href,
    180: new URL("../../data/fonts/hafs-v4/p180.woff2", import.meta.url).href,
    181: new URL("../../data/fonts/hafs-v4/p181.woff2", import.meta.url).href,
    182: new URL("../../data/fonts/hafs-v4/p182.woff2", import.meta.url).href,
    183: new URL("../../data/fonts/hafs-v4/p183.woff2", import.meta.url).href,
    184: new URL("../../data/fonts/hafs-v4/p184.woff2", import.meta.url).href,
    185: new URL("../../data/fonts/hafs-v4/p185.woff2", import.meta.url).href,
    186: new URL("../../data/fonts/hafs-v4/p186.woff2", import.meta.url).href,
    187: new URL("../../data/fonts/hafs-v4/p187.woff2", import.meta.url).href,
    188: new URL("../../data/fonts/hafs-v4/p188.woff2", import.meta.url).href,
    189: new URL("../../data/fonts/hafs-v4/p189.woff2", import.meta.url).href,
    19: new URL("../../data/fonts/hafs-v4/p19.woff2", import.meta.url).href,
    190: new URL("../../data/fonts/hafs-v4/p190.woff2", import.meta.url).href,
    191: new URL("../../data/fonts/hafs-v4/p191.woff2", import.meta.url).href,
    192: new URL("../../data/fonts/hafs-v4/p192.woff2", import.meta.url).href,
    193: new URL("../../data/fonts/hafs-v4/p193.woff2", import.meta.url).href,
    194: new URL("../../data/fonts/hafs-v4/p194.woff2", import.meta.url).href,
    195: new URL("../../data/fonts/hafs-v4/p195.woff2", import.meta.url).href,
    196: new URL("../../data/fonts/hafs-v4/p196.woff2", import.meta.url).href,
    197: new URL("../../data/fonts/hafs-v4/p197.woff2", import.meta.url).href,
    198: new URL("../../data/fonts/hafs-v4/p198.woff2", import.meta.url).href,
    199: new URL("../../data/fonts/hafs-v4/p199.woff2", import.meta.url).href,
    2: new URL("../../data/fonts/hafs-v4/p2.woff2", import.meta.url).href,
    20: new URL("../../data/fonts/hafs-v4/p20.woff2", import.meta.url).href,
    200: new URL("../../data/fonts/hafs-v4/p200.woff2", import.meta.url).href,
    201: new URL("../../data/fonts/hafs-v4/p201.woff2", import.meta.url).href,
    202: new URL("../../data/fonts/hafs-v4/p202.woff2", import.meta.url).href,
    203: new URL("../../data/fonts/hafs-v4/p203.woff2", import.meta.url).href,
    204: new URL("../../data/fonts/hafs-v4/p204.woff2", import.meta.url).href,
    205: new URL("../../data/fonts/hafs-v4/p205.woff2", import.meta.url).href,
    206: new URL("../../data/fonts/hafs-v4/p206.woff2", import.meta.url).href,
    207: new URL("../../data/fonts/hafs-v4/p207.woff2", import.meta.url).href,
    208: new URL("../../data/fonts/hafs-v4/p208.woff2", import.meta.url).href,
    209: new URL("../../data/fonts/hafs-v4/p209.woff2", import.meta.url).href,
    21: new URL("../../data/fonts/hafs-v4/p21.woff2", import.meta.url).href,
    210: new URL("../../data/fonts/hafs-v4/p210.woff2", import.meta.url).href,
    211: new URL("../../data/fonts/hafs-v4/p211.woff2", import.meta.url).href,
    212: new URL("../../data/fonts/hafs-v4/p212.woff2", import.meta.url).href,
    213: new URL("../../data/fonts/hafs-v4/p213.woff2", import.meta.url).href,
    214: new URL("../../data/fonts/hafs-v4/p214.woff2", import.meta.url).href,
    215: new URL("../../data/fonts/hafs-v4/p215.woff2", import.meta.url).href,
    216: new URL("../../data/fonts/hafs-v4/p216.woff2", import.meta.url).href,
    217: new URL("../../data/fonts/hafs-v4/p217.woff2", import.meta.url).href,
    218: new URL("../../data/fonts/hafs-v4/p218.woff2", import.meta.url).href,
    219: new URL("../../data/fonts/hafs-v4/p219.woff2", import.meta.url).href,
    22: new URL("../../data/fonts/hafs-v4/p22.woff2", import.meta.url).href,
    220: new URL("../../data/fonts/hafs-v4/p220.woff2", import.meta.url).href,
    221: new URL("../../data/fonts/hafs-v4/p221.woff2", import.meta.url).href,
    222: new URL("../../data/fonts/hafs-v4/p222.woff2", import.meta.url).href,
    223: new URL("../../data/fonts/hafs-v4/p223.woff2", import.meta.url).href,
    224: new URL("../../data/fonts/hafs-v4/p224.woff2", import.meta.url).href,
    225: new URL("../../data/fonts/hafs-v4/p225.woff2", import.meta.url).href,
    226: new URL("../../data/fonts/hafs-v4/p226.woff2", import.meta.url).href,
    227: new URL("../../data/fonts/hafs-v4/p227.woff2", import.meta.url).href,
    228: new URL("../../data/fonts/hafs-v4/p228.woff2", import.meta.url).href,
    229: new URL("../../data/fonts/hafs-v4/p229.woff2", import.meta.url).href,
    23: new URL("../../data/fonts/hafs-v4/p23.woff2", import.meta.url).href,
    230: new URL("../../data/fonts/hafs-v4/p230.woff2", import.meta.url).href,
    231: new URL("../../data/fonts/hafs-v4/p231.woff2", import.meta.url).href,
    232: new URL("../../data/fonts/hafs-v4/p232.woff2", import.meta.url).href,
    233: new URL("../../data/fonts/hafs-v4/p233.woff2", import.meta.url).href,
    234: new URL("../../data/fonts/hafs-v4/p234.woff2", import.meta.url).href,
    235: new URL("../../data/fonts/hafs-v4/p235.woff2", import.meta.url).href,
    236: new URL("../../data/fonts/hafs-v4/p236.woff2", import.meta.url).href,
    237: new URL("../../data/fonts/hafs-v4/p237.woff2", import.meta.url).href,
    238: new URL("../../data/fonts/hafs-v4/p238.woff2", import.meta.url).href,
    239: new URL("../../data/fonts/hafs-v4/p239.woff2", import.meta.url).href,
    24: new URL("../../data/fonts/hafs-v4/p24.woff2", import.meta.url).href,
    240: new URL("../../data/fonts/hafs-v4/p240.woff2", import.meta.url).href,
    241: new URL("../../data/fonts/hafs-v4/p241.woff2", import.meta.url).href,
    242: new URL("../../data/fonts/hafs-v4/p242.woff2", import.meta.url).href,
    243: new URL("../../data/fonts/hafs-v4/p243.woff2", import.meta.url).href,
    244: new URL("../../data/fonts/hafs-v4/p244.woff2", import.meta.url).href,
    245: new URL("../../data/fonts/hafs-v4/p245.woff2", import.meta.url).href,
    246: new URL("../../data/fonts/hafs-v4/p246.woff2", import.meta.url).href,
    247: new URL("../../data/fonts/hafs-v4/p247.woff2", import.meta.url).href,
    248: new URL("../../data/fonts/hafs-v4/p248.woff2", import.meta.url).href,
    249: new URL("../../data/fonts/hafs-v4/p249.woff2", import.meta.url).href,
    25: new URL("../../data/fonts/hafs-v4/p25.woff2", import.meta.url).href,
    250: new URL("../../data/fonts/hafs-v4/p250.woff2", import.meta.url).href,
    251: new URL("../../data/fonts/hafs-v4/p251.woff2", import.meta.url).href,
    252: new URL("../../data/fonts/hafs-v4/p252.woff2", import.meta.url).href,
    253: new URL("../../data/fonts/hafs-v4/p253.woff2", import.meta.url).href,
    254: new URL("../../data/fonts/hafs-v4/p254.woff2", import.meta.url).href,
    255: new URL("../../data/fonts/hafs-v4/p255.woff2", import.meta.url).href,
    256: new URL("../../data/fonts/hafs-v4/p256.woff2", import.meta.url).href,
    257: new URL("../../data/fonts/hafs-v4/p257.woff2", import.meta.url).href,
    258: new URL("../../data/fonts/hafs-v4/p258.woff2", import.meta.url).href,
    259: new URL("../../data/fonts/hafs-v4/p259.woff2", import.meta.url).href,
    26: new URL("../../data/fonts/hafs-v4/p26.woff2", import.meta.url).href,
    260: new URL("../../data/fonts/hafs-v4/p260.woff2", import.meta.url).href,
    261: new URL("../../data/fonts/hafs-v4/p261.woff2", import.meta.url).href,
    262: new URL("../../data/fonts/hafs-v4/p262.woff2", import.meta.url).href,
    263: new URL("../../data/fonts/hafs-v4/p263.woff2", import.meta.url).href,
    264: new URL("../../data/fonts/hafs-v4/p264.woff2", import.meta.url).href,
    265: new URL("../../data/fonts/hafs-v4/p265.woff2", import.meta.url).href,
    266: new URL("../../data/fonts/hafs-v4/p266.woff2", import.meta.url).href,
    267: new URL("../../data/fonts/hafs-v4/p267.woff2", import.meta.url).href,
    268: new URL("../../data/fonts/hafs-v4/p268.woff2", import.meta.url).href,
    269: new URL("../../data/fonts/hafs-v4/p269.woff2", import.meta.url).href,
    27: new URL("../../data/fonts/hafs-v4/p27.woff2", import.meta.url).href,
    270: new URL("../../data/fonts/hafs-v4/p270.woff2", import.meta.url).href,
    271: new URL("../../data/fonts/hafs-v4/p271.woff2", import.meta.url).href,
    272: new URL("../../data/fonts/hafs-v4/p272.woff2", import.meta.url).href,
    273: new URL("../../data/fonts/hafs-v4/p273.woff2", import.meta.url).href,
    274: new URL("../../data/fonts/hafs-v4/p274.woff2", import.meta.url).href,
    275: new URL("../../data/fonts/hafs-v4/p275.woff2", import.meta.url).href,
    276: new URL("../../data/fonts/hafs-v4/p276.woff2", import.meta.url).href,
    277: new URL("../../data/fonts/hafs-v4/p277.woff2", import.meta.url).href,
    278: new URL("../../data/fonts/hafs-v4/p278.woff2", import.meta.url).href,
    279: new URL("../../data/fonts/hafs-v4/p279.woff2", import.meta.url).href,
    28: new URL("../../data/fonts/hafs-v4/p28.woff2", import.meta.url).href,
    280: new URL("../../data/fonts/hafs-v4/p280.woff2", import.meta.url).href,
    281: new URL("../../data/fonts/hafs-v4/p281.woff2", import.meta.url).href,
    282: new URL("../../data/fonts/hafs-v4/p282.woff2", import.meta.url).href,
    283: new URL("../../data/fonts/hafs-v4/p283.woff2", import.meta.url).href,
    284: new URL("../../data/fonts/hafs-v4/p284.woff2", import.meta.url).href,
    285: new URL("../../data/fonts/hafs-v4/p285.woff2", import.meta.url).href,
    286: new URL("../../data/fonts/hafs-v4/p286.woff2", import.meta.url).href,
    287: new URL("../../data/fonts/hafs-v4/p287.woff2", import.meta.url).href,
    288: new URL("../../data/fonts/hafs-v4/p288.woff2", import.meta.url).href,
    289: new URL("../../data/fonts/hafs-v4/p289.woff2", import.meta.url).href,
    29: new URL("../../data/fonts/hafs-v4/p29.woff2", import.meta.url).href,
    290: new URL("../../data/fonts/hafs-v4/p290.woff2", import.meta.url).href,
    291: new URL("../../data/fonts/hafs-v4/p291.woff2", import.meta.url).href,
    292: new URL("../../data/fonts/hafs-v4/p292.woff2", import.meta.url).href,
    293: new URL("../../data/fonts/hafs-v4/p293.woff2", import.meta.url).href,
    294: new URL("../../data/fonts/hafs-v4/p294.woff2", import.meta.url).href,
    295: new URL("../../data/fonts/hafs-v4/p295.woff2", import.meta.url).href,
    296: new URL("../../data/fonts/hafs-v4/p296.woff2", import.meta.url).href,
    297: new URL("../../data/fonts/hafs-v4/p297.woff2", import.meta.url).href,
    298: new URL("../../data/fonts/hafs-v4/p298.woff2", import.meta.url).href,
    299: new URL("../../data/fonts/hafs-v4/p299.woff2", import.meta.url).href,
    3: new URL("../../data/fonts/hafs-v4/p3.woff2", import.meta.url).href,
    30: new URL("../../data/fonts/hafs-v4/p30.woff2", import.meta.url).href,
    300: new URL("../../data/fonts/hafs-v4/p300.woff2", import.meta.url).href,
    301: new URL("../../data/fonts/hafs-v4/p301.woff2", import.meta.url).href,
    302: new URL("../../data/fonts/hafs-v4/p302.woff2", import.meta.url).href,
    303: new URL("../../data/fonts/hafs-v4/p303.woff2", import.meta.url).href,
    304: new URL("../../data/fonts/hafs-v4/p304.woff2", import.meta.url).href,
    305: new URL("../../data/fonts/hafs-v4/p305.woff2", import.meta.url).href,
    306: new URL("../../data/fonts/hafs-v4/p306.woff2", import.meta.url).href,
    307: new URL("../../data/fonts/hafs-v4/p307.woff2", import.meta.url).href,
    308: new URL("../../data/fonts/hafs-v4/p308.woff2", import.meta.url).href,
    309: new URL("../../data/fonts/hafs-v4/p309.woff2", import.meta.url).href,
    31: new URL("../../data/fonts/hafs-v4/p31.woff2", import.meta.url).href,
    310: new URL("../../data/fonts/hafs-v4/p310.woff2", import.meta.url).href,
    311: new URL("../../data/fonts/hafs-v4/p311.woff2", import.meta.url).href,
    312: new URL("../../data/fonts/hafs-v4/p312.woff2", import.meta.url).href,
    313: new URL("../../data/fonts/hafs-v4/p313.woff2", import.meta.url).href,
    314: new URL("../../data/fonts/hafs-v4/p314.woff2", import.meta.url).href,
    315: new URL("../../data/fonts/hafs-v4/p315.woff2", import.meta.url).href,
    316: new URL("../../data/fonts/hafs-v4/p316.woff2", import.meta.url).href,
    317: new URL("../../data/fonts/hafs-v4/p317.woff2", import.meta.url).href,
    318: new URL("../../data/fonts/hafs-v4/p318.woff2", import.meta.url).href,
    319: new URL("../../data/fonts/hafs-v4/p319.woff2", import.meta.url).href,
    32: new URL("../../data/fonts/hafs-v4/p32.woff2", import.meta.url).href,
    320: new URL("../../data/fonts/hafs-v4/p320.woff2", import.meta.url).href,
    321: new URL("../../data/fonts/hafs-v4/p321.woff2", import.meta.url).href,
    322: new URL("../../data/fonts/hafs-v4/p322.woff2", import.meta.url).href,
    323: new URL("../../data/fonts/hafs-v4/p323.woff2", import.meta.url).href,
    324: new URL("../../data/fonts/hafs-v4/p324.woff2", import.meta.url).href,
    325: new URL("../../data/fonts/hafs-v4/p325.woff2", import.meta.url).href,
    326: new URL("../../data/fonts/hafs-v4/p326.woff2", import.meta.url).href,
    327: new URL("../../data/fonts/hafs-v4/p327.woff2", import.meta.url).href,
    328: new URL("../../data/fonts/hafs-v4/p328.woff2", import.meta.url).href,
    329: new URL("../../data/fonts/hafs-v4/p329.woff2", import.meta.url).href,
    33: new URL("../../data/fonts/hafs-v4/p33.woff2", import.meta.url).href,
    330: new URL("../../data/fonts/hafs-v4/p330.woff2", import.meta.url).href,
    331: new URL("../../data/fonts/hafs-v4/p331.woff2", import.meta.url).href,
    332: new URL("../../data/fonts/hafs-v4/p332.woff2", import.meta.url).href,
    333: new URL("../../data/fonts/hafs-v4/p333.woff2", import.meta.url).href,
    334: new URL("../../data/fonts/hafs-v4/p334.woff2", import.meta.url).href,
    335: new URL("../../data/fonts/hafs-v4/p335.woff2", import.meta.url).href,
    336: new URL("../../data/fonts/hafs-v4/p336.woff2", import.meta.url).href,
    337: new URL("../../data/fonts/hafs-v4/p337.woff2", import.meta.url).href,
    338: new URL("../../data/fonts/hafs-v4/p338.woff2", import.meta.url).href,
    339: new URL("../../data/fonts/hafs-v4/p339.woff2", import.meta.url).href,
    34: new URL("../../data/fonts/hafs-v4/p34.woff2", import.meta.url).href,
    340: new URL("../../data/fonts/hafs-v4/p340.woff2", import.meta.url).href,
    341: new URL("../../data/fonts/hafs-v4/p341.woff2", import.meta.url).href,
    342: new URL("../../data/fonts/hafs-v4/p342.woff2", import.meta.url).href,
    343: new URL("../../data/fonts/hafs-v4/p343.woff2", import.meta.url).href,
    344: new URL("../../data/fonts/hafs-v4/p344.woff2", import.meta.url).href,
    345: new URL("../../data/fonts/hafs-v4/p345.woff2", import.meta.url).href,
    346: new URL("../../data/fonts/hafs-v4/p346.woff2", import.meta.url).href,
    347: new URL("../../data/fonts/hafs-v4/p347.woff2", import.meta.url).href,
    348: new URL("../../data/fonts/hafs-v4/p348.woff2", import.meta.url).href,
    349: new URL("../../data/fonts/hafs-v4/p349.woff2", import.meta.url).href,
    35: new URL("../../data/fonts/hafs-v4/p35.woff2", import.meta.url).href,
    350: new URL("../../data/fonts/hafs-v4/p350.woff2", import.meta.url).href,
    351: new URL("../../data/fonts/hafs-v4/p351.woff2", import.meta.url).href,
    352: new URL("../../data/fonts/hafs-v4/p352.woff2", import.meta.url).href,
    353: new URL("../../data/fonts/hafs-v4/p353.woff2", import.meta.url).href,
    354: new URL("../../data/fonts/hafs-v4/p354.woff2", import.meta.url).href,
    355: new URL("../../data/fonts/hafs-v4/p355.woff2", import.meta.url).href,
    356: new URL("../../data/fonts/hafs-v4/p356.woff2", import.meta.url).href,
    357: new URL("../../data/fonts/hafs-v4/p357.woff2", import.meta.url).href,
    358: new URL("../../data/fonts/hafs-v4/p358.woff2", import.meta.url).href,
    359: new URL("../../data/fonts/hafs-v4/p359.woff2", import.meta.url).href,
    36: new URL("../../data/fonts/hafs-v4/p36.woff2", import.meta.url).href,
    360: new URL("../../data/fonts/hafs-v4/p360.woff2", import.meta.url).href,
    361: new URL("../../data/fonts/hafs-v4/p361.woff2", import.meta.url).href,
    362: new URL("../../data/fonts/hafs-v4/p362.woff2", import.meta.url).href,
    363: new URL("../../data/fonts/hafs-v4/p363.woff2", import.meta.url).href,
    364: new URL("../../data/fonts/hafs-v4/p364.woff2", import.meta.url).href,
    365: new URL("../../data/fonts/hafs-v4/p365.woff2", import.meta.url).href,
    366: new URL("../../data/fonts/hafs-v4/p366.woff2", import.meta.url).href,
    367: new URL("../../data/fonts/hafs-v4/p367.woff2", import.meta.url).href,
    368: new URL("../../data/fonts/hafs-v4/p368.woff2", import.meta.url).href,
    369: new URL("../../data/fonts/hafs-v4/p369.woff2", import.meta.url).href,
    37: new URL("../../data/fonts/hafs-v4/p37.woff2", import.meta.url).href,
    370: new URL("../../data/fonts/hafs-v4/p370.woff2", import.meta.url).href,
    371: new URL("../../data/fonts/hafs-v4/p371.woff2", import.meta.url).href,
    372: new URL("../../data/fonts/hafs-v4/p372.woff2", import.meta.url).href,
    373: new URL("../../data/fonts/hafs-v4/p373.woff2", import.meta.url).href,
    374: new URL("../../data/fonts/hafs-v4/p374.woff2", import.meta.url).href,
    375: new URL("../../data/fonts/hafs-v4/p375.woff2", import.meta.url).href,
    376: new URL("../../data/fonts/hafs-v4/p376.woff2", import.meta.url).href,
    377: new URL("../../data/fonts/hafs-v4/p377.woff2", import.meta.url).href,
    378: new URL("../../data/fonts/hafs-v4/p378.woff2", import.meta.url).href,
    379: new URL("../../data/fonts/hafs-v4/p379.woff2", import.meta.url).href,
    38: new URL("../../data/fonts/hafs-v4/p38.woff2", import.meta.url).href,
    380: new URL("../../data/fonts/hafs-v4/p380.woff2", import.meta.url).href,
    381: new URL("../../data/fonts/hafs-v4/p381.woff2", import.meta.url).href,
    382: new URL("../../data/fonts/hafs-v4/p382.woff2", import.meta.url).href,
    383: new URL("../../data/fonts/hafs-v4/p383.woff2", import.meta.url).href,
    384: new URL("../../data/fonts/hafs-v4/p384.woff2", import.meta.url).href,
    385: new URL("../../data/fonts/hafs-v4/p385.woff2", import.meta.url).href,
    386: new URL("../../data/fonts/hafs-v4/p386.woff2", import.meta.url).href,
    387: new URL("../../data/fonts/hafs-v4/p387.woff2", import.meta.url).href,
    388: new URL("../../data/fonts/hafs-v4/p388.woff2", import.meta.url).href,
    389: new URL("../../data/fonts/hafs-v4/p389.woff2", import.meta.url).href,
    39: new URL("../../data/fonts/hafs-v4/p39.woff2", import.meta.url).href,
    390: new URL("../../data/fonts/hafs-v4/p390.woff2", import.meta.url).href,
    391: new URL("../../data/fonts/hafs-v4/p391.woff2", import.meta.url).href,
    392: new URL("../../data/fonts/hafs-v4/p392.woff2", import.meta.url).href,
    393: new URL("../../data/fonts/hafs-v4/p393.woff2", import.meta.url).href,
    394: new URL("../../data/fonts/hafs-v4/p394.woff2", import.meta.url).href,
    395: new URL("../../data/fonts/hafs-v4/p395.woff2", import.meta.url).href,
    396: new URL("../../data/fonts/hafs-v4/p396.woff2", import.meta.url).href,
    397: new URL("../../data/fonts/hafs-v4/p397.woff2", import.meta.url).href,
    398: new URL("../../data/fonts/hafs-v4/p398.woff2", import.meta.url).href,
    399: new URL("../../data/fonts/hafs-v4/p399.woff2", import.meta.url).href,
    4: new URL("../../data/fonts/hafs-v4/p4.woff2", import.meta.url).href,
    40: new URL("../../data/fonts/hafs-v4/p40.woff2", import.meta.url).href,
    400: new URL("../../data/fonts/hafs-v4/p400.woff2", import.meta.url).href,
    401: new URL("../../data/fonts/hafs-v4/p401.woff2", import.meta.url).href,
    402: new URL("../../data/fonts/hafs-v4/p402.woff2", import.meta.url).href,
    403: new URL("../../data/fonts/hafs-v4/p403.woff2", import.meta.url).href,
    404: new URL("../../data/fonts/hafs-v4/p404.woff2", import.meta.url).href,
    405: new URL("../../data/fonts/hafs-v4/p405.woff2", import.meta.url).href,
    406: new URL("../../data/fonts/hafs-v4/p406.woff2", import.meta.url).href,
    407: new URL("../../data/fonts/hafs-v4/p407.woff2", import.meta.url).href,
    408: new URL("../../data/fonts/hafs-v4/p408.woff2", import.meta.url).href,
    409: new URL("../../data/fonts/hafs-v4/p409.woff2", import.meta.url).href,
    41: new URL("../../data/fonts/hafs-v4/p41.woff2", import.meta.url).href,
    410: new URL("../../data/fonts/hafs-v4/p410.woff2", import.meta.url).href,
    411: new URL("../../data/fonts/hafs-v4/p411.woff2", import.meta.url).href,
    412: new URL("../../data/fonts/hafs-v4/p412.woff2", import.meta.url).href,
    413: new URL("../../data/fonts/hafs-v4/p413.woff2", import.meta.url).href,
    414: new URL("../../data/fonts/hafs-v4/p414.woff2", import.meta.url).href,
    415: new URL("../../data/fonts/hafs-v4/p415.woff2", import.meta.url).href,
    416: new URL("../../data/fonts/hafs-v4/p416.woff2", import.meta.url).href,
    417: new URL("../../data/fonts/hafs-v4/p417.woff2", import.meta.url).href,
    418: new URL("../../data/fonts/hafs-v4/p418.woff2", import.meta.url).href,
    419: new URL("../../data/fonts/hafs-v4/p419.woff2", import.meta.url).href,
    42: new URL("../../data/fonts/hafs-v4/p42.woff2", import.meta.url).href,
    420: new URL("../../data/fonts/hafs-v4/p420.woff2", import.meta.url).href,
    421: new URL("../../data/fonts/hafs-v4/p421.woff2", import.meta.url).href,
    422: new URL("../../data/fonts/hafs-v4/p422.woff2", import.meta.url).href,
    423: new URL("../../data/fonts/hafs-v4/p423.woff2", import.meta.url).href,
    424: new URL("../../data/fonts/hafs-v4/p424.woff2", import.meta.url).href,
    425: new URL("../../data/fonts/hafs-v4/p425.woff2", import.meta.url).href,
    426: new URL("../../data/fonts/hafs-v4/p426.woff2", import.meta.url).href,
    427: new URL("../../data/fonts/hafs-v4/p427.woff2", import.meta.url).href,
    428: new URL("../../data/fonts/hafs-v4/p428.woff2", import.meta.url).href,
    429: new URL("../../data/fonts/hafs-v4/p429.woff2", import.meta.url).href,
    43: new URL("../../data/fonts/hafs-v4/p43.woff2", import.meta.url).href,
    430: new URL("../../data/fonts/hafs-v4/p430.woff2", import.meta.url).href,
    431: new URL("../../data/fonts/hafs-v4/p431.woff2", import.meta.url).href,
    432: new URL("../../data/fonts/hafs-v4/p432.woff2", import.meta.url).href,
    433: new URL("../../data/fonts/hafs-v4/p433.woff2", import.meta.url).href,
    434: new URL("../../data/fonts/hafs-v4/p434.woff2", import.meta.url).href,
    435: new URL("../../data/fonts/hafs-v4/p435.woff2", import.meta.url).href,
    436: new URL("../../data/fonts/hafs-v4/p436.woff2", import.meta.url).href,
    437: new URL("../../data/fonts/hafs-v4/p437.woff2", import.meta.url).href,
    438: new URL("../../data/fonts/hafs-v4/p438.woff2", import.meta.url).href,
    439: new URL("../../data/fonts/hafs-v4/p439.woff2", import.meta.url).href,
    44: new URL("../../data/fonts/hafs-v4/p44.woff2", import.meta.url).href,
    440: new URL("../../data/fonts/hafs-v4/p440.woff2", import.meta.url).href,
    441: new URL("../../data/fonts/hafs-v4/p441.woff2", import.meta.url).href,
    442: new URL("../../data/fonts/hafs-v4/p442.woff2", import.meta.url).href,
    443: new URL("../../data/fonts/hafs-v4/p443.woff2", import.meta.url).href,
    444: new URL("../../data/fonts/hafs-v4/p444.woff2", import.meta.url).href,
    445: new URL("../../data/fonts/hafs-v4/p445.woff2", import.meta.url).href,
    446: new URL("../../data/fonts/hafs-v4/p446.woff2", import.meta.url).href,
    447: new URL("../../data/fonts/hafs-v4/p447.woff2", import.meta.url).href,
    448: new URL("../../data/fonts/hafs-v4/p448.woff2", import.meta.url).href,
    449: new URL("../../data/fonts/hafs-v4/p449.woff2", import.meta.url).href,
    45: new URL("../../data/fonts/hafs-v4/p45.woff2", import.meta.url).href,
    450: new URL("../../data/fonts/hafs-v4/p450.woff2", import.meta.url).href,
    451: new URL("../../data/fonts/hafs-v4/p451.woff2", import.meta.url).href,
    452: new URL("../../data/fonts/hafs-v4/p452.woff2", import.meta.url).href,
    453: new URL("../../data/fonts/hafs-v4/p453.woff2", import.meta.url).href,
    454: new URL("../../data/fonts/hafs-v4/p454.woff2", import.meta.url).href,
    455: new URL("../../data/fonts/hafs-v4/p455.woff2", import.meta.url).href,
    456: new URL("../../data/fonts/hafs-v4/p456.woff2", import.meta.url).href,
    457: new URL("../../data/fonts/hafs-v4/p457.woff2", import.meta.url).href,
    458: new URL("../../data/fonts/hafs-v4/p458.woff2", import.meta.url).href,
    459: new URL("../../data/fonts/hafs-v4/p459.woff2", import.meta.url).href,
    46: new URL("../../data/fonts/hafs-v4/p46.woff2", import.meta.url).href,
    460: new URL("../../data/fonts/hafs-v4/p460.woff2", import.meta.url).href,
    461: new URL("../../data/fonts/hafs-v4/p461.woff2", import.meta.url).href,
    462: new URL("../../data/fonts/hafs-v4/p462.woff2", import.meta.url).href,
    463: new URL("../../data/fonts/hafs-v4/p463.woff2", import.meta.url).href,
    464: new URL("../../data/fonts/hafs-v4/p464.woff2", import.meta.url).href,
    465: new URL("../../data/fonts/hafs-v4/p465.woff2", import.meta.url).href,
    466: new URL("../../data/fonts/hafs-v4/p466.woff2", import.meta.url).href,
    467: new URL("../../data/fonts/hafs-v4/p467.woff2", import.meta.url).href,
    468: new URL("../../data/fonts/hafs-v4/p468.woff2", import.meta.url).href,
    469: new URL("../../data/fonts/hafs-v4/p469.woff2", import.meta.url).href,
    47: new URL("../../data/fonts/hafs-v4/p47.woff2", import.meta.url).href,
    470: new URL("../../data/fonts/hafs-v4/p470.woff2", import.meta.url).href,
    471: new URL("../../data/fonts/hafs-v4/p471.woff2", import.meta.url).href,
    472: new URL("../../data/fonts/hafs-v4/p472.woff2", import.meta.url).href,
    473: new URL("../../data/fonts/hafs-v4/p473.woff2", import.meta.url).href,
    474: new URL("../../data/fonts/hafs-v4/p474.woff2", import.meta.url).href,
    475: new URL("../../data/fonts/hafs-v4/p475.woff2", import.meta.url).href,
    476: new URL("../../data/fonts/hafs-v4/p476.woff2", import.meta.url).href,
    477: new URL("../../data/fonts/hafs-v4/p477.woff2", import.meta.url).href,
    478: new URL("../../data/fonts/hafs-v4/p478.woff2", import.meta.url).href,
    479: new URL("../../data/fonts/hafs-v4/p479.woff2", import.meta.url).href,
    48: new URL("../../data/fonts/hafs-v4/p48.woff2", import.meta.url).href,
    480: new URL("../../data/fonts/hafs-v4/p480.woff2", import.meta.url).href,
    481: new URL("../../data/fonts/hafs-v4/p481.woff2", import.meta.url).href,
    482: new URL("../../data/fonts/hafs-v4/p482.woff2", import.meta.url).href,
    483: new URL("../../data/fonts/hafs-v4/p483.woff2", import.meta.url).href,
    484: new URL("../../data/fonts/hafs-v4/p484.woff2", import.meta.url).href,
    485: new URL("../../data/fonts/hafs-v4/p485.woff2", import.meta.url).href,
    486: new URL("../../data/fonts/hafs-v4/p486.woff2", import.meta.url).href,
    487: new URL("../../data/fonts/hafs-v4/p487.woff2", import.meta.url).href,
    488: new URL("../../data/fonts/hafs-v4/p488.woff2", import.meta.url).href,
    489: new URL("../../data/fonts/hafs-v4/p489.woff2", import.meta.url).href,
    49: new URL("../../data/fonts/hafs-v4/p49.woff2", import.meta.url).href,
    490: new URL("../../data/fonts/hafs-v4/p490.woff2", import.meta.url).href,
    491: new URL("../../data/fonts/hafs-v4/p491.woff2", import.meta.url).href,
    492: new URL("../../data/fonts/hafs-v4/p492.woff2", import.meta.url).href,
    493: new URL("../../data/fonts/hafs-v4/p493.woff2", import.meta.url).href,
    494: new URL("../../data/fonts/hafs-v4/p494.woff2", import.meta.url).href,
    495: new URL("../../data/fonts/hafs-v4/p495.woff2", import.meta.url).href,
    496: new URL("../../data/fonts/hafs-v4/p496.woff2", import.meta.url).href,
    497: new URL("../../data/fonts/hafs-v4/p497.woff2", import.meta.url).href,
    498: new URL("../../data/fonts/hafs-v4/p498.woff2", import.meta.url).href,
    499: new URL("../../data/fonts/hafs-v4/p499.woff2", import.meta.url).href,
    5: new URL("../../data/fonts/hafs-v4/p5.woff2", import.meta.url).href,
    50: new URL("../../data/fonts/hafs-v4/p50.woff2", import.meta.url).href,
    500: new URL("../../data/fonts/hafs-v4/p500.woff2", import.meta.url).href,
    501: new URL("../../data/fonts/hafs-v4/p501.woff2", import.meta.url).href,
    502: new URL("../../data/fonts/hafs-v4/p502.woff2", import.meta.url).href,
    503: new URL("../../data/fonts/hafs-v4/p503.woff2", import.meta.url).href,
    504: new URL("../../data/fonts/hafs-v4/p504.woff2", import.meta.url).href,
    505: new URL("../../data/fonts/hafs-v4/p505.woff2", import.meta.url).href,
    506: new URL("../../data/fonts/hafs-v4/p506.woff2", import.meta.url).href,
    507: new URL("../../data/fonts/hafs-v4/p507.woff2", import.meta.url).href,
    508: new URL("../../data/fonts/hafs-v4/p508.woff2", import.meta.url).href,
    509: new URL("../../data/fonts/hafs-v4/p509.woff2", import.meta.url).href,
    51: new URL("../../data/fonts/hafs-v4/p51.woff2", import.meta.url).href,
    510: new URL("../../data/fonts/hafs-v4/p510.woff2", import.meta.url).href,
    511: new URL("../../data/fonts/hafs-v4/p511.woff2", import.meta.url).href,
    512: new URL("../../data/fonts/hafs-v4/p512.woff2", import.meta.url).href,
    513: new URL("../../data/fonts/hafs-v4/p513.woff2", import.meta.url).href,
    514: new URL("../../data/fonts/hafs-v4/p514.woff2", import.meta.url).href,
    515: new URL("../../data/fonts/hafs-v4/p515.woff2", import.meta.url).href,
    516: new URL("../../data/fonts/hafs-v4/p516.woff2", import.meta.url).href,
    517: new URL("../../data/fonts/hafs-v4/p517.woff2", import.meta.url).href,
    518: new URL("../../data/fonts/hafs-v4/p518.woff2", import.meta.url).href,
    519: new URL("../../data/fonts/hafs-v4/p519.woff2", import.meta.url).href,
    52: new URL("../../data/fonts/hafs-v4/p52.woff2", import.meta.url).href,
    520: new URL("../../data/fonts/hafs-v4/p520.woff2", import.meta.url).href,
    521: new URL("../../data/fonts/hafs-v4/p521.woff2", import.meta.url).href,
    522: new URL("../../data/fonts/hafs-v4/p522.woff2", import.meta.url).href,
    523: new URL("../../data/fonts/hafs-v4/p523.woff2", import.meta.url).href,
    524: new URL("../../data/fonts/hafs-v4/p524.woff2", import.meta.url).href,
    525: new URL("../../data/fonts/hafs-v4/p525.woff2", import.meta.url).href,
    526: new URL("../../data/fonts/hafs-v4/p526.woff2", import.meta.url).href,
    527: new URL("../../data/fonts/hafs-v4/p527.woff2", import.meta.url).href,
    528: new URL("../../data/fonts/hafs-v4/p528.woff2", import.meta.url).href,
    529: new URL("../../data/fonts/hafs-v4/p529.woff2", import.meta.url).href,
    53: new URL("../../data/fonts/hafs-v4/p53.woff2", import.meta.url).href,
    530: new URL("../../data/fonts/hafs-v4/p530.woff2", import.meta.url).href,
    531: new URL("../../data/fonts/hafs-v4/p531.woff2", import.meta.url).href,
    532: new URL("../../data/fonts/hafs-v4/p532.woff2", import.meta.url).href,
    533: new URL("../../data/fonts/hafs-v4/p533.woff2", import.meta.url).href,
    534: new URL("../../data/fonts/hafs-v4/p534.woff2", import.meta.url).href,
    535: new URL("../../data/fonts/hafs-v4/p535.woff2", import.meta.url).href,
    536: new URL("../../data/fonts/hafs-v4/p536.woff2", import.meta.url).href,
    537: new URL("../../data/fonts/hafs-v4/p537.woff2", import.meta.url).href,
    538: new URL("../../data/fonts/hafs-v4/p538.woff2", import.meta.url).href,
    539: new URL("../../data/fonts/hafs-v4/p539.woff2", import.meta.url).href,
    54: new URL("../../data/fonts/hafs-v4/p54.woff2", import.meta.url).href,
    540: new URL("../../data/fonts/hafs-v4/p540.woff2", import.meta.url).href,
    541: new URL("../../data/fonts/hafs-v4/p541.woff2", import.meta.url).href,
    542: new URL("../../data/fonts/hafs-v4/p542.woff2", import.meta.url).href,
    543: new URL("../../data/fonts/hafs-v4/p543.woff2", import.meta.url).href,
    544: new URL("../../data/fonts/hafs-v4/p544.woff2", import.meta.url).href,
    545: new URL("../../data/fonts/hafs-v4/p545.woff2", import.meta.url).href,
    546: new URL("../../data/fonts/hafs-v4/p546.woff2", import.meta.url).href,
    547: new URL("../../data/fonts/hafs-v4/p547.woff2", import.meta.url).href,
    548: new URL("../../data/fonts/hafs-v4/p548.woff2", import.meta.url).href,
    549: new URL("../../data/fonts/hafs-v4/p549.woff2", import.meta.url).href,
    55: new URL("../../data/fonts/hafs-v4/p55.woff2", import.meta.url).href,
    550: new URL("../../data/fonts/hafs-v4/p550.woff2", import.meta.url).href,
    551: new URL("../../data/fonts/hafs-v4/p551.woff2", import.meta.url).href,
    552: new URL("../../data/fonts/hafs-v4/p552.woff2", import.meta.url).href,
    553: new URL("../../data/fonts/hafs-v4/p553.woff2", import.meta.url).href,
    554: new URL("../../data/fonts/hafs-v4/p554.woff2", import.meta.url).href,
    555: new URL("../../data/fonts/hafs-v4/p555.woff2", import.meta.url).href,
    556: new URL("../../data/fonts/hafs-v4/p556.woff2", import.meta.url).href,
    557: new URL("../../data/fonts/hafs-v4/p557.woff2", import.meta.url).href,
    558: new URL("../../data/fonts/hafs-v4/p558.woff2", import.meta.url).href,
    559: new URL("../../data/fonts/hafs-v4/p559.woff2", import.meta.url).href,
    56: new URL("../../data/fonts/hafs-v4/p56.woff2", import.meta.url).href,
    560: new URL("../../data/fonts/hafs-v4/p560.woff2", import.meta.url).href,
    561: new URL("../../data/fonts/hafs-v4/p561.woff2", import.meta.url).href,
    562: new URL("../../data/fonts/hafs-v4/p562.woff2", import.meta.url).href,
    563: new URL("../../data/fonts/hafs-v4/p563.woff2", import.meta.url).href,
    564: new URL("../../data/fonts/hafs-v4/p564.woff2", import.meta.url).href,
    565: new URL("../../data/fonts/hafs-v4/p565.woff2", import.meta.url).href,
    566: new URL("../../data/fonts/hafs-v4/p566.woff2", import.meta.url).href,
    567: new URL("../../data/fonts/hafs-v4/p567.woff2", import.meta.url).href,
    568: new URL("../../data/fonts/hafs-v4/p568.woff2", import.meta.url).href,
    569: new URL("../../data/fonts/hafs-v4/p569.woff2", import.meta.url).href,
    57: new URL("../../data/fonts/hafs-v4/p57.woff2", import.meta.url).href,
    570: new URL("../../data/fonts/hafs-v4/p570.woff2", import.meta.url).href,
    571: new URL("../../data/fonts/hafs-v4/p571.woff2", import.meta.url).href,
    572: new URL("../../data/fonts/hafs-v4/p572.woff2", import.meta.url).href,
    573: new URL("../../data/fonts/hafs-v4/p573.woff2", import.meta.url).href,
    574: new URL("../../data/fonts/hafs-v4/p574.woff2", import.meta.url).href,
    575: new URL("../../data/fonts/hafs-v4/p575.woff2", import.meta.url).href,
    576: new URL("../../data/fonts/hafs-v4/p576.woff2", import.meta.url).href,
    577: new URL("../../data/fonts/hafs-v4/p577.woff2", import.meta.url).href,
    578: new URL("../../data/fonts/hafs-v4/p578.woff2", import.meta.url).href,
    579: new URL("../../data/fonts/hafs-v4/p579.woff2", import.meta.url).href,
    58: new URL("../../data/fonts/hafs-v4/p58.woff2", import.meta.url).href,
    580: new URL("../../data/fonts/hafs-v4/p580.woff2", import.meta.url).href,
    581: new URL("../../data/fonts/hafs-v4/p581.woff2", import.meta.url).href,
    582: new URL("../../data/fonts/hafs-v4/p582.woff2", import.meta.url).href,
    583: new URL("../../data/fonts/hafs-v4/p583.woff2", import.meta.url).href,
    584: new URL("../../data/fonts/hafs-v4/p584.woff2", import.meta.url).href,
    585: new URL("../../data/fonts/hafs-v4/p585.woff2", import.meta.url).href,
    586: new URL("../../data/fonts/hafs-v4/p586.woff2", import.meta.url).href,
    587: new URL("../../data/fonts/hafs-v4/p587.woff2", import.meta.url).href,
    588: new URL("../../data/fonts/hafs-v4/p588.woff2", import.meta.url).href,
    589: new URL("../../data/fonts/hafs-v4/p589.woff2", import.meta.url).href,
    59: new URL("../../data/fonts/hafs-v4/p59.woff2", import.meta.url).href,
    590: new URL("../../data/fonts/hafs-v4/p590.woff2", import.meta.url).href,
    591: new URL("../../data/fonts/hafs-v4/p591.woff2", import.meta.url).href,
    592: new URL("../../data/fonts/hafs-v4/p592.woff2", import.meta.url).href,
    593: new URL("../../data/fonts/hafs-v4/p593.woff2", import.meta.url).href,
    594: new URL("../../data/fonts/hafs-v4/p594.woff2", import.meta.url).href,
    595: new URL("../../data/fonts/hafs-v4/p595.woff2", import.meta.url).href,
    596: new URL("../../data/fonts/hafs-v4/p596.woff2", import.meta.url).href,
    597: new URL("../../data/fonts/hafs-v4/p597.woff2", import.meta.url).href,
    598: new URL("../../data/fonts/hafs-v4/p598.woff2", import.meta.url).href,
    599: new URL("../../data/fonts/hafs-v4/p599.woff2", import.meta.url).href,
    6: new URL("../../data/fonts/hafs-v4/p6.woff2", import.meta.url).href,
    60: new URL("../../data/fonts/hafs-v4/p60.woff2", import.meta.url).href,
    600: new URL("../../data/fonts/hafs-v4/p600.woff2", import.meta.url).href,
    601: new URL("../../data/fonts/hafs-v4/p601.woff2", import.meta.url).href,
    602: new URL("../../data/fonts/hafs-v4/p602.woff2", import.meta.url).href,
    603: new URL("../../data/fonts/hafs-v4/p603.woff2", import.meta.url).href,
    604: new URL("../../data/fonts/hafs-v4/p604.woff2", import.meta.url).href,
    61: new URL("../../data/fonts/hafs-v4/p61.woff2", import.meta.url).href,
    62: new URL("../../data/fonts/hafs-v4/p62.woff2", import.meta.url).href,
    63: new URL("../../data/fonts/hafs-v4/p63.woff2", import.meta.url).href,
    64: new URL("../../data/fonts/hafs-v4/p64.woff2", import.meta.url).href,
    65: new URL("../../data/fonts/hafs-v4/p65.woff2", import.meta.url).href,
    66: new URL("../../data/fonts/hafs-v4/p66.woff2", import.meta.url).href,
    67: new URL("../../data/fonts/hafs-v4/p67.woff2", import.meta.url).href,
    68: new URL("../../data/fonts/hafs-v4/p68.woff2", import.meta.url).href,
    69: new URL("../../data/fonts/hafs-v4/p69.woff2", import.meta.url).href,
    7: new URL("../../data/fonts/hafs-v4/p7.woff2", import.meta.url).href,
    70: new URL("../../data/fonts/hafs-v4/p70.woff2", import.meta.url).href,
    71: new URL("../../data/fonts/hafs-v4/p71.woff2", import.meta.url).href,
    72: new URL("../../data/fonts/hafs-v4/p72.woff2", import.meta.url).href,
    73: new URL("../../data/fonts/hafs-v4/p73.woff2", import.meta.url).href,
    74: new URL("../../data/fonts/hafs-v4/p74.woff2", import.meta.url).href,
    75: new URL("../../data/fonts/hafs-v4/p75.woff2", import.meta.url).href,
    76: new URL("../../data/fonts/hafs-v4/p76.woff2", import.meta.url).href,
    77: new URL("../../data/fonts/hafs-v4/p77.woff2", import.meta.url).href,
    78: new URL("../../data/fonts/hafs-v4/p78.woff2", import.meta.url).href,
    79: new URL("../../data/fonts/hafs-v4/p79.woff2", import.meta.url).href,
    8: new URL("../../data/fonts/hafs-v4/p8.woff2", import.meta.url).href,
    80: new URL("../../data/fonts/hafs-v4/p80.woff2", import.meta.url).href,
    81: new URL("../../data/fonts/hafs-v4/p81.woff2", import.meta.url).href,
    82: new URL("../../data/fonts/hafs-v4/p82.woff2", import.meta.url).href,
    83: new URL("../../data/fonts/hafs-v4/p83.woff2", import.meta.url).href,
    84: new URL("../../data/fonts/hafs-v4/p84.woff2", import.meta.url).href,
    85: new URL("../../data/fonts/hafs-v4/p85.woff2", import.meta.url).href,
    86: new URL("../../data/fonts/hafs-v4/p86.woff2", import.meta.url).href,
    87: new URL("../../data/fonts/hafs-v4/p87.woff2", import.meta.url).href,
    88: new URL("../../data/fonts/hafs-v4/p88.woff2", import.meta.url).href,
    89: new URL("../../data/fonts/hafs-v4/p89.woff2", import.meta.url).href,
    9: new URL("../../data/fonts/hafs-v4/p9.woff2", import.meta.url).href,
    90: new URL("../../data/fonts/hafs-v4/p90.woff2", import.meta.url).href,
    91: new URL("../../data/fonts/hafs-v4/p91.woff2", import.meta.url).href,
    92: new URL("../../data/fonts/hafs-v4/p92.woff2", import.meta.url).href,
    93: new URL("../../data/fonts/hafs-v4/p93.woff2", import.meta.url).href,
    94: new URL("../../data/fonts/hafs-v4/p94.woff2", import.meta.url).href,
    95: new URL("../../data/fonts/hafs-v4/p95.woff2", import.meta.url).href,
    96: new URL("../../data/fonts/hafs-v4/p96.woff2", import.meta.url).href,
    97: new URL("../../data/fonts/hafs-v4/p97.woff2", import.meta.url).href,
    98: new URL("../../data/fonts/hafs-v4/p98.woff2", import.meta.url).href,
    99: new URL("../../data/fonts/hafs-v4/p99.woff2", import.meta.url).href
  },
  "hafs-unicode": {
    ayatquran: new URL(
      "../../data/fonts/hafs-unicode/AyatQuran2-PVKGm.ttf",
      import.meta.url
    ).href,
    digitalkhatt: new URL(
      "../../data/fonts/hafs-unicode/digitalkhatt.otf",
      import.meta.url
    ).href
  }
};
function getFontUrl(layout, page) {
  const pageStr = String(page);
  const url = staticFonts[layout]?.[pageStr];
  if (!url) throw new Error(`Font not found: ${layout}/${page}`);
  return url;
}
function getUnicodeFontUrl(type) {
  const url = staticFonts["hafs-unicode"]?.[type];
  if (!url) throw new Error(`Unicode font not found: ${type}`);
  return url;
}

// src/core/font-loader.ts
init_data();
var surahNameFontLoaded = false;
var digitalKhattFontLoaded = false;
var ayatMarkerFontLoaded = false;
function surahNumberToFontCode(surahNumber) {
  return `surah${String(surahNumber).padStart(3, "0")}`;
}
async function getSurahNameFontUrl2() {
  return getSurahNameFontUrl();
}
async function loadSurahNameFont() {
  if (surahNameFontLoaded) return;
  const fontUrl = await getSurahNameFontUrl2();
  const fontFace = new FontFace("SurahNameFont", `url(${fontUrl})`);
  await fontFace.load();
  if (typeof document !== "undefined" && document.fonts) {
    document.fonts.add(fontFace);
  } else if (globalThis.fonts) {
    globalThis.fonts.add(fontFace);
  }
  surahNameFontLoaded = true;
}
async function loadDigitalKhattFont() {
  if (digitalKhattFontLoaded) return;
  const fontUrl = getUnicodeFontUrl("digitalkhatt");
  const response = await fetch(fontUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to load DigitalKhatt font from ${fontUrl}: ${response.status} ${response.statusText}`
    );
  }
  const buffer = await response.arrayBuffer();
  const fontFace = new FontFace("DigitalKhatt", buffer);
  await fontFace.load();
  if (typeof document !== "undefined" && document.fonts) {
    document.fonts.add(fontFace);
  } else if (globalThis.fonts) {
    globalThis.fonts.add(fontFace);
  }
  digitalKhattFontLoaded = true;
}
async function loadAyatMarkerFont() {
  if (ayatMarkerFontLoaded) return;
  const fontUrl = getUnicodeFontUrl("ayatquran");
  const response = await fetch(fontUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to load AyatMarker font from ${fontUrl}: ${response.status} ${response.statusText}`
    );
  }
  const buffer = await response.arrayBuffer();
  const fontFace = new FontFace("AyatMarker", buffer);
  await fontFace.load();
  if (typeof document !== "undefined" && document.fonts) {
    document.fonts.add(fontFace);
  } else if (globalThis.fonts) {
    globalThis.fonts.add(fontFace);
  }
  ayatMarkerFontLoaded = true;
}
function getFontUrl2(layout, page) {
  return getFontUrl(layout, page);
}
async function loadFont(layout, page) {
  if (layout === "hafs-unicode") {
    await loadDigitalKhattFont();
    await loadAyatMarkerFont();
    return;
  }
  const fontUrl = getFontUrl2(layout, page);
  const fontFace = new FontFace("QuranFont", `url(${fontUrl})`);
  await fontFace.load();
  if (typeof document !== "undefined" && document.fonts) {
    document.fonts.add(fontFace);
  } else if (globalThis.fonts) {
    globalThis.fonts.add(fontFace);
  }
}
async function loadBismillahFont(layout) {
  if (layout === "hafs-unicode") return;
  const fontUrl = getFontUrl2(layout, 1);
  const fontFace = new FontFace("BismillahFont", `url(${fontUrl})`);
  await fontFace.load();
  if (typeof document !== "undefined" && document.fonts) {
    document.fonts.add(fontFace);
  } else if (globalThis.fonts) {
    globalThis.fonts.add(fontFace);
  }
}

// src/core/index.ts
init_data();

// src/core/layout-calculator.ts
var NAV_BAR_MIN_HEIGHT = 80;
var HEADER_LINE_HEIGHT_MULTIPLIER = 1.8;
function createLayoutCalculator(options) {
  const pageWidth = options.pageWidth;
  const pageHeight = options.pageHeight;
  const paddingTop = pageHeight * 0.05;
  const paddingBottom = Math.max(pageHeight * 0.05, NAV_BAR_MIN_HEIGHT);
  const paddingLeft = pageWidth * 0.08;
  const paddingRight = pageWidth * 0.08;
  const availableHeight = Math.max(0, pageHeight - paddingTop - paddingBottom);
  const computedLineHeight = availableHeight / 15;
  const lineHeight = options.lineHeight || computedLineHeight;
  const fontSizeFromHeight = lineHeight / 1.5;
  const availableWidth = pageWidth - paddingLeft - paddingRight;
  const avgCharsPerLine = 80;
  const fontSizeFromWidth = availableWidth / (avgCharsPerLine * 0.5);
  const fontSize = options.fontSize || Math.min(fontSizeFromHeight, fontSizeFromWidth);
  const metrics = {
    lineHeight,
    baselineOffset: Math.round(lineHeight / 2),
    pagePadding: {
      top: Math.round(paddingTop),
      bottom: Math.round(paddingBottom),
      left: Math.round(paddingLeft),
      right: Math.round(paddingRight)
    }
  };
  function calculateLineLayout(line, y, lineHeightForLine) {
    const words = [];
    let currentX = metrics.pagePadding.left;
    for (const word of line.words) {
      const textWidth = word.text.length * (fontSize * 0.5);
      const wordLayout = {
        ...word,
        x: currentX,
        y,
        width: textWidth,
        height: fontSize
      };
      words.push(wordLayout);
      currentX += textWidth + 8;
    }
    const isCentered = line.isCentered ?? false;
    return {
      lineNumber: line.lineNumber,
      y,
      height: lineHeightForLine,
      words,
      isCentered,
      lineType: line.lineType || "text",
      surahNumber: line.lineType === "header" ? line.metadata?.chapterId : void 0
    };
  }
  function calculatePageLayout(page) {
    const lines = [];
    let contentHeight = 0;
    const lineHeights = [];
    for (let i = 0; i < page.lines.length; i++) {
      const line = page.lines[i];
      let height = metrics.lineHeight;
      if (line.lineType === "header") {
        height = metrics.lineHeight * HEADER_LINE_HEIGHT_MULTIPLIER;
      }
      lineHeights.push(height);
      contentHeight += height;
    }
    const availableHeight2 = Math.max(
      0,
      pageHeight - metrics.pagePadding.top - metrics.pagePadding.bottom
    );
    let scale = 1;
    if (contentHeight > 0) {
      scale = Math.min(1, availableHeight2 / contentHeight);
    }
    let verticalOffset = 0;
    if (page.isVerticallyCentered && page.lines.length > 0) {
      const effectiveContentHeight = contentHeight * scale;
      if (availableHeight2 > effectiveContentHeight) {
        verticalOffset = (availableHeight2 - effectiveContentHeight) / 2;
      }
    }
    let currentTop = metrics.pagePadding.top + verticalOffset;
    for (let i = 0; i < page.lines.length; i++) {
      const line = page.lines[i];
      const height = lineHeights[i] * scale;
      const centerY = currentTop + height / 2;
      const lineLayout = calculateLineLayout(line, centerY, height);
      lines.push(lineLayout);
      currentTop += height;
    }
    return {
      pageNumber: page.pageNumber,
      lines,
      metrics
    };
  }
  return {
    calculatePageLayout,
    getMetrics: () => ({ ...metrics })
  };
}

// src/core/lookup.ts
init_data_loader();

// src/core/bismillah.ts
init_data_loader();
var bismillahCache = {
  "hafs-v2": null,
  "hafs-v4": null,
  "hafs-unicode": null
};
async function getBismillahWords(layout) {
  if (bismillahCache[layout] !== null) {
    return bismillahCache[layout];
  }
  const page1 = await loadPage(layout, 1);
  if (!page1 || !page1.lines || page1.lines.length === 0) {
    bismillahCache[layout] = [];
    return [];
  }
  const firstVerseWords = page1.lines.flatMap((l) => l.words).filter((w) => w.surah === 1 && w.verse === 1 && w.charType !== "end");
  if (firstVerseWords.length === 0) {
    bismillahCache[layout] = [];
    return [];
  }
  const bismillahWords = firstVerseWords.slice(0, 4);
  bismillahCache[layout] = bismillahWords;
  return bismillahWords;
}

// src/view/react/navigation-controls.tsx
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
var clamp = (min, val, max) => Math.max(min, Math.min(val, max));
var NavigationControls = ({
  currentPage,
  totalPages,
  onNext,
  onPrev,
  onGoTo,
  theme,
  width,
  isFullscreen = false,
  onFullscreenToggle
}) => {
  const [inputValue, setInputValue] = useState(String(currentPage));
  const [showInput, setShowInput] = useState(false);
  const fontSizeNav = clamp(24, width * 0.023, 18);
  useEffect(() => {
    setInputValue(String(currentPage));
  }, [currentPage]);
  const handleSubmit = (event) => {
    event.preventDefault();
    const pageNum = Number.parseInt(inputValue, 10);
    if (pageNum >= 1 && pageNum <= totalPages) {
      onGoTo(pageNum);
      setShowInput(false);
    } else {
      setInputValue(String(currentPage));
    }
  };
  const buttonStyle = {
    width: 40,
    height: 40,
    border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}`,
    background: "transparent",
    color: theme === "dark" ? "#fff" : "#2c3e50",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    transition: "all 0.2s ease",
    fontFamily: "system-ui, -apple-system, sans-serif"
  };
  const buttonHoverStyle = {
    background: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
    borderColor: theme === "dark" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        position: "absolute",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 12,
        alignItems: "center",
        padding: "2px",
        background: theme === "dark" ? "rgba(26,26,46,0.85)" : "rgba(255,255,255,0.85)",
        borderRadius: 50,
        backdropFilter: "blur(10px)",
        boxShadow: theme === "dark" ? "0 4px 20px rgba(0,0,0,0.5)" : "0 4px 20px rgba(0,0,0,0.1)",
        border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`
      },
      children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: onPrev,
            disabled: currentPage <= 1,
            style: {
              ...buttonStyle,
              opacity: currentPage <= 1 ? 0.3 : 1,
              cursor: currentPage <= 1 ? "not-allowed" : "pointer"
            },
            onMouseEnter: (e) => {
              if (currentPage > 1) {
                Object.assign(e.currentTarget.style, buttonHoverStyle);
              }
            },
            onMouseLeave: (e) => {
              Object.assign(e.currentTarget.style, {
                background: "transparent",
                borderColor: theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"
              });
            },
            title: "\u0627\u0644\u0633\u0627\u0628\u0642",
            children: "\u276E"
          }
        ),
        showInput ? /* @__PURE__ */ jsx(
          "form",
          {
            onSubmit: handleSubmit,
            style: { display: "flex", alignItems: "center" },
            children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                value: inputValue,
                onChange: (event) => setInputValue(event.target.value),
                onBlur: () => {
                  setTimeout(() => setShowInput(false), 200);
                },
                min: 1,
                max: totalPages,
                style: {
                  width: 60,
                  height: 32,
                  textAlign: "center",
                  border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}`,
                  borderRadius: 8,
                  background: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.9)",
                  color: theme === "dark" ? "#fff" : "#2c3e50",
                  fontSize: fontSizeNav,
                  outline: "none",
                  fontFamily: "system-ui, -apple-system, sans-serif"
                }
              }
            )
          }
        ) : /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setShowInput(true),
            style: {
              background: "transparent",
              border: "none",
              color: theme === "dark" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
              fontSize: fontSizeNav,
              cursor: "pointer",
              padding: "6px 12px",
              borderRadius: 8,
              transition: "all 0.2s ease",
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontWeight: 500,
              whiteSpace: "nowrap"
            },
            onMouseEnter: (e) => {
              e.currentTarget.style.background = theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
              e.currentTarget.style.color = theme === "dark" ? "#fff" : "#2c3e50";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = theme === "dark" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)";
            },
            title: "\u0627\u0646\u062A\u0642\u0644 \u0625\u0644\u0649 \u0635\u0641\u062D\u0629",
            children: [
              currentPage,
              " / ",
              totalPages
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: onNext,
            disabled: currentPage >= totalPages,
            style: {
              ...buttonStyle,
              opacity: currentPage >= totalPages ? 0.3 : 1,
              cursor: currentPage >= totalPages ? "not-allowed" : "pointer"
            },
            onMouseEnter: (e) => {
              if (currentPage < totalPages) {
                Object.assign(e.currentTarget.style, buttonHoverStyle);
              }
            },
            onMouseLeave: (e) => {
              Object.assign(e.currentTarget.style, {
                background: "transparent",
                borderColor: theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"
              });
            },
            title: "\u0627\u0644\u062A\u0627\u0644\u064A",
            children: "\u276F"
          }
        ),
        onFullscreenToggle && /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: onFullscreenToggle,
            style: {
              ...buttonStyle,
              marginLeft: 8
            },
            onMouseEnter: (e) => {
              Object.assign(e.currentTarget.style, buttonHoverStyle);
            },
            onMouseLeave: (e) => {
              Object.assign(e.currentTarget.style, {
                background: "transparent",
                borderColor: theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"
              });
            },
            title: isFullscreen ? "Exit fullscreen (ESC)" : "Enter fullscreen",
            children: isFullscreen ? "\u2715" : "\u26F6"
          }
        )
      ]
    }
  );
};

// src/view/react/line.tsx
import {
  useLayoutEffect,
  useRef,
  useState as useState2
} from "react";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function Line({
  line,
  isCenteredLine,
  theme,
  fontSizeWord,
  bismillahWords,
  mushafLayout,
  lineHeight,
  onWordClick,
  surahNumberToFontCode: surahNumberToFontCode2,
  getSurahFrameUrl: getSurahFrameUrl2,
  fontSizeSurahHeader,
  paddingLeft,
  paddingRight,
  highlightedWords = [],
  highlightedVerse = null,
  wordHighlightColor = "rgba(255, 215, 0, 0.5)",
  verseHighlightColor = "rgba(135, 206, 250, 0.25)"
}) {
  const containerRef = useRef(null);
  const [highlightRange, setHighlightRange] = useState2(null);
  useLayoutEffect(() => {
    if (!highlightedVerse || !containerRef.current) {
      setHighlightRange(null);
      return;
    }
    const wordsInLine = line.words;
    const highlightedIndices = wordsInLine.map(
      (w, i) => w.surah === highlightedVerse.surah && w.verse === highlightedVerse.verse ? i : -1
    ).filter((i) => i !== -1);
    if (highlightedIndices.length === 0) {
      setHighlightRange(null);
      return;
    }
    const firstIdx = highlightedIndices[0];
    const lastIdx = highlightedIndices[highlightedIndices.length - 1];
    const container = containerRef.current;
    const wordElements = container.querySelectorAll("[data-word-idx]");
    const firstEl = Array.from(wordElements).find(
      (el) => el.dataset.wordIdx === firstIdx.toString()
    );
    const lastEl = Array.from(wordElements).find(
      (el) => el.dataset.wordIdx === lastIdx.toString()
    );
    if (firstEl && lastEl) {
      const rightEdge = firstEl.offsetLeft + firstEl.offsetWidth;
      const leftEdge = lastEl.offsetLeft;
      const isStartOfSegment = firstIdx === 0 || wordsInLine[firstIdx - 1].verse !== highlightedVerse.verse;
      const isEndOfSegment = lastIdx === wordsInLine.length - 1 || wordsInLine[lastIdx + 1].verse !== highlightedVerse.verse;
      setHighlightRange({
        left: leftEdge,
        width: rightEdge - leftEdge,
        isStart: isStartOfSegment,
        isEnd: isEndOfSegment
      });
    }
  }, [highlightedVerse, line.words, paddingLeft, paddingRight]);
  const handleWordClick = (word) => {
    onWordClick?.({
      id: word.id,
      surahNumber: word.surah,
      ayahNumber: word.verse,
      position: word.position,
      text: word.text,
      charType: word.charType
    });
  };
  const handleKeyDown = (event, word) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleWordClick(word);
    }
  };
  const wordContainerStyle = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    padding: "1px",
    justifyContent: isCenteredLine ? "center" : "space-between",
    gap: "1px",
    overflow: "hidden"
  };
  const getWordStyle = (isAyahEnd) => ({
    fontFamily: isAyahEnd ? '"AyatMarker", "DigitalKhatt", system-ui' : mushafLayout === "hafs-unicode" ? '"DigitalKhatt", "Amiri", system-ui, -apple-system, sans-serif' : '"QuranFont", system-ui, -apple-system, sans-serif',
    fontSize: fontSizeWord,
    color: theme === "dark" ? "#fff" : "#34495e",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: lineHeight,
    lineHeight: `${lineHeight}px`,
    verticalAlign: "middle",
    width: "auto",
    cursor: "pointer",
    padding: isAyahEnd ? "0px" : "1px 4px",
    margin: isAyahEnd ? "0px 8px" : "0px",
    borderRadius: 4,
    transition: "background 0.2s",
    flexShrink: 1,
    minWidth: 0
  });
  const handleMouseEnter = (event) => {
    event.currentTarget.style.background = theme === "dark" ? "#333" : "#e0e0e0";
  };
  const handleMouseLeave = (event) => {
    event.currentTarget.style.background = "transparent";
  };
  const renderWord = (word, index) => {
    const isWordHighlighted = highlightedWords.some(
      (hw) => hw.surah === word.surah && hw.verse === word.verse && hw.position === word.position
    );
    const isVerseHighlighted = highlightedVerse && highlightedVerse.surah === word.surah && highlightedVerse.verse === word.verse;
    const isAyahEnd = mushafLayout === "hafs-unicode" && word.charType === "end";
    const TARGET_MARKER = "\uFCA1";
    const isTarget = word.text && word.text.includes(TARGET_MARKER);
    const markerStyles = isTarget ? {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: "1.2em",
      margin: "0",
      borderRadius: "4px",
      position: "relative",
      verticalAlign: "middle"
    } : {
      position: "relative",
      display: "inline-block"
    };
    const highlightStyles = isVerseHighlighted && !isWordHighlighted ? {
      backgroundColor: "transparent",
      zIndex: 1
    } : {};
    return /* @__PURE__ */ jsx2(
      "span",
      {
        "data-word-idx": index,
        role: "button",
        tabIndex: 0,
        onClick: () => handleWordClick(word),
        onKeyDown: (event) => handleKeyDown(event, word),
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        style: {
          ...getWordStyle(isAyahEnd),
          ...markerStyles,
          backgroundColor: isWordHighlighted ? wordHighlightColor : void 0,
          ...highlightStyles
        },
        children: /* @__PURE__ */ jsx2(
          "span",
          {
            style: {
              // Fixes issues where the font might overlap adjacent words
              whiteSpace: "nowrap",
              fontSize: isTarget ? fontSizeWord * 0.9 : fontSizeWord,
              display: "inline-flex",
              alignItems: "center",
              fontFamily: isAyahEnd ? void 0 : mushafLayout === "hafs-unicode" ? '"DigitalKhatt", "Amiri", system-ui' : "inherit"
            },
            children: isAyahEnd ? `\uFD3E${word.verse}\uFD3F` : word.text || `[${word.id}]`
          }
        )
      },
      word.id
    );
  };
  const renderBismillahWord = (word) => /* @__PURE__ */ jsx2(
    "span",
    {
      role: "button",
      tabIndex: 0,
      onClick: () => onWordClick?.({
        id: word.id,
        surahNumber: 1,
        ayahNumber: 0,
        position: word.position,
        text: word.text,
        charType: word.charType
      }),
      onKeyDown: (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onWordClick?.({
            id: word.id,
            surahNumber: 1,
            ayahNumber: 0,
            position: word.position,
            text: word.text,
            charType: word.charType
          });
        }
      },
      style: {
        fontFamily: mushafLayout === "hafs-unicode" ? '"DigitalKhatt", "Scheherazade New", "Amiri", system-ui, -apple-system, sans-serif' : line.lineType === "bismillah" ? '"BismillahFont", system-ui, -apple-system, sans-serif' : '"QuranFont", system-ui, -apple-system, sans-serif',
        fontSize: fontSizeWord,
        color: theme === "dark" ? "#fff" : "#34495e",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: lineHeight,
        lineHeight: `${lineHeight}px`,
        verticalAlign: "middle",
        minWidth: "auto",
        width: "auto",
        cursor: "pointer",
        padding: "2px 4px",
        borderRadius: 4,
        transition: "background 0.2s",
        flexShrink: 0
      },
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      children: word.text || `[${word.id}]`
    },
    word.id
  );
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      ref: containerRef,
      style: {
        position: "absolute",
        left: paddingLeft,
        right: paddingRight,
        height: lineHeight,
        top: Math.max(0, line.y - lineHeight / 2),
        display: "flex",
        alignItems: "center",
        justifyContent: isCenteredLine ? "center" : "space-between",
        padding: "1px",
        overflow: "hidden"
      },
      children: [
        highlightRange && /* @__PURE__ */ jsx2(
          "div",
          {
            style: {
              position: "absolute",
              left: highlightRange.left,
              width: highlightRange.width,
              height: lineHeight - 4,
              top: 2,
              backgroundColor: verseHighlightColor,
              borderTopRightRadius: highlightRange.isStart ? 8 : 0,
              borderBottomRightRadius: highlightRange.isStart ? 8 : 0,
              borderTopLeftRadius: highlightRange.isEnd ? 8 : 0,
              borderBottomLeftRadius: highlightRange.isEnd ? 8 : 0,
              zIndex: 0,
              pointerEvents: "none"
            }
          }
        ),
        line.lineType === "header" ? /* @__PURE__ */ jsx2(
          "span",
          {
            style: {
              position: "relative",
              width: "100%",
              height: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundImage: `url(${getSurahFrameUrl2()})`,
              backgroundSize: "100% 100%"
            },
            children: /* @__PURE__ */ jsx2(
              "span",
              {
                style: {
                  position: "relative",
                  zIndex: 1,
                  fontSize: fontSizeSurahHeader,
                  fontWeight: "bold",
                  color: theme === "dark" ? "#2c3e50" : "#2c3e50",
                  fontFamily: '"SurahNameFont", system-ui, -apple-system, sans-serif',
                  textAlign: "center"
                },
                children: line.surahNumber ? surahNumberToFontCode2(line.surahNumber) : "surah000"
              }
            )
          }
        ) : line.lineType === "bismillah" ? /* @__PURE__ */ jsx2("div", { style: wordContainerStyle, children: bismillahWords.map(renderBismillahWord) }) : /* @__PURE__ */ jsx2("div", { style: wordContainerStyle, children: line.words.map(renderWord) })
      ]
    }
  );
}

// src/view/react/loading.tsx
import { jsx as jsx3 } from "react/jsx-runtime";
function Loading({ theme }) {
  return /* @__PURE__ */ jsx3(
    "div",
    {
      style: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        color: theme === "dark" ? "#fff" : "#333"
      },
      children: "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644..."
    }
  );
}

// src/view/react/index.tsx
import { jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
var clamp2 = (min, val, max) => Math.max(min, Math.min(val, max));
var CENTERED_PAGES_VERTICAL = [1, 2];
var CENTERED_PAGES_HORIZONTAL = [1, 2, 602, 603, 604];
var CENTERED_PAGES_HORIZONTAL_SET = new Set(
  CENTERED_PAGES_HORIZONTAL
);
var OpenQuranView = ({
  page = 1,
  width,
  height,
  theme = "light",
  mushafLayout = "hafs-v2",
  ratio = true,
  onPageChange,
  onLoad,
  onWordClick,
  className,
  fullscreen = false,
  onFullscreenToggle,
  highlightedWords = [],
  highlightedVerse = null,
  wordHighlightColor,
  verseHighlightColor,
  navigationControls = false,
  fit = "width"
}) => {
  const MUSHAF_RATIO = 0.7;
  const containerRef = useRef2(null);
  const layoutRef = useRef2(mushafLayout);
  const calculatorRef = useRef2(null);
  const [loading, setLoading] = useState3(true);
  const [currentPage, setCurrentPage] = useState3(page);
  const [pageLayout, setPageLayout] = useState3(null);
  const [containerWidth, setContainerWidth] = useState3(width || 0);
  const [containerHeight, setContainerHeight] = useState3(height || 0);
  const [bismillahWords, setBismillahWords] = useState3([]);
  const [isFullscreen, setIsFullscreen] = useState3(fullscreen);
  const [showControls, setShowControls] = useState3(true);
  const hideControlsTimerRef = useRef2(
    null
  );
  if (process.env.NODE_ENV !== "production") {
    if (width && height && fit !== "width") {
      console.warn(
        `OpenQuranView: Both width and height are provided. The "fit" prop will be ignored.`
      );
    }
    if (fit === "height" && width && !height) {
      console.warn(
        `OpenQuranView: "fit="height"" is ignored when width is provided without height. Using width as provided.`
      );
    }
    if (fit === "width" && height && !width) {
      console.warn(
        `OpenQuranView: "fit="width"" is ignored when height is provided without width. Using height as provided.`
      );
    }
    if (ratio === false && fit !== "width") {
      console.warn(
        `OpenQuranView: The "fit" prop is ignored when ratio={false} because no dimension derivation occurs.`
      );
    }
    if (isFullscreen && (width || height)) {
      console.warn(
        `OpenQuranView: Explicit width/height are ignored in fullscreen mode.`
      );
    }
  }
  useEffect2(() => {
    if (ratio === false) {
      if (width && height && !isFullscreen) {
        setContainerWidth(width);
        setContainerHeight(height);
        return;
      }
      if (width && !isFullscreen) {
        setContainerWidth(width);
      } else {
        const container2 = containerRef.current;
        if (!container2) return;
        const resizeObserver2 = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const rect = entry.contentRect;
            if (rect.width > 0) setContainerWidth(rect.width);
            if (rect.height > 0) setContainerHeight(rect.height);
          }
        });
        resizeObserver2.observe(container2);
        return () => resizeObserver2.disconnect();
      }
      return;
    }
    if (width && !isFullscreen) {
      setContainerWidth(width);
      return;
    }
    if (height && !isFullscreen) {
      setContainerHeight(height);
      return;
    }
    const container = containerRef.current;
    if (!container) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const rect = entry.contentRect;
        if (fit === "height") {
          if (rect.height > 0) setContainerHeight(rect.height);
        } else {
          if (rect.width > 0) setContainerWidth(rect.width);
        }
      }
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [width, height, ratio, fit, isFullscreen]);
  useEffect2(() => {
    if (ratio === false) return;
    const actualRatio = typeof ratio === "number" ? ratio : MUSHAF_RATIO;
    if (height && !isFullscreen) {
      const derivedWidth = height * actualRatio;
      const clampedWidth = containerWidth > 0 ? Math.min(derivedWidth, containerWidth) : derivedWidth;
      setContainerWidth(clampedWidth);
      setContainerHeight(height);
      return;
    }
    if (containerWidth > 0) {
      setContainerHeight(containerWidth / actualRatio);
    }
  }, [height, containerWidth, isFullscreen, ratio]);
  const handleFullscreenToggle = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
        onFullscreenToggle?.(true);
      }).catch((err) => {
        console.error("Failed to enter fullscreen:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        onFullscreenToggle?.(false);
      }).catch((err) => {
        console.error("Failed to exit fullscreen:", err);
      });
    }
  }, [onFullscreenToggle]);
  useEffect2(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
      if (isCurrentlyFullscreen) {
        onFullscreenToggle?.(true);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [onFullscreenToggle]);
  useEffect2(() => {
    setIsFullscreen(fullscreen);
  }, [fullscreen]);
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3e3);
  }, []);
  const handleLoadPage = useCallback(
    async (pageNum) => {
      if (!calculatorRef.current || !containerRef.current) return;
      setLoading(true);
      try {
        await loadFont(layoutRef.current, pageNum);
        const quranPage = await loadPage(layoutRef.current, pageNum);
        if (!quranPage) return;
        const calculatedLayout = calculatorRef.current.calculatePageLayout(quranPage);
        setPageLayout(calculatedLayout);
        setCurrentPage(pageNum);
        onLoad?.(calculatedLayout);
      } catch (error) {
        console.error("Failed to load page:", error);
      } finally {
        setLoading(false);
      }
    },
    [onLoad]
  );
  useEffect2(() => {
    calculatorRef.current = createLayoutCalculator({
      pageWidth: containerWidth,
      pageHeight: containerHeight
    });
    handleLoadPage(page);
    loadSurahNameFont();
    return () => {
      calculatorRef.current = null;
    };
  }, [containerWidth, containerHeight, page, handleLoadPage]);
  useEffect2(() => {
    layoutRef.current = mushafLayout;
    handleLoadPage(page);
    if (mushafLayout === "hafs-unicode") loadAyatMarkerFont();
  }, [mushafLayout, page, handleLoadPage]);
  useEffect2(() => {
    loadBismillahFont(mushafLayout);
    getBismillahWords(mushafLayout).then(setBismillahWords);
  }, [mushafLayout]);
  const handleNextPage = useCallback(async () => {
    const next = currentPage + 1;
    await handleLoadPage(next);
    onPageChange?.(next);
  }, [currentPage, handleLoadPage, onPageChange]);
  const handlePrevPage = useCallback(async () => {
    const prev = currentPage - 1;
    await handleLoadPage(prev);
    onPageChange?.(prev);
  }, [currentPage, handleLoadPage, onPageChange]);
  const handleGoToPage = useCallback(
    async (pageNum) => {
      await handleLoadPage(pageNum);
      onPageChange?.(pageNum);
    },
    [handleLoadPage, onPageChange]
  );
  useEffect2(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        handlePrevPage();
      } else if (e.key === "ArrowLeft") {
        handleNextPage();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleNextPage, handlePrevPage]);
  return (
    /* eslint-disable jsx-a11y/no-noninteractive-tabindex */
    /* @__PURE__ */ jsxs3(
      "div",
      {
        ref: containerRef,
        className,
        role: "region",
        "aria-label": "Quran Viewer",
        style: {
          position: "relative",
          width: isFullscreen ? "100vw" : "100%",
          height: isFullscreen ? "100vh" : "100%",
          background: theme === "dark" ? "#1a1a2e" : "#fafafa",
          overflow: "hidden",
          fontFamily: "system-ui, -apple-system, sans-serif",
          direction: "rtl",
          display: "flex",
          justifyContent: "center",
          cursor: isFullscreen ? showControls ? "default" : "none" : "default"
        },
        onMouseMove: handleMouseMove,
        tabIndex: 0,
        children: [
          loading && /* @__PURE__ */ jsx4(Loading, { theme }),
          !loading && pageLayout && /* @__PURE__ */ jsx4(
            "div",
            {
              style: {
                width: containerWidth,
                height: containerHeight,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center"
              },
              children: /* @__PURE__ */ jsx4(
                "div",
                {
                  style: {
                    position: "relative",
                    width: "100%",
                    height: containerHeight,
                    overflow: "hidden"
                  },
                  children: pageLayout.lines.map((line) => {
                    const isCenteredLine = line.isCentered || CENTERED_PAGES_HORIZONTAL_SET.has(currentPage);
                    const lineH = line.height || pageLayout.metrics.lineHeight;
                    const fontSizeWord = clamp2(10, lineH / 1.7, 200);
                    const fontSizeSurahHeader = clamp2(16, lineH / 1.7, 200);
                    return /* @__PURE__ */ jsx4(
                      Line,
                      {
                        line,
                        isCenteredLine,
                        theme,
                        fontSizeSurahHeader,
                        fontSizeWord,
                        bismillahWords,
                        mushafLayout,
                        lineHeight: lineH,
                        onWordClick,
                        surahNumberToFontCode,
                        getSurahFrameUrl,
                        paddingLeft: pageLayout.metrics.pagePadding.left,
                        paddingRight: pageLayout.metrics.pagePadding.right,
                        highlightedWords,
                        highlightedVerse,
                        wordHighlightColor,
                        verseHighlightColor
                      },
                      line.lineNumber
                    );
                  })
                }
              )
            }
          ),
          navigationControls && /* @__PURE__ */ jsx4(
            "div",
            {
              style: {
                position: "absolute",
                bottom: 20,
                left: "50%",
                transform: "translateX(-50%)",
                opacity: showControls ? 1 : 0,
                pointerEvents: showControls ? "auto" : "none",
                transition: "opacity 0.3s ease",
                zIndex: 10
              },
              children: !loading && pageLayout && /* @__PURE__ */ jsx4(
                NavigationControls,
                {
                  currentPage,
                  totalPages: 604,
                  onNext: handleNextPage,
                  onPrev: handlePrevPage,
                  onGoTo: handleGoToPage,
                  theme,
                  width: containerWidth,
                  isFullscreen,
                  onFullscreenToggle: handleFullscreenToggle
                }
              )
            }
          )
        ]
      }
    )
  );
};
var react_default = OpenQuranView;
export {
  CENTERED_PAGES_HORIZONTAL,
  CENTERED_PAGES_VERTICAL,
  OpenQuranView,
  react_default as default
};
