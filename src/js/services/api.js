// SELAMY API SERVICE - POVEZIVANJE SA EXPRESS POSTGRESQL BACKEND-OM

const API_BASE = '/api';

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

// 1. AUTH API
export async function registerUser(userData) {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Greška pri registraciji');
    if (data.token) setToken(data.token);
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function loginUser(credentials) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Greška pri prijavi');
    if (data.token) setToken(data.token);
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

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

// 2. POSTS API
export async function fetchPostsAPI() {
  try {
    const res = await fetch(`${API_BASE}/posts`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.posts;
  } catch (err) {
    return null;
  }
}

export async function createPostAPI(postData) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(postData)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.post;
  } catch (err) {
    return null;
  }
}

export async function likePostAPI(postId) {
  try {
    const res = await fetch(`${API_BASE}/posts/${postId}/like`, { method: 'POST' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

// 3. STORIES API
export async function fetchStoriesAPI() {
  try {
    const res = await fetch(`${API_BASE}/stories`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.stories;
  } catch (err) {
    return null;
  }
}

export async function createStoryAPI(storyData) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}/stories`, {
      method: 'POST',
      headers,
      body: JSON.stringify(storyData)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.story;
  } catch (err) {
    return null;
  }
}

// 4. REELS API
export async function fetchReelsAPI() {
  try {
    const res = await fetch(`${API_BASE}/reels`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.reels;
  } catch (err) {
    return null;
  }
}

export async function createReelAPI(reelData) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}/reels`, {
      method: 'POST',
      headers,
      body: JSON.stringify(reelData)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.reel;
  } catch (err) {
    return null;
  }
}

export async function likeReelAPI(reelId) {
  try {
    const res = await fetch(`${API_BASE}/reels/${reelId}/like`, { method: 'POST' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

// 5. FORUM API
export async function fetchForumAPI() {
  try {
    const res = await fetch(`${API_BASE}/forum`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.topics;
  } catch (err) {
    return null;
  }
}

export async function createForumTopicAPI(topicData) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}/forum/topics`, {
      method: 'POST',
      headers,
      body: JSON.stringify(topicData)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.topic;
  } catch (err) {
    return null;
  }
}
