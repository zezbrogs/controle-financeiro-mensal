export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) {
    return;
  }

  window.addEventListener('load', () => {
    const serviceWorkerUrl = new URL(`${import.meta.env.BASE_URL}sw.js`, window.location.href);

    navigator.serviceWorker
      .register(serviceWorkerUrl)
      .then((registration) => registration.update())
      .catch(() => {
        // The app still works normally if the browser blocks service workers.
      });
  });
}
