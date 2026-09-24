const DEFAULT_GROQ_MODEL = 'qwen/qwen3.8-27b';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ANALYZE_FILE') {
    handleFileProcessing(request.fileData)
      .then(analysisText => sendResponse({ success: true, text: analysisText }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function handleFileProcessing(fileData) {
  const settings = await chrome.storage.local.get([
    'activeProvider',
    'groqApiKey',
    'groqModel',
    'geminiApiKey',
    'geminiModel'
  ]);

  const provider = settings.activeProvider || 'groq';
  return provider === 'groq'
    ? processWithGroq(fileData, settings)
    : processWithGemini(fileData, settings);
}

async function processWithGroq(fileData, settings) {
  const apiKey = settings.groqApiKey;
  const model = settings.groqModel || DEFAULT_GROQ_MODEL;

  if (!apiKey) {
    throw new Error('Groq API Key is not set');
  }

  const systemPrompt = `Ты — сверхбыстрый модуль визуального распознавания. Выдай лаконичный factual-контекст без вводных фраз и воды:
1. Название игры/программы/сцены/документа.
2. Ключевые объекты и их суть.
3. Точный OCR всего текста, чисел, формул или цен.
Отвечай структурированно и кратко на русском языке.`;

  const userContent = fileData.textContent !== undefined
    ? `${systemPrompt}\n\nФайл "${fileData.name}":\n\`\`\`\n${fileData.textContent}\n\`\`\``
    : [
        { type: 'text', text: systemPrompt },
        {
          type: 'image_url',
          image_url: {
            url: `data:${fileData.type || 'image/png'};base64,${fileData.base64}`
          }
        }
      ];

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: userContent }],
      max_tokens: 600,
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Groq error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('Groq returned empty response');
  }

  return text.trim();
}

async function processWithGemini(fileData, settings) {
  const apiKey = settings.geminiApiKey;
  const model = settings.geminiModel || 'gemini-3.5-flash-lite';

  if (!apiKey) {
    throw new Error('Gemini API Key is not set');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const promptText = `Сверхбыстрый визуальный анализ файла "${fileData.name}". Без вводных слов: 1. Контекст/сцена. 2. Объекты. 3. Полный OCR текста/чисел/кода.`;

  const contents = fileData.textContent !== undefined
    ? [{ parts: [{ text: `${promptText}\n\nФайл "${fileData.name}":\n\`\`\`\n${fileData.textContent}\n\`\`\`` }] }]
    : [
        {
          parts: [
            { text: promptText },
            {
              inline_data: {
                mime_type: fileData.type || 'application/octet-stream',
                data: fileData.base64
              }
            }
          ]
        }
      ];

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        maxOutputTokens: 600,
        temperature: 0.1
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gemini API error: ${response.statusText}`);
  }

  const result = await response.json();
  const outputText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!outputText) {
    throw new Error('Gemini returned empty response');
  }

  return outputText.trim();
}
