// SELAMY API SERVICE - POSTGRESQL BACKEND WITH COOKIE AUTH

const API_BASE = '/api';

export function getToken() { return localStorage.getItem('selamy_token'); }
export function setToken(token) { token ? localStorage.setItem('selamy_token', token) : localStorage.removeItem('selamy_token'); }

function getHeaders(extra = {}) {
  const token = getToken();
  const headers = { ...extra };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// 1. AUTH
export async function registerUser(userData) {
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) return { success: false, status: res.status, error: data.error || 'Greška pri registraciji' };
    if (data.token) setToken(data.token);
    return data;
  } catch (err) { return { success: false, error: err.message }; }
}

export async function loginUser(credentials) {
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(credentials)
    });
    const data = await res.json();
    if (!res.ok) return { success: false, status: res.status, error: data.error || 'Greška pri prijavi' };
    if (data.token) setToken(data.token);
    return data;
  } catch (err) { return { success: false, error: err.message }; }
}

export async function logoutUser() {
  try {
    setToken(null);
    const res = await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    return await res.json();
  } catch (err) { return { success: true }; }
}

export async function fetchCurrentUser() {
  try {
    const res = await fetch(`${API_BASE}/me`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch (err) { return null; }
}

// 2. NOTIFICATIONS
export async function fetchNotificationsAPI() {
  try {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) { return null; }
}

export async function markNotificationsReadAPI() {
  try {
    const res = await fetch(`${API_BASE}/notifications/read`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include'
    });
    return await res.json();
  } catch (err) { return null; }
}

// 3. EXPLORE
export async function fetchExploreAPI({ q = '', tag = '', page = 1 } = {}) {
  try {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (tag) params.set('tag', tag);
    params.set('page', page);
    params.set('limit', 24);

    const res = await fetch(`${API_BASE}/explore?${params.toString()}`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) { return null; }
}

export async function fetchPostByIdAPI(postId) {
  try {
    const res = await fetch(`${API_BASE}/posts/${postId}`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.post;
  } catch (err) { return null; }
}

// 4. POSTS + COMMENTS + LIKES
export async function fetchPostsAPI() {
  try {
    const res = await fetch(`${API_BASE}/posts`, {
      headers: getHeaders(),
      credentials: 'include'
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.posts;
  } catch (err) { return null; }
}

export async function createPostAPI(postData) {
  try {
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(postData)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.post;
  } catch (err) { return null; }
}

export async function likePostAPI(postId) {
  try {
    const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include'
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || 'Niste prijavljeni ili je došlo do greške' };
    }
    return await res.json();
  } catch (err) { return null; }
}

export async function commentPostAPI(postId, text) {
  try {
    const res = await fetch(`${API_BASE}/posts/${postId}/comment`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify({ text })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) { return null; }
}

// 5. STORIES
export async function fetchStoriesAPI() {
  try {
    const res = await fetch(`${API_BASE}/stories`, { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.stories;
  } catch (err) { return null; }
}

export async function createStoryAPI(storyData) {
  try {
    const res = await fetch(`${API_BASE}/stories`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(storyData)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.story;
  } catch (err) { return null; }
}

export async function commentStoryAPI(storyId, text) {
  try {
    const res = await fetch(`${API_BASE}/stories/${storyId}/comment`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify({ text })
    });
    return await res.json();
  } catch (err) { return null; }
}

// 6. REELS
export async function fetchReelsAPI() {
  try {
    const res = await fetch(`${API_BASE}/reels`, { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.reels;
  } catch (err) { return null; }
}

export async function createReelAPI(reelData) {
  try {
    const res = await fetch(`${API_BASE}/reels`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(reelData)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.reel;
  } catch (err) { return null; }
}

export async function likeReelAPI(reelId) {
  try {
    const res = await fetch(`${API_BASE}/reels/${reelId}/like`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include'
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) { return null; }
}

export async function commentReelAPI(reelId, text) {
  try {
    const res = await fetch(`${API_BASE}/reels/${reelId}/comment`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify({ text })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) { return null; }
}

export async function fetchReelCommentsAPI(reelId) {
  try {
    const res = await fetch(`${API_BASE}/reels/${reelId}/comments`, { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.comments;
  } catch (err) { return null; }
}

// 7. FORUM
export async function fetchForumAPI() {
  try {
    const res = await fetch(`${API_BASE}/forum`, { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.topics;
  } catch (err) { return null; }
}

export async function createForumTopicAPI(topicData) {
  try {
    const res = await fetch(`${API_BASE}/forum/topics`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(topicData)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.topic;
  } catch (err) { return null; }
}
