const API_URL = import.meta.env.VITE_BMS_API_URL;
let authIdToken = null;

export function setAuthIdToken(idToken) {
  authIdToken = idToken;
}


function getApiUrl() {
  if (!API_URL) {
    throw new Error(
      'VITE_BMS_API_URL이 없습니다. .env 파일을 확인하세요.',
    );
  }

  return API_URL;
}

async function parseResponse(response) {
  if (!response.ok) {
    throw new Error(`HTTP 오류: ${response.status}`);
  }

  const result = await response.json();

  if (result.status !== 'success') {
    throw new Error(result.message || 'BMS API 요청에 실패했습니다.');
  }

  return result.data;
}

export async function readAllData() {
  const apiUrl = getApiUrl();

  const response = await fetch(`${apiUrl}?action=readAll`, {
    method: 'GET',
    redirect: 'follow',
    cache: 'no-store',
  });

  return parseResponse(response);
}

export async function readAllIntegratedData() {
  return gasRun('apiReadAllIntegrated');
}

export async function executeBmsAction(action, payload = {}) {
  if (!action) {
    throw new Error('실행할 action이 필요합니다.');
  }

  const apiUrl = getApiUrl();

  const response = await fetch(apiUrl, {
    method: 'POST',
    redirect: 'follow',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      action,
      payload,
    }),
  });

  return parseResponse(response);
}

export async function readKdtChangeReport() {
  const apiUrl = getApiUrl();

  const response = await fetch(
    `${apiUrl}?action=readKdtChangeReport`,
    {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
    },
  );

  return parseResponse(response);
}

export async function createKdtSnapshot() {
  return executeBmsAction('kdtSnapshot');
}

export async function getSheetConfig() {
  const apiUrl = getApiUrl();

  const response = await fetch(
    `${apiUrl}?action=getSheetConfig`,
    {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
    },
  );

  return parseResponse(response);
}

export async function saveSheetConfig(payload) {
  return executeBmsAction(
    'saveSheetConfig',
    payload,
  );
}


export async function gasRun(functionName, ...args) {
  const idToken =
    authIdToken ||
    sessionStorage.getItem('bmsIdToken');

  const response = await fetch(API_URL, {
    method: 'POST',

    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },

    body: JSON.stringify({
      action: 'gasRun',
      functionName,
      args,
      idToken,
    }),
  });

  return parseResponse(response);
}


export async function getCurrentUser() {
  const apiUrl = getApiUrl();

  const response = await fetch(
    `${apiUrl}?action=getCurrentUser`,
    {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
    },
  );

  return parseResponse(response);
}

export async function verifyGoogleLogin(idToken) {
  return executeBmsAction('verifyGoogleLogin', {
    idToken,
  });
}