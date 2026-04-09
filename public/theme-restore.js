// Restore persisted theme CSS variables before React mounts to prevent
// the default-colour flash on the loading screen. The 'nk-theme-cache'
// key is written by use-app-theme.ts whenever the admin theme is applied.
// This is strictly-necessary functional data; no consent is required.
try {
  var _t = localStorage.getItem('nk-theme-cache');
  if (_t) {
    var _vars = JSON.parse(_t);
    var _root = document.documentElement;
    for (var _k in _vars) { _root.style.setProperty(_k, _vars[_k]); }
  }
} catch(e) { /* ignore – private browsing or parse error */ }
