// ===== DOM STUB MINIMAL për SSR smoke test =====
// App-i punon VETËM në browser — ky stub i dhën atij mjaftuesit (router, DOM bazë)
// që renderimi server-side të mund ta testojë kodin. S'e cakton globalThis.window
// që Analytics i Firebase të mbetet i çaktivizuar (guard-i te firebase.js).
if (typeof globalThis.document === 'undefined') {
  const location = {
    pathname: '/',
    search: '',
    hash: '',
    href: 'http://localhost/',
    origin: 'http://localhost',
    protocol: 'http:',
    host: 'localhost',
    toString() { return this.href; },
  };

  globalThis.location = location;
  globalThis.history = { state: null, pushState() {}, replaceState() {}, go() {}, back() {}, forward() {} };
  globalThis.addEventListener = () => {};
  globalThis.removeEventListener = () => {};
  globalThis.matchMedia = () => ({ matches: false, media: '', addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } });
  globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);

  // Shënim: navigator-i i Node-it (21+) mjafton — s'ka geolocation/share/clipboard,
  // dhe kodi i app-it ka gardha për çdo gjë (typeof navigator !== 'undefined' etj.)

  globalThis.document = {
    defaultView: globalThis, // router-i merr "window" nga këtu
    location,
    documentElement: { style: {}, setAttribute() {}, getAttribute: () => null },
    body: { style: {}, appendChild() {}, removeChild() {} },
    head: { appendChild() {}, removeChild() {} },
    createElement: () => ({ style: {}, setAttribute() {}, getAttribute: () => null, appendChild() {}, removeChild() {}, addEventListener() {}, removeEventListener() {}, getContext: () => null }),
    createTextNode: () => ({}),
    createComment: () => ({}),
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    cookie: '',
  };

}
