import { useEffect, useRef } from 'react';

export default function Login({ onLogin }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!window.google || !buttonRef.current) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,

      callback: (response) => {
        console.log('Google credential:', response.credential);

        onLogin(response.credential);
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
      </div>
    </div>
  );
}