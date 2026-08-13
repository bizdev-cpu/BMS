import { useEffect, useRef, useState } from 'react';

import { verifyGoogleLogin } from '../api/bmsApi';

export default function Login({ onLogin }) {
  const buttonRef = useRef(null);

  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (!window.google || !buttonRef.current) {
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
  }, [onLogin]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-[400px] rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">
          BMS
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Google 계정으로 로그인해주세요.
        </p>

        <div
          ref={buttonRef}
          className="mt-6"
        />

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