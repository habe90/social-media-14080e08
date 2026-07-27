// SELAMY - POOL AJETA ZA "AJET DANA" (rotira se po danu u godini)
// surah/ayah odgovaraju numeraciji na quran.com; surahName je bosanski naziv sure (Korkut/Rijaset konvencija)

export const AYAH_POOL = [
  { surah: 2, ayah: 153, surahName: 'El-Bekare' },
  { surah: 2, ayah: 286, surahName: 'El-Bekare' },
  { surah: 3, ayah: 159, surahName: 'Alu Imran' },
  { surah: 3, ayah: 139, surahName: 'Alu Imran' },
  { surah: 94, ayah: 6, surahName: 'El-Inširah' },
  { surah: 13, ayah: 28, surahName: 'Er-Ra\'d' },
  { surah: 16, ayah: 97, surahName: 'En-Nahl' },
  { surah: 17, ayah: 23, surahName: 'El-Isra' },
  { surah: 25, ayah: 63, surahName: 'El-Furkan' },
  { surah: 31, ayah: 17, surahName: 'Lukman' },
  { surah: 39, ayah: 53, surahName: 'Ez-Zumer' },
  { surah: 49, ayah: 13, surahName: 'El-Hudžurat' },
  { surah: 55, ayah: 60, surahName: 'Er-Rahman' },
  { surah: 65, ayah: 3, surahName: 'Et-Talak' },
  { surah: 103, ayah: 1, surahName: 'El-Asr' },
  { surah: 2, ayah: 177, surahName: 'El-Bekare' },
  { surah: 2, ayah: 195, surahName: 'El-Bekare' },
  { surah: 3, ayah: 133, surahName: 'Alu Imran' },
  { surah: 4, ayah: 36, surahName: 'En-Nisa' },
  { surah: 6, ayah: 160, surahName: 'El-En\'am' },
  { surah: 7, ayah: 199, surahName: 'El-A\'raf' },
  { surah: 9, ayah: 71, surahName: 'Et-Tevba' },
  { surah: 14, ayah: 7, surahName: 'Ibrahim' },
  { surah: 16, ayah: 90, surahName: 'En-Nahl' },
  { surah: 17, ayah: 7, surahName: 'El-Isra' },
  { surah: 20, ayah: 14, surahName: 'Taha' },
  { surah: 21, ayah: 107, surahName: 'El-Enbija' },
  { surah: 24, ayah: 22, surahName: 'En-Nur' },
  { surah: 29, ayah: 45, surahName: 'El-Ankebut' },
  { surah: 30, ayah: 21, surahName: 'Er-Rum' },
  { surah: 33, ayah: 21, surahName: 'El-Ahzab' },
  { surah: 39, ayah: 10, surahName: 'Ez-Zumer' },
  { surah: 41, ayah: 34, surahName: 'Fussilet' },
  { surah: 57, ayah: 18, surahName: 'El-Hadid' },
  { surah: 59, ayah: 9, surahName: 'El-Hašr' },
  { surah: 76, ayah: 8, surahName: 'El-Insan' },
  { surah: 93, ayah: 11, surahName: 'Ed-Duha' },
  { surah: 99, ayah: 7, surahName: 'Ez-Zilzal' },
  { surah: 2, ayah: 263, surahName: 'El-Bekare' },
  { surah: 20, ayah: 25, surahName: 'Taha' },
  { surah: 94, ayah: 1, surahName: 'El-Inširah' }
];

export function getTodaysAyahRef(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return AYAH_POOL[dayOfYear % AYAH_POOL.length];
}
