// SELAMY API SERVICE - POVEZIVANJE SA EXPRESS BACKEND-OM

const API_BASE = '/api';

// Preuzimanje tokena iz LocalStorage-a
export function getToken() {
  return localStorage.getItem('selamy_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('selamy_token', token);
  } else {
    localStorage.removeItem('selamy_token');
  }
}

// 1. REGISTRACIJA KORISNIKA
export async function registerUser(userData) {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Greška pri registraciji');
    }

    if (data.token) {
      setToken(data.token);
    }
    return data;
  } catch (err) {
    console.warn('Backend greška, prelazak na klijentski rezim:', err.message);
    return { success: false, error: err.message };
  }
}

// 2. PRIJAVA KORISNIKA (LOGIN)
export async function loginUser(credentials) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Greška pri prijavi');
    }

    if (data.token) {
      setToken(data.token);
    }
    return data;
  } catch (err) {
    console.warn('Backend greška, prelazak na klijentski rezim:', err.message);
    return { success: false, error: err.message };
  }
}

// 3. PROVERA PROFILA TRENUTNOG KORISNIKA (/auth/me)
export async function fetchCurrentUser() {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch (err) {
    return null;
  }
}

// 4. KREIRANJE NOVE OBJAVE NA BACKEND-U
export async function createPostAPI(postData) {
  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(postData)
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.post;
  } catch (err) {
    return null;
  }
}
