document.addEventListener('DOMContentLoaded', () => {
  const btnGroq = document.getElementById('btn-groq');
  const btnGemini = document.getElementById('btn-gemini');
  const groqSection = document.getElementById('groq-section');
  const geminiSection = document.getElementById('gemini-section');

  const groqApiKeyInput = document.getElementById('groqApiKey');
  const groqModelSelect = document.getElementById('groqModel');
  const geminiApiKeyInput = document.getElementById('geminiApiKey');
  const geminiModelSelect = document.getElementById('geminiModel');
  const displayModeSelect = document.getElementById('displayMode');
  const saveBtn = document.getElementById('saveBtn');
  const statusEl = document.getElementById('status');

  const interceptPasteCheckbox = document.getElementById('interceptPaste');
  const confirmBeforeUploadCheckbox = document.getElementById('confirmBeforeUpload');
  const customPromptInjectInput = document.getElementById('customPromptInject');

  let activeProvider = 'groq';

  function setProvider(provider) {
    activeProvider = provider;
    const isGroq = provider === 'groq';
    btnGroq.classList.toggle('active', isGroq);
    btnGemini.classList.toggle('active', !isGroq);
    groqSection.style.display = isGroq ? 'block' : 'none';
    geminiSection.style.display = isGroq ? 'none' : 'block';
  }

  btnGroq.addEventListener('click', () => setProvider('groq'));
  btnGemini.addEventListener('click', () => setProvider('gemini'));

  chrome.storage.local.get([
    'activeProvider',
    'groqApiKey',
    'groqModel',
    'geminiApiKey',
    'geminiModel',
    'geminiDisplayMode',
    'interceptPaste',
    'confirmBeforeUpload',
    'customPromptInject'
  ], (data) => {
    setProvider(data.activeProvider || 'groq');
    groqApiKeyInput.value = data.groqApiKey || '';
    if (data.groqModel) groqModelSelect.value = data.groqModel;
    if (data.geminiApiKey) geminiApiKeyInput.value = data.geminiApiKey;
    if (data.geminiModel) geminiModelSelect.value = data.geminiModel;
    if (data.geminiDisplayMode) displayModeSelect.value = data.geminiDisplayMode;
    interceptPasteCheckbox.checked = data.interceptPaste !== undefined ? data.interceptPaste : true;
    confirmBeforeUploadCheckbox.checked = data.confirmBeforeUpload !== undefined ? data.confirmBeforeUpload : false;
    if (data.customPromptInject) customPromptInjectInput.value = data.customPromptInject;
  });

  saveBtn.addEventListener('click', () => {
    const groqKey = groqApiKeyInput.value.trim();
    const geminiKey = geminiApiKeyInput.value.trim();

    chrome.storage.local.set({
      activeProvider,
      groqApiKey: groqKey,
      groqModel: groqModelSelect.value,
      geminiApiKey: geminiKey,
      geminiModel: geminiModelSelect.value,
      geminiDisplayMode: displayModeSelect.value,
      interceptPaste: interceptPasteCheckbox.checked,
      confirmBeforeUpload: confirmBeforeUploadCheckbox.checked,
      customPromptInject: customPromptInjectInput.value.trim()
    }, () => {
      showStatus('Настройки успешно сохранены!', 'success');
      setTimeout(() => statusEl.textContent = '', 2500);
    });
  });

  function showStatus(msg, cls) {
    statusEl.textContent = msg;
    statusEl.className = cls;
  }
});
