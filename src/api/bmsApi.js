export function isGasHosted() {
  return (
    typeof window !== 'undefined' &&
    typeof window.google !== 'undefined' &&
    window.google.script &&
    window.google.script.run
  );
}

export function gasRun(functionName, ...args) {
  return new Promise((resolve, reject) => {
    if (!isGasHosted()) {
      reject(new Error('현재 환경에서는 google.script.run을 사용할 수 없습니다.'));
      return;
    }

    const runner = window.google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject);

    runner[functionName](...args);
  });
} 