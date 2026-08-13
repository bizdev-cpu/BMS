import { useEffect, useRef, useState } from 'react';

import { verifyGoogleLogin } from '../api/bmsApi';

export default function Login({ onLogin, onSheetsAccess, isGoogleLoggedIn }) {
  const buttonRef = useRef(null);

  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const requestSheetsAccess = () => {
    const tokenClient =
        window.google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,

        scope:
            'https://www.googleapis.com/auth/spreadsheets.readonly',

        callback: (tokenResponse) => {
            if (tokenResponse.error) {
            console.error(
                'Sheets 권한 요청 실패:',
                tokenResponse,
            );

            setError('Google Sheets 권한을 가져오지 못했습니다.');
            return;
            }

            const accessToken = tokenResponse.access_token;

            console.log('Sheets Access Token 발급 성공');

            // App.jsx로 전달
            onSheetsAccess(accessToken);
        },
        });

    tokenClient.requestAccessToken();
    };

  useEffect(() => {
    if (isGoogleLoggedIn || !window.google || !buttonRef.current) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,

      callback: async (response) => {
        try {
          setIsLoggingIn(true);
          setError('');

          // Google이 발급한 ID Token
          const idToken = response.credential;

          // Apps Script에서 토큰 검증
          const user = await verifyGoogleLogin(idToken);

          console.log('인증된 사용자:', user);

          // 서버 검증 성공한 경우에만 로그인 처리
          onLogin({
            idToken,
            user,
          });
        } catch (error) {
          console.error('Google 로그인 검증 실패:', error);

          setError(
            error instanceof Error
              ? error.message
              : '로그인에 실패했습니다.',
          );
        } finally {
          setIsLoggingIn(false);
        }
      },
    });

    window.google.accounts.id.renderButton(
      buttonRef.current,
      {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
      },
    );
  }, [onLogin, isGoogleLoggedIn]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-[400px] rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">
          BMS
        </h1>

        {isGoogleLoggedIn && (
        <>
            <div className="mt-6 rounded-lg bg-emerald-50 p-3">
            <p className="text-sm font-bold text-emerald-700">
                ✓ Google 로그인 완료
            </p>

            <p className="mt-1 text-xs text-emerald-600">
                BMS에서 사용할 Google Sheets 접근 권한을 허용해주세요.
            </p>
            </div>

            <button
            type="button"
            onClick={requestSheetsAccess}
            className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
            >
            Google Sheets 접근 권한 허용
            </button>
        </>
        )}

        {!isGoogleLoggedIn && (
        <div
            ref={buttonRef}
            className="mt-6"
        />
        )}

        {isLoggingIn && (
          <p className="mt-4 text-sm text-slate-500">
            로그인 정보를 확인하고 있습니다.
          </p>
        )}

        {error && (
          <p className="mt-4 text-sm text-rose-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}