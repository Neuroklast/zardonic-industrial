// Restore persisted theme CSS variables before React mounts to prevent
// the default-colour flash on the loading screen. The 'nk-theme-cache'
// key is written by use-app-theme.ts whenever the admin theme is applied.
// This is strictly-necessary functional data; no consent is required.
//
// On first visit (no cache), apply the DIGICE preset as the default theme so
// cold-start visitors see the correct colours from frame 0.
(function() {
  var _root = document.documentElement;
  var _supportsOklch = typeof CSS !== 'undefined' && CSS.supports('color', 'oklch(0 0 0)');

  // Static fallback: the DIGICE preset (matches AppearanceTab.tsx DIGICIDE preset).
  // hex values support legacy browsers; oklch values are used when supported.
  var _defaults = {
    '--primary':                 { hex: '#a3bcc5', oklch: 'oklch(0.78 0.03 220)' },
    '--primary-foreground':      { hex: '#afcacf', oklch: 'oklch(0.82 0.03 210)' },
    '--accent':                  { hex: '#6399a6', oklch: 'oklch(0.65 0.06 215)' },
    '--accent-foreground':       { hex: '#afcacf', oklch: 'oklch(0.82 0.03 210)' },
    '--background':              { hex: '#000000', oklch: 'oklch(0.015 0.005 240)' },
    '--foreground':              { hex: '#afcacf', oklch: 'oklch(0.82 0.03 210)' },
    '--card':                    { hex: '#000001', oklch: 'oklch(0.045 0.008 230)' },
    '--card-foreground':         { hex: '#afcacf', oklch: 'oklch(0.82 0.03 210)' },
    '--popover':                 { hex: '#000001', oklch: 'oklch(0.045 0.008 230)' },
    '--popover-foreground':      { hex: '#afcacf', oklch: 'oklch(0.82 0.03 210)' },
    '--secondary':               { hex: '#000102', oklch: 'oklch(0.07 0.01 230)' },
    '--secondary-foreground':    { hex: '#afcacf', oklch: 'oklch(0.82 0.03 210)' },
    '--muted':                   { hex: '#000102', oklch: 'oklch(0.07 0.01 230)' },
    '--muted-foreground':        { hex: '#3c4a4f', oklch: 'oklch(0.40 0.02 220)' },
    '--border':                  { hex: '#010405', oklch: 'oklch(0.10 0.01 225)' },
    '--input':                   { hex: '#010405', oklch: 'oklch(0.10 0.01 225)' },
    '--ring':                    { hex: '#a3bcc5', oklch: 'oklch(0.78 0.03 220)' },
    '--destructive':             { hex: '#a10128', oklch: 'oklch(0.45 0.18 20)' },
    '--destructive-foreground':  { hex: '#afcacf', oklch: 'oklch(0.82 0.03 210)' },
    '--accent-r':                '99',
    '--accent-g':                '153',
    '--accent-b':                '166',
    '--spotify-hue-rotate':      '79deg',
    '--font-heading':            "'Orbitron', sans-serif",
    '--font-body':               "'Share Tech Mono', monospace",
    '--font-mono':               "'Share Tech Mono', monospace",
  };

  function _resolveColor(value) {
    if (value && typeof value === 'object' && ('hex' in value || 'oklch' in value)) {
      return _supportsOklch ? value.oklch : value.hex;
    }
    return value;
  }

  var _dk = Object.keys(_defaults);
  for (var _di = 0; _di < _dk.length; _di++) {
    _root.style.setProperty(_dk[_di], _resolveColor(_defaults[_dk[_di]]));
  }

  // Override with persisted values from a previous visit (return visitors
  // get their exact admin-configured theme applied atomically).
  try {
    var _t = localStorage.getItem('nk-theme-cache');
    if (_t) {
      var _vars = JSON.parse(_t);
      if (_vars && typeof _vars === 'object') {
        var _keys = Object.keys(_vars);
        for (var _i = 0; _i < _keys.length; _i++) {
          var _key = _keys[_i];
          var _val = _vars[_key];
          // Skip oklch cached colors on legacy browsers — keep stylesheet / default hex values.
          if (!_supportsOklch && typeof _val === 'string' && _val.indexOf('oklch') === 0) {
            continue;
          }
          _root.style.setProperty(_key, _val);
        }

        // Preload custom Google Fonts as early as possible so fonts are
        // available before React mounts, preventing a Flash of Unstyled Text
        // (FOUT) where the browser briefly renders the fallback font.
        var _systemFonts = new Set([
          'system-ui','ui-monospace','ui-sans-serif','ui-serif',
          'monospace','sans-serif','serif','cursive','fantasy',
          'SFMono-Regular','Menlo','Monaco','Consolas','Courier New',
          'Georgia','Cambria','Times New Roman','Times','Arial',
          'Helvetica Neue','Helvetica','Share Tech Mono','Orbitron'
        ]);
        var _preloadedFonts = new Set();
        var _fontVarKeys = ['--font-body', '--font-heading', '--font-mono'];
        for (var _fi = 0; _fi < _fontVarKeys.length; _fi++) {
          var _fv = _vars[_fontVarKeys[_fi]];
          if (!_fv) continue;
          // Extract the first font name from a CSS font stack like "'Rajdhani', sans-serif"
          var _fname = _fv.replace(/['"]/g, '').split(',')[0].trim();
          if (!_fname || _systemFonts.has(_fname) || _preloadedFonts.has(_fname)) continue;
          _preloadedFonts.add(_fname);
          var _link = document.createElement('link');
          _link.rel = 'stylesheet';
          _link.href = 'https://fonts.googleapis.com/css2?family=' + _fname.replace(/ /g, '+') + ':wght@300;400;500;700;900&display=swap';
          document.head.appendChild(_link);
        }
      }
    }
  } catch(e) { /* ignore – private browsing or parse error */ }
})();

// Restore the loader type so the correct loading screen variant renders
// from the very first React frame, preventing a flash of the default loader.
// The 'nk-loader-type' key is written by App.tsx when KV settings arrive.
// Default to 'minimal-bar' when no persisted value exists (lightweight, no FOUC).
try {
  var _lt = localStorage.getItem('nk-loader-type') ?? 'minimal-bar';
  document.documentElement.setAttribute('data-loader-type', _lt);
} catch(e) { /* ignore */ }