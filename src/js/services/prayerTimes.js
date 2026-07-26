// SELAMY - VAKTIJA I NAMASKA VREMENA & PRECIZNA GPS LOKACIJA

import { state } from '../state.js';
import { showToast } from '../utils/compressor.js';

// Vaktija.ba lista gradova za BiH
const BIH_CITIES_MAP = [
  { name: 'Sarajevo', id: 77, lat: 43.8563, lng: 18.4131 },
  { name: 'Banja Luka', id: 10, lat: 44.7722, lng: 17.1910 },
  { name: 'Bihać', id: 19, lat: 44.8169, lng: 15.8708 },
  { name: 'Bijeljina', id: 22, lat: 44.7570, lng: 19.2144 },
  { name: 'Brčko', id: 31, lat: 44.8728, lng: 18.8108 },
  { name: 'Goražde', id: 50, lat: 43.6672, lng: 18.9761 },
  { name: 'Kalesija', id: 188, lat: 44.4417, lng: 18.8722 }, // Povezano na Tuzlanski kanton/Tuzlu
  { name: 'Mostar', id: 112, lat: 43.3438, lng: 17.8078 },
  { name: 'Prijedor', id: 135, lat: 44.9799, lng: 16.7140 },
  { name: 'Tuzla', id: 188, lat: 44.5384, lng: 18.6671 },
  { name: 'Zenica', id: 204, lat: 44.2034, lng: 17.9077 }
];

let prayerTimerInterval = null;

export function initPrayerTimesService() {
  fetchOfficialPrayerTimes();
  renderPrayerTimesWidget();

  if (prayerTimerInterval) clearInterval(prayerTimerInterval);
  prayerTimerInterval = setInterval(() => {
    recalculateNextPrayer();
    renderPrayerTimesWidget();
  }, 30000);
}

/**
 * Pomoćna funkcija za čišćenje naziva lokacija (uklanjanje engleskih pojmova i emoji ikonica)
 */
export function cleanLocationName(str) {
  if (!str) return '';
  return str
    .replace(/\s*municipality\s*/gi, '')
    .replace(/\s*općina\s*/gi, '')
    .replace(/\s*opština\s*/gi, '')
    .replace(/\s*city of\s*/gi, '')
    .replace(/\s*town of\s*/gi, '')
    .replace(/[📍📌📍]/g, '') // uklanjanje emoji pribadača
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Preuzimanje vaktije preko vaktija.ba
 */
export async function fetchOfficialPrayerTimes(cityId = 77, cityName = 'Sarajevo, BiH') {
  try {
    const res = await fetch(`https://api.vaktija.ba/vaktija/v1/${cityId}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.vaktija && Array.isArray(data.vaktija) && data.vaktija.length >= 6) {
        const times = data.vaktija;
        state.prayerTimes.fajr = times[0];
        state.prayerTimes.dhuhr = times[2];
        state.prayerTimes.asr = times[3];
        state.prayerTimes.maghrib = times[4];
        state.prayerTimes.isha = times[5];
        state.prayerTimes.locationName = cleanLocationName(cityName);

        recalculateNextPrayer();
        renderPrayerTimesWidget();
        return;
      }
    }
  } catch (err) {
    console.log('Vaktija fallback');
  }

  useCalculatedFallbackTimes();
  recalculateNextPrayer();
  renderPrayerTimesWidget();
}

function useCalculatedFallbackTimes() {
  const now = new Date();
  const month = now.getMonth();

  const seasonalTimes = [
    { f: '05:40', d: '11:58', a: '14:20', m: '16:40', i: '18:10' },
    { f: '05:15', d: '12:05', a: '15:00', m: '17:20', i: '18:45' },
    { f: '04:30', d: '12:05', a: '15:30', m: '18:00', i: '19:30' },
    { f: '04:20', d: '12:55', a: '16:35', m: '19:40', i: '21:10' },
    { f: '03:25', d: '12:55', a: '16:55', m: '20:15', i: '22:00' },
    { f: '02:50', d: '13:00', a: '17:15', m: '20:40', i: '22:35' },
    { f: '03:05', d: '13:05', a: '17:10', m: '20:30', i: '22:20' },
    { f: '03:50', d: '13:00', a: '16:45', m: '20:00', i: '21:35' },
    { f: '04:35', d: '12:50', a: '16:10', m: '19:10', i: '20:30' },
    { f: '05:15', d: '12:40', a: '15:30', m: '18:15', i: '19:40' },
    { f: '05:00', d: '11:40', a: '14:15', m: '16:35', i: '18:05' },
    { f: '05:30', d: '11:50', a: '14:05', m: '16:25', i: '17:55' }
  ];

  const st = seasonalTimes[month] || seasonalTimes[2];
  state.prayerTimes.fajr = st.f;
  state.prayerTimes.dhuhr = st.d;
  state.prayerTimes.asr = st.a;
  state.prayerTimes.maghrib = st.m;
  state.prayerTimes.isha = st.i;
}

export function recalculateNextPrayer() {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const parseMins = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const p = state.prayerTimes;

  const fajrMins = parseMins(p.fajr);
  const dhuhrMins = parseMins(p.dhuhr);
  const asrMins = parseMins(p.asr);
  const maghribMins = parseMins(p.maghrib);
  const ishaMins = parseMins(p.isha);

  let nextName = 'Sabah';
  let targetMins = fajrMins + 24 * 60;
  let activeName = 'Jacija';

  if (currentMinutes < fajrMins) {
    nextName = 'Sabah';
    targetMins = fajrMins;
    activeName = 'Jacija';
  } else if (currentMinutes >= fajrMins && currentMinutes < dhuhrMins) {
    nextName = 'Podne';
    targetMins = dhuhrMins;
    activeName = 'Sabah';
  } else if (currentMinutes >= dhuhrMins && currentMinutes < asrMins) {
    nextName = 'Ikindija';
    targetMins = asrMins;
    activeName = 'Podne';
  } else if (currentMinutes >= asrMins && currentMinutes < maghribMins) {
    nextName = 'Akšam';
    targetMins = maghribMins;
    activeName = 'Ikindija';
  } else if (currentMinutes >= maghribMins && currentMinutes < ishaMins) {
    nextName = 'Jacija';
    targetMins = ishaMins;
    activeName = 'Akšam';
  } else {
    nextName = 'Sabah (sutra)';
    targetMins = fajrMins + 24 * 60;
    activeName = 'Jacija';
  }

  let diff = targetMins - currentMinutes;
  if (diff < 0) diff += 24 * 60;

  const hoursLeft = Math.floor(diff / 60);
  const minsLeft = diff % 60;

  let timeLeftStr = '';
  if (hoursLeft > 0) {
    timeLeftStr = `${hoursLeft}h ${minsLeft}m`;
  } else {
    timeLeftStr = `${minsLeft} min`;
  }

  p.nextPrayerName = nextName;
  p.activePrayerName = activeName;
  p.timeLeft = timeLeftStr;
}

export function renderPrayerTimesWidget() {
  const container = document.getElementById('prayer-times-widget');
  if (!container) return;

  const p = state.prayerTimes;
  const locLabel = p.locationName || 'Sarajevo, BiH';

  container.innerHTML = `
    <div class="prayer-times-banner">
      <div class="prayer-header">
        <div class="prayer-title-group">
          <i class="fa-solid fa-kaaba prayer-icon"></i>
          <div>
            <h4 class="prayer-title">Vaktija i namaska vremena (IZ u BiH)</h4>
            <span class="prayer-location-sub" id="prayer-city-label"><i class="fa-solid fa-location-dot"></i> ${locLabel}</span>
          </div>
        </div>
        <div class="next-prayer-badge">
          <span>Sljedeći namaz: <strong>${p.nextPrayerName} za ${p.timeLeft}</strong></span>
        </div>
      </div>

      <div class="prayer-grid">
        <div class="prayer-time-card ${p.activePrayerName === 'Sabah' ? 'active-prayer' : ''}">
          <span class="p-name">Sabah</span>
          <strong class="p-time">${p.fajr}</strong>
        </div>
        <div class="prayer-time-card ${p.activePrayerName === 'Podne' ? 'active-prayer' : ''}">
          <span class="p-name">Podne</span>
          <strong class="p-time">${p.dhuhr}</strong>
        </div>
        <div class="prayer-time-card ${p.activePrayerName === 'Ikindija' ? 'active-prayer' : ''}">
          <span class="p-name">Ikindija</span>
          <strong class="p-time">${p.asr}</strong>
        </div>
        <div class="prayer-time-card ${p.activePrayerName === 'Akšam' ? 'active-prayer' : ''}">
          <span class="p-name">Akšam</span>
          <strong class="p-time">${p.maghrib}</strong>
        </div>
        <div class="prayer-time-card ${p.activePrayerName === 'Jacija' ? 'active-prayer' : ''}">
          <span class="p-name">Jacija</span>
          <strong class="p-time">${p.isha}</strong>
        </div>
      </div>
    </div>
  `;
}

/**
 * Automatska detekcija precizne GPS lokacije u pozadini
 */
export function detectUserPreciseLocation(silent = false) {
  if (!navigator.geolocation) {
    if (!silent) showToast('Geolokacija nije podržana u vašem pregledniku.');
    return;
  }

  if (!silent) showToast('Određujem vašu tačnu GPS lokaciju...');

  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  };

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy ? Math.round(position.coords.accuracy) : null;

      let locationText = 'Kalesija (Babajići)';
      let cityForVaktija = 'Tuzla';

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();

        if (data && data.address) {
          const addr = data.address;
          const village = cleanLocationName(addr.village || addr.suburb || addr.hamlet || addr.neighbourhood || '');
          const municipality = cleanLocationName(addr.municipality || addr.town || addr.city || addr.county || '');
          const country = addr.country || 'BiH';

          if (village && municipality && village.toLowerCase() !== municipality.toLowerCase()) {
            locationText = `${municipality} (${village})`;
          } else if (municipality) {
            locationText = `${municipality}, ${country}`;
          } else if (village) {
            locationText = `${village}, ${country}`;
          }

          cityForVaktija = municipality || village || 'Sarajevo';

          const matchedCity = BIH_CITIES_MAP.find(c =>
            c.name.toLowerCase() === cityForVaktija.toLowerCase() ||
            cityForVaktija.toLowerCase().includes(c.name.toLowerCase())
          );

          if (matchedCity) {
            fetchOfficialPrayerTimes(matchedCity.id, `${matchedCity.name}, BiH`);
          } else {
            fetchOfficialPrayerTimes(188, `${cityForVaktija}, BiH`);
          }
        }
      } catch (err) {
        console.log('Obrnuto geokodiranje fallback');
      }

      state.currentUser.location = { lat, lng, accuracy, text: locationText };

      updateLocationUI(locationText, accuracy);
      
      const postLocInput = document.getElementById('post-location');
      if (postLocInput) postLocInput.value = locationText;

      if (!silent) showToast(`Detektovana lokacija: ${locationText}`);
    },
    (error) => {
      // Fallback ako preglednik traži dozvolu ili koristi zadane koordinate
      const locationText = 'Kalesija (Babajići)';
      state.currentUser.location = { lat: 44.4417, lng: 18.8722, accuracy: 12, text: locationText };
      updateLocationUI(locationText, 12);

      const postLocInput = document.getElementById('post-location');
      if (postLocInput) postLocInput.value = locationText;

      if (!silent) showToast('Aktivirana automatska lokacija: Kalesija (Babajići)');
    },
    options
  );
}

function updateLocationUI(locationText, accuracy) {
  const bannerText = document.getElementById('user-current-location-text');
  if (bannerText) {
    bannerText.innerHTML = `${locationText} ${accuracy ? `<span style="font-size:11px; opacity:0.8; font-weight:normal;">(±${accuracy}m)</span>` : ''}`;
  }

  const sidebarGps = document.getElementById('sidebar-gps-tag');
  if (sidebarGps) {
    sidebarGps.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${locationText}`;
  }

  const profileGpsText = document.getElementById('profile-gps-text');
  if (profileGpsText) {
    profileGpsText.textContent = `Trenutna GPS lokacija: ${locationText}`;
  }

  const prayerCityLabel = document.getElementById('prayer-city-label');
  if (prayerCityLabel) {
    prayerCityLabel.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${locationText}`;
  }
}
