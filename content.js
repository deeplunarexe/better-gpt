const MARKER_START = '[[[GEMINI_ATTACHMENT_START]]]';
const MARKER_SPLIT = '[[[GEMINI_CONTENT_SEPARATOR]]]';
const MARKER_END = '[[[GEMINI_ATTACHMENT_END]]]';

const DEFAULT_PROMPT_INJECT = 'Внимание модели: используй содержимое прикрепленного файла выше как контекст для ответа на следующий вопрос пользователя.';

let currentAttachment = null;
let isAnalyzing = false;
let sendPending = false;
let pendingUserQuestion = '';
let pendingConfirmData = null;

let cachedPromptInject = DEFAULT_PROMPT_INJECT;
let cachedDisplayMode = 'spoiler';

function refreshCachedSettings() {
  chrome.storage.local.get(['customPromptInject', 'geminiDisplayMode', 'interceptPaste'], (data) => {
    if (data.customPromptInject && data.customPromptInject.trim()) {
      cachedPromptInject = data.customPromptInject.trim();
    } else {
      cachedPromptInject = DEFAULT_PROMPT_INJECT;
    }
    if (data.geminiDisplayMode) cachedDisplayMode = data.geminiDisplayMode;
    const shouldIntercept = data.interceptPaste !== undefined ? data.interceptPaste : true;
    document.documentElement.dataset.vlIntercept = shouldIntercept ? 'true' : 'false';
  });
}

refreshCachedSettings();
chrome.storage.onChanged.addListener(refreshCachedSettings);

function removeLegacyBloat() {
  const bloatSelectors = [
    '#gemini-file-chip',
    '#gemini-bridge-container',
    '#gemini-bridge-btn',
    '#vl-attachment-preview-container',
    '.gemini-file-chip',
    '.vl-chip'
  ];
  bloatSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => el.remove());
  });
}

function handleIncomingData(fileData) {
  if (!fileData) return;

  chrome.storage.local.get(['confirmBeforeUpload'], (settings) => {
    if (settings.confirmBeforeUpload === true) {
      pendingConfirmData = fileData;
      showConfirmBubble(fileData.name);
    } else {
      processFileData(fileData);
    }
  });
}

window.addEventListener('VL_BRIDGE_FILE_INTERCEPTED', (e) => handleIncomingData(e.detail));
window.addEventListener('VL_BRIDGE_IMAGE_INTERCEPTED', (e) => handleIncomingData(e.detail));

function injectUI() {
  removeLegacyBloat();

  const promptTextarea = document.querySelector('#prompt-textarea');
  if (!promptTextarea) return;

  const form = promptTextarea.closest('form');
  if (!form) return;

  let confirmBubble = document.getElementById('vl-confirm-bubble');
  if (!confirmBubble) {
    confirmBubble = document.createElement('div');
    confirmBubble.id = 'vl-confirm-bubble';
    confirmBubble.style.display = 'none';
    confirmBubble.innerHTML = `
      <div class="vl-confirm-content">
        <span class="vl-confirm-title" id="vl-confirm-file-title">⚡ Прикрепить файл?</span>
        <span class="vl-confirm-sub">Передать в ChatGPT без расхода лимитов вложений</span>
        <div class="vl-confirm-actions">
          <button type="button" id="vl-confirm-btn-yes" class="vl-btn-primary">Прикрепить</button>
          <button type="button" id="vl-confirm-btn-no" class="vl-btn-secondary">Отмена</button>
        </div>
      </div>
    `;

    document.body.appendChild(confirmBubble);

    document.getElementById('vl-confirm-btn-yes').addEventListener('click', () => {
      confirmBubble.style.display = 'none';
      if (pendingConfirmData) {
        processFileData(pendingConfirmData);
        pendingConfirmData = null;
      }
    });

    document.getElementById('vl-confirm-btn-no').addEventListener('click', () => {
      confirmBubble.style.display = 'none';
      pendingConfirmData = null;
    });
  }

  if (!document.getElementById('vl-upload-btn')) {
    const bottomBar = form.querySelector('div.flex.items-center.justify-between') ||
                      form.querySelector('div.flex.items-center') || form;

    const btn = document.createElement('button');
    btn.id = 'vl-upload-btn';
    btn.type = 'button';
    btn.title = 'Прикрепить файл или фото без лимитов ChatGPT';
    btn.innerHTML = `
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
      </svg>
    `;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'vl-hidden-file-input';
    fileInput.accept = '*/*';
    fileInput.style.display = 'none';

    btn.addEventListener('click', () => {
      if (!isAnalyzing) fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const isText = isTextFile(file);
      if (isText) {
        const text = await file.text();
        handleIncomingData({ name: file.name, type: file.type, textContent: text, isText: true });
      } else {
        const buffer = await file.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        handleIncomingData({ name: file.name, type: file.type, base64: btoa(binary), isText: false });
      }
      fileInput.value = '';
    });

    const plusButton = bottomBar.querySelector('button[aria-label*="вложить"], button[aria-label*="Attach"], button[data-testid*="attachment"]') ||
                       bottomBar.querySelector('button');

    if (plusButton && plusButton.nextSibling) {
      plusButton.parentNode.insertBefore(btn, plusButton.nextSibling);
    } else {
      bottomBar.insertBefore(btn, bottomBar.firstChild);
    }

    bottomBar.appendChild(fileInput);
  }
}

function isTextFile(file) {
  if (!file) return false;
  const extRegex = /\.(txt|py|js|ts|jsx|tsx|json|csv|md|html|css|cpp|c|h|hpp|rs|go|java|sh|bash|bat|ps1|yml|yaml|xml|sql|log|ini|env|toml)$/i;
  return file.type.startsWith('text/') ||
         file.type === 'application/json' ||
         file.type === 'application/javascript' ||
         extRegex.test(file.name || '');
}

function showConfirmBubble(fileName) {
  const bubble = document.getElementById('vl-confirm-bubble');
  const title = document.getElementById('vl-confirm-file-title');
  const textarea = document.querySelector('#prompt-textarea');
  if (!bubble || !textarea) return;

  if (title && fileName) {
    const short = fileName.length > 20 ? fileName.slice(0, 18) + '…' : fileName;
    title.textContent = `⚡ Прикрепить "${short}"?`;
  }

  const rect = textarea.getBoundingClientRect();
  bubble.style.top = `${Math.max(10, rect.top + window.scrollY - 100)}px`;
  bubble.style.left = `${Math.max(20, rect.left + window.scrollX + 10)}px`;
  bubble.style.display = 'block';
}

function showFloatingToast(text, status) {
  let toast = document.getElementById('vl-floating-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'vl-floating-toast';
    document.body.appendChild(toast);
  }

  toast.className = status;
  toast.innerHTML = `
    <span>${text}</span>
    <button type="button" id="vl-toast-close" title="Отменить">&times;</button>
  `;
  toast.style.display = 'flex';

  document.getElementById('vl-toast-close').onclick = () => {
    currentAttachment = null;
    isAnalyzing = false;
    sendPending = false;
    pendingUserQuestion = '';
    toast.style.display = 'none';
    const btn = document.getElementById('vl-upload-btn');
    if (btn) btn.classList.remove('attached', 'loading');
  };
}

function hideFloatingToast() {
  const toast = document.getElementById('vl-floating-toast');
  if (toast) toast.style.display = 'none';
}

function setEditorText(textarea, text) {
  textarea.focus();
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(textarea);
  selection.removeAllRanges();
  selection.addRange(range);

  let success = false;
  try {
    success = document.execCommand('insertText', false, text);
  } catch (e) {}

  if (!success) {
    textarea.textContent = text;
  }

  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));
}

function clickSendButton() {
  setTimeout(() => {
    const sendBtn = document.querySelector('button[data-testid="send-button"]') ||
                    document.querySelector('button[aria-label="Send prompt"]') ||
                    document.querySelector('button[aria-label*="Отправить"]');
    if (sendBtn && !sendBtn.disabled) {
      sendBtn.click();
    } else {
      const textarea = document.querySelector('#prompt-textarea');
      if (textarea) {
        textarea.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true
        }));
      }
    }
  }, 40);
}

function executeSendWithAttachment(attachment, questionText) {
  const textarea = document.querySelector('#prompt-textarea');
  if (!textarea) return;

  const payload = `\n${MARKER_START}\n${attachment.name}\n${MARKER_SPLIT}\n${attachment.content}\n\n${cachedPromptInject}\n${MARKER_END}\n\n`;
  const fullText = payload + (questionText || 'Что на этом изображении?');

  currentAttachment = null;
  isAnalyzing = false;
  sendPending = false;
  pendingUserQuestion = '';

  hideFloatingToast();
  const btn = document.getElementById('vl-upload-btn');
  if (btn) btn.classList.remove('attached', 'loading');

  setEditorText(textarea, fullText);
  clickSendButton();
}

function processFileData(fileData) {
  const btn = document.getElementById('vl-upload-btn');

  if (fileData.isText) {
    const ext = (fileData.name.split('.').pop() || '').toLowerCase();
    const formattedContent = `\`\`\`${ext}\n${fileData.textContent}\n\`\`\``;

    currentAttachment = {
      name: fileData.name,
      content: formattedContent
    };

    if (sendPending) {
      executeSendWithAttachment(currentAttachment, pendingUserQuestion);
      return;
    }

    if (btn) {
      btn.classList.remove('loading');
      btn.classList.add('attached');
    }
    showFloatingToast(`✓ Файл "${fileData.name}" готов к отправке!`, 'ready');
    return;
  }

  isAnalyzing = true;
  if (btn) {
    btn.classList.add('loading');
    btn.classList.remove('attached');
  }

  showFloatingToast('⚡ Распознавание скриншота через Qwen...', 'loading');

  chrome.runtime.sendMessage({ action: 'ANALYZE_FILE', fileData }, (response) => {
    isAnalyzing = false;
    if (btn) btn.classList.remove('loading');

    if (response && response.success) {
      currentAttachment = {
        name: fileData.name,
        content: response.text
      };

      if (sendPending) {
        executeSendWithAttachment(currentAttachment, pendingUserQuestion);
        return;
      }

      if (btn) btn.classList.add('attached');
      showFloatingToast('✓ Фото распознано! Пишите вопрос и жмите Enter', 'ready');
    } else {
      currentAttachment = null;
      sendPending = false;
      pendingUserQuestion = '';
      hideFloatingToast();
      alert('Ошибка анализа: ' + (response?.error || 'Неизвестная ошибка'));
    }
  });
}

function setupSubmissionInterceptor() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const textarea = document.querySelector('#prompt-textarea');
      if (e.target && (e.target === textarea || textarea?.contains(e.target))) {
        if (isAnalyzing) {
          e.preventDefault();
          e.stopImmediatePropagation();
          sendPending = true;
          pendingUserQuestion = (textarea.innerText || textarea.value || '').trim();
          showFloatingToast('⏳ Дождитесь распознавания (доли секунды)...', 'loading');
          return;
        }

        if (currentAttachment) {
          e.preventDefault();
          e.stopImmediatePropagation();
          const question = (textarea.innerText || textarea.value || '').trim();
          executeSendWithAttachment(currentAttachment, question);
        }
      }
    }
  }, true);

  document.addEventListener('click', (e) => {
    const sendBtn = e.target.closest('button[data-testid="send-button"]') ||
                    e.target.closest('button[aria-label="Send prompt"]') ||
                    e.target.closest('button[aria-label*="Отправить"]');
    if (sendBtn) {
      const textarea = document.querySelector('#prompt-textarea');
      if (isAnalyzing) {
        e.preventDefault();
        e.stopImmediatePropagation();
        sendPending = true;
        if (textarea) pendingUserQuestion = (textarea.innerText || textarea.value || '').trim();
        showFloatingToast('⏳ Дождитесь распознавания (доли секунды)...', 'loading');
        return;
      }

      if (currentAttachment) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const question = textarea ? (textarea.innerText || textarea.value || '').trim() : '';
        executeSendWithAttachment(currentAttachment, question);
      }
    }
  }, true);
}

async function cleanContextInDOM() {
  const userMessages = document.querySelectorAll('[data-message-author-role="user"]');

  userMessages.forEach(msg => {
    if (msg.dataset.vlCleaned === 'true') return;

    const text = msg.innerHTML;
    if (text.includes(MARKER_START) && text.includes(MARKER_END)) {
      msg.dataset.vlCleaned = 'true';

      const regex = new RegExp(
        escapeRegex(MARKER_START) + '\\s*([\\s\\S]*?)\\s*' +
        escapeRegex(MARKER_SPLIT) + '\\s*([\\s\\S]*?)\\s*' +
        escapeRegex(MARKER_END),
        'g'
      );

      msg.innerHTML = text.replace(regex, (match, fileName, analysisText) => {
        if (cachedDisplayMode === 'hidden') {
          return `
            <div class="vl-injected-badge" title="Контекст файла внедрен без лимитов ChatGPT">
              📎 <i>Вложение: ${escapeHtml(fileName.trim())}</i>
            </div>
          `;
        }
        return `
          <details class="vl-collapsed-block">
            <summary>📎 <b>${escapeHtml(fileName.trim())}</b> (BetterGPT вложение)</summary>
            <div class="vl-collapsed-content">
              <pre>${escapeHtml(analysisText.trim())}</pre>
            </div>
          </details>
        `;
      });
    }
  });
}

function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return str.replace(/[&<>"']/g, m => map[m]);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

setupSubmissionInterceptor();

const observer = new MutationObserver(() => {
  injectUI();
  cleanContextInDOM();
});

observer.observe(document.body, { childList: true, subtree: true });
