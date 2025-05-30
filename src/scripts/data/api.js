// File: src/scripts/data/api.js

import { getAccessToken } from '../utils/auth'; // Asumsi path ini benar
import { BASE_URL } from '../config'; // Pastikan BASE_URL hanya diimpor dari sini

const ENDPOINTS = {
  // Auth
  REGISTER: `${BASE_URL}/register`,
  LOGIN: `${BASE_URL}/login`,

  // Stories
  STORIES: `${BASE_URL}/stories`,
  STORIES_GUEST: `${BASE_URL}/stories/guest`,
  STORY_DETAIL: (id) => `${BASE_URL}/stories/${id}`,

  // Notifications
  SUBSCRIBE_NOTIFICATIONS: `${BASE_URL}/notifications/subscribe`,
};

/**
 * Registers a new user.
 */
export async function registerUser({ name, email, password }) {
  const data = JSON.stringify({ name, email, password });

  const fetchResponse = await fetch(ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
    status: fetchResponse.status,
  };
}

/**
 * Logs in an existing user.
 */
export async function loginUser({ email, password }) {
  const data = JSON.stringify({ email, password });

  const fetchResponse = await fetch(ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
    status: fetchResponse.status,
  };
}

/**
 * Fetches all stories.
 */
export async function getAllStories({ page, size, location } = {}) {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return { error: true, message: 'Access token not found', ok: false, status: 401 };
  }

  const queryParams = new URLSearchParams();
  if (page !== undefined) queryParams.append('page', page);
  if (size !== undefined) queryParams.append('size', size);
  if (location !== undefined) queryParams.append('location', location);

  const url = `${ENDPOINTS.STORIES}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const fetchResponse = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
    status: fetchResponse.status,
  };
}

/**
 * Fetches a single story by its ID.
 */
export async function getStoryById(id) {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return { error: true, message: 'Access token not found', ok: false, status: 401 };
  }

  const fetchResponse = await fetch(ENDPOINTS.STORY_DETAIL(id), {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
    status: fetchResponse.status,
  };
}

/**
 * Adds a new story with authentication.
 */
export async function addNewStory(formData) {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return { error: true, message: 'Access token not found', ok: false, status: 401 };
  }

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', ENDPOINTS.STORIES, true);
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);

    xhr.onload = function () {
      let jsonResponse = {};
      try {
        jsonResponse = JSON.parse(xhr.responseText);
      } catch (e) {
        resolve({
          error: true,
          message: `Error: Respons server tidak valid atau bukan JSON. Status: ${xhr.status}`,
          ok: false,
          status: xhr.status
        });
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ ...jsonResponse, ok: true, status: xhr.status });
      } else {
        resolve({ ...jsonResponse, ok: false, status: xhr.status });
      }
    };

    xhr.onerror = function () {
      resolve({
        error: true,
        message: 'Error jaringan atau permintaan XHR gagal total.',
        ok: false,
        status: xhr.status
      });
    };

    xhr.send(formData);
  });
}

/**
 * Adds a new story as a guest (without authentication).
 */
export async function addNewStoryGuest(formData) {
  const fetchResponse = await fetch(ENDPOINTS.STORIES_GUEST, {
    method: 'POST',
    body: formData,
  });
  let json;
  try {
    json = await fetchResponse.json();
  } catch (error) {
    const textResponse = await fetchResponse.text();
    return {
      error: true,
      message: `Error server atau format respons tidak dikenal. Status: ${fetchResponse.status}. Respons: ${textResponse.substring(0,200)}`,
      ok: false,
      status: fetchResponse.status
    };
  }

  return {
    ...json,
    ok: fetchResponse.ok,
    status: fetchResponse.status,
  };
}

export async function subscribePushNotification({ endpoint, keys }) {
  const token = getAccessToken(); // GUNAKAN getAccessToken()
  if (!token) {
    return { error: true, message: 'Access token not found', ok: false, status: 401 };
  }
  const response = await fetch(ENDPOINTS.SUBSCRIBE_NOTIFICATIONS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ endpoint, keys }),
  });
  return response.json();
}

export async function unsubscribePushNotification({ endpoint }) {
  const token = getAccessToken(); // GUNAKAN getAccessToken()
  if (!token) {
    return { error: true, message: 'Access token not found', ok: false, status: 401 };
  }
  const response = await fetch(ENDPOINTS.SUBSCRIBE_NOTIFICATIONS, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ endpoint }),
  });
  return response.json();
}