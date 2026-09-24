(function() {
  const TEXT_EXTENSIONS = /\.(txt|py|js|ts|jsx|tsx|json|csv|md|html|css|cpp|c|h|hpp|rs|go|java|sh|bash|bat|ps1|yml|yaml|xml|sql|log|ini|env|toml)$/i;

  function isTextFile(file) {
    if (!file) return false;
    return file.type.startsWith('text/') ||
           file.type === 'application/json' ||
           file.type === 'application/javascript' ||
           TEXT_EXTENSIONS.test(file.name || '');
  }

  function handleFile(file, eventName) {
    if (!file) return false;
    if (document.documentElement.dataset.vlIntercept === 'false') return false;

    if (isTextFile(file)) {
      const reader = new FileReader();
      reader.onload = function() {
        window.dispatchEvent(new CustomEvent('VL_BRIDGE_FILE_INTERCEPTED', {
          detail: {
            name: file.name || 'document.txt',
            type: file.type || 'text/plain',
            textContent: reader.result,
            isText: true,
            source: eventName
          }
        }));
      };
      reader.readAsText(file);
      return true;
    }

    if (file.type && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function() {
        const base64 = reader.result.split(',')[1];
        window.dispatchEvent(new CustomEvent('VL_BRIDGE_FILE_INTERCEPTED', {
          detail: {
            name: file.name || `screenshot_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_')}.png`,
            type: file.type || 'image/png',
            base64: base64,
            isText: false,
            source: eventName
          }
        }));
      };
      reader.readAsDataURL(file);
      return true;
    }

    return false;
  }

  window.addEventListener('paste', function(e) {
    const items = e.clipboardData?.items;
    if (!items || items.length === 0) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file && (file.type.startsWith('image/') || isTextFile(file))) {
          e.stopImmediatePropagation();
          e.preventDefault();
          handleFile(file, 'paste');
          break;
        }
      }
    }
  }, true);

  window.addEventListener('drop', function(e) {
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file && (file.type.startsWith('image/') || isTextFile(file))) {
      e.stopImmediatePropagation();
      e.preventDefault();
      handleFile(file, 'drop');
    }
  }, true);
})();
