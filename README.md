# BetterGPT

[English](#english) | [Русский](#русский)

---

## English

**BetterGPT** is a browser extension that bypasses ChatGPT attachment limits (such as the free tier quota) by handling file opening, code extraction, and image recognition directly in the browser and via ultra-fast Vision-Language (VL) APIs (Groq **Qwen 3.8 27B** and Google **Gemini**).

### Features

- **Native JS File Opening:** Reads text, scripts, and code files (`.txt`, `.py`, `.js`, `.ts`, `.json`, `.csv`, `.md`, `.html`, `.cpp`, `.rs`, `.go`, etc.) instantly inside the browser using standard JavaScript APIs (`FileReader` / `file.text()`). Instant 0ms latency, zero API token cost, and 100% exact code preservation.
- **Custom Prompt Injection:** Automatically wraps attached files and recognition outputs with a configurable prompt instruction before sending, directing the model to use the attached file as context.
- **No Attachment Quota Usage:** Multimedia files (images and screenshots) are processed via free tiers of Groq Qwen 3.8 / Gemini and injected into the prompt as text without consuming ChatGPT's upload quota.
- **Main-World `Ctrl + V` & Drop Interception:** Intercepts clipboard paste and drag-and-drop actions before ChatGPT's React event listeners can trigger the *"Attachments unavailable"* warning banner.
- **Zero Input Bloat:** No bulky chips or resizing bars inside the chat composer. Only a discrete 28x28 px icon is added next to the upload button.
- **Floating Corner Toast:** Non-intrusive status notifications in the corner of the browser window (`Processing...` → `Ready`).
- **DOM Context Folding:** Injected file contents and OCR results are neatly collapsed into a small `<details>` spoiler or hidden completely in the chat view, so only your own question is visible.
- **Multi-Provider Support:** Switch between Groq (`qwen/qwen3.8-27b` on LPU hardware with sub-second speeds) and Google Gemini (`gemini-3.5-flash-lite`).

### Installation

1. Clone or download this repository to a folder on your computer (e.g., `better-gpt`).
2. Open your browser and navigate to:
   ```text
   chrome://extensions/
   ```
3. Enable **Developer mode** using the toggle switch in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the `better-gpt` directory.
6. Click the extension icon in your toolbar to configure:
   - Choose your provider (**Groq** or **Google Gemini**).
   - Enter your API key (get a free key from [Groq Console](https://console.groq.com) or [Google AI Studio](https://aistudio.google.com)).
   - Set prompt injection, confirmation, and display preferences.
7. Open or refresh [chatgpt.com](https://chatgpt.com).

### Usage

- **Code & Text Files:** Drag and drop or pick any `.py`, `.txt`, `.js`, `.json`, etc. file. It is read instantly via JavaScript and formatted for ChatGPT.
- **Clipboard Paste:** Press `Ctrl + V` with any copied image or screenshot. It will be intercepted and processed automatically.
- **File Upload:** Click the small `⚡` button next to the `+` button in the chat input to pick any file.
- **Prompt:** Type your question as usual (e.g. *"What does this code do?"* or *"What is shown in this picture?"*) and press Enter.


### We shouldn't have to pay for basic features.
---

## Русский

**BetterGPT** — расширение для браузера, позволяющее полностью обходить лимиты ChatGPT на вложения файлов за счёт локального чтения кода и текстов встроенными средствами JavaScript, а также мгновенного распознавания изображений через бесплатные API (Groq **Qwen 3.8 27B** и Google **Gemini**).

### Возможности

- **Встроенное чтение файлов в JS:** Текстовые файлы и исходный код (`.txt`, `.py`, `.js`, `.ts`, `.json`, `.csv`, `.md`, `.html`, `.cpp`, `.rs`, `.go` и др.) считываются мгновенно прямо в браузере через стандартные интерфейсы JavaScript (`FileReader` / `file.text()`). Задержка 0 мс, расход токенов API равен нулю, исходный код передается со 100% точностью.
- **Настраиваемый промпт-инжект:** Автоматическое внедрение настраиваемой инструкции перед содержимым файла, указывающей модели изучить прикрепленный контекст перед ответом.
- **Обход лимитов вложений:** Изображения и скриншоты распознаются через бесплатные API Groq Qwen 3.8 / Gemini и передаются в текстовом виде. Квота на 3 вложения ChatGPT не расходуется.
- **Перехват `Ctrl + V` и Drag & Drop в главном мире:** Перехватывает вставку файлов и скриншотов из буфера обмена и перетаскивание мыши до того, как React на сайте ChatGPT успеет выдать предупреждение *"Вложения недоступны"*.
- **Чистая строка ввода:** Никаких громоздких плашек и списков в строке чата. Поле ввода сохраняет свою полную ширину, а рядом с плюсиком добавлена лишь аккуратная иконка 28x28 px.
- **Плавающий статус в углу экрана:** Ненавязчивые toast-уведомления в правом нижнем углу экрана (`Распознавание...` → `Готово`).
- **Скрытие в DOM:** Внедренный код и OCR-описание в истории чата сворачиваются в компактный спойлер или полностью скрываются, оставляя только ваш вопрос.
- **Мульти-провайдер:** Переключение между Groq (`qwen/qwen3.8-27b` на сверхбыстрых процессорах LPU) и Google Gemini (`gemini-3.5-flash-lite`).

### Установка

1. Скачайте или клонируйте репозиторий в отдельную папку (например, `better-gpt`).
2. Откройте страницу управления расширениями в браузере:
   ```text
   chrome://extensions/
   ```
3. В правом верхнем углу включите тумблер **«Режим разработчика»** (Developer mode).
4. Нажмите кнопку **«Загрузить распакованное»** (Load unpacked) в верхнем левом углу.
5. Выберите папку `better-gpt`.
6. Откройте окно расширения в панели браузера для настройки:
   - Выберите провайдера (**Groq** или **Google Gemini**).
   - Укажите API-ключ (бесплатно без карты в [Groq Console](https://console.groq.com) или [Google AI Studio](https://aistudio.google.com)).
   - Настройте текст промпт-инжекта, подтверждение и режим отображения.
7. Откройте или обновите вкладку [chatgpt.com](https://chatgpt.com).




### Использование

- **Код и документы:** Перетащите мышью или выберите файл (`.py`, `.txt`, `.json` и т.д.) — встроенный JS моментально считает его без расхода API.
- **Вставка из буфера:** Скопируйте скриншот (`Win + Shift + S`) и нажмите `Ctrl + V` в ChatGPT — файл перехватится и распознается автоматически.
- **Выбор файла:** Нажмите на иконку `⚡` рядом с кнопкой «+» для выбора любого файла с диска.
- **Отправка:** Введите ваш вопрос (например, *"Разбери этот код"* или *"Что на фото?"*) и нажмите Enter.

### Мы не должны платить за базовые функции.
