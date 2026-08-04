/*
 * Interactive fish pet powered by GuppyLM.
 * GuppyLM: https://github.com/arman-bd/guppylm (MIT)
 * Model and tokenizer are fetched lazily from the project's GitHub Pages demo.
 */

const MODEL_BASE = 'https://arman-bd.github.io/guppylm';
const ORT_BASE = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/';

const MODEL_CONFIG = {
  vocabSize: 4096,
  maxSequenceLength: 128,
  eosId: 2
};

const GENERATION_CONFIG = {
  temperature: 0.7,
  topK: 50,
  maxTokens: 32
};

const state = {
  session: null,
  tokenizer: null,
  ort: null,
  loadPromise: null,
  isGenerating: false,
  bubbleTimer: null
};

const elements = {
  widget: document.querySelector('#guppyWidget'),
  toggle: document.querySelector('#guppyToggle'),
  chat: document.querySelector('#guppyChat'),
  close: document.querySelector('#guppyClose'),
  status: document.querySelector('#guppyStatus'),
  messages: document.querySelector('#guppyMessages'),
  loadingNote: document.querySelector('#guppyLoadingNote'),
  loadingText: document.querySelector('#guppyLoadingText'),
  form: document.querySelector('#guppyForm'),
  input: document.querySelector('#guppyInput'),
  send: document.querySelector('#guppySend'),
  bubbles: document.querySelector('#guppyBubbles'),
  art: document.querySelector('#guppyArt')
};

const ART_SOURCE = './assets/cats-fish.svg';
const ART_WIDTH = 280;
const ART_HEIGHT = 289;

const LEG_RECTS = [
  { x: 0, y: 232, width: 40, height: 36, phase: 0 },
  { x: 48, y: 255, width: 27, height: 34, phase: Math.PI },
  { x: 86, y: 234, width: 44, height: 36, phase: Math.PI },
  { x: 140, y: 255, width: 35, height: 30, phase: 0 },
  { x: 166, y: 224, width: 41, height: 36, phase: 0 },
  { x: 213, y: 239, width: 33, height: 40, phase: Math.PI }
];

function removeConnectedPaperBackground(imageData) {
  const { data, width, height } = imageData;
  let barrier = new Uint8Array(width * height);
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const isPaper = (index) => {
    const offset = index * 4;
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    return red > 218 && green > 218 && blue > 218 && maximum - minimum < 34;
  };

  for (let index = 0; index < barrier.length; index += 1) {
    barrier[index] = isPaper(index) ? 0 : 1;
  }

  // Watercolor pencil outlines contain tiny gaps. Expand the visible outline by
  // one pixel before the edge flood-fill so white cat bodies and the fish belly
  // remain enclosed, while the large spaces between the cats stay transparent.
  const expandedBarrier = barrier.slice();
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      if (barrier[index]) continue;

      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          if (barrier[(y + offsetY) * width + x + offsetX]) {
            expandedBarrier[index] = 1;
          }
        }
      }
    }
  }
  barrier = expandedBarrier;

  const enqueue = (index) => {
    if (visited[index] || barrier[index]) return;
    visited[index] = 1;
    queue[tail++] = index;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }

  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    const y = Math.floor(index / width);
    const offset = index * 4;
    data[offset + 3] = 0;

    if (x > 0) enqueue(index - 1);
    if (x + 1 < width) enqueue(index + 1);
    if (y > 0) enqueue(index - width);
    if (y + 1 < height) enqueue(index + width);
  }

  return imageData;
}

function initializeWalkingArt() {
  const canvas = elements.art;
  if (!canvas) return;

  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;

  const sourceCanvas = document.createElement('canvas');
  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
  const baseCanvas = document.createElement('canvas');
  const baseContext = baseCanvas.getContext('2d');
  const image = new Image();

  sourceCanvas.width = ART_WIDTH;
  sourceCanvas.height = ART_HEIGHT;
  baseCanvas.width = ART_WIDTH;
  baseCanvas.height = ART_HEIGHT;
  canvas.width = ART_WIDTH;
  canvas.height = ART_HEIGHT;

  const renderStaticFallback = () => {
    context.clearRect(0, 0, ART_WIDTH, ART_HEIGHT);
    context.drawImage(image, 0, 0, ART_WIDTH, ART_HEIGHT);
  };

  image.addEventListener('load', () => {
    sourceContext.clearRect(0, 0, ART_WIDTH, ART_HEIGHT);
    sourceContext.drawImage(image, 0, 0, ART_WIDTH, ART_HEIGHT);

    try {
      const imageData = sourceContext.getImageData(0, 0, ART_WIDTH, ART_HEIGHT);
      sourceContext.putImageData(removeConnectedPaperBackground(imageData), 0, 0);
    } catch (error) {
      console.warn('[guppy] Could not remove paper background:', error);
    }

    baseContext.clearRect(0, 0, ART_WIDTH, ART_HEIGHT);
    baseContext.drawImage(sourceCanvas, 0, 0);
    LEG_RECTS.forEach(({ x, y, width, height }) => {
      baseContext.clearRect(x - 1, y - 1, width + 2, height + 2);
    });

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const draw = (timestamp = 0) => {
      context.clearRect(0, 0, ART_WIDTH, ART_HEIGHT);
      context.drawImage(baseCanvas, 0, 0);

      LEG_RECTS.forEach(({ x, y, width, height, phase }) => {
        const wave = reducedMotion ? 0 : Math.sin((timestamp / 1080) * Math.PI * 2 + phase);
        const angle = wave * 2.4 * (Math.PI / 180);
        const lift = reducedMotion ? 0 : Math.max(0, wave) * 1.6;
        const pivotX = x + width / 2;
        const pivotY = y + 2;

        context.save();
        context.translate(pivotX, pivotY - lift);
        context.rotate(angle);
        context.drawImage(
          sourceCanvas,
          x,
          y,
          width,
          height,
          -width / 2,
          -2,
          width,
          height
        );
        context.restore();
      });

      if (!reducedMotion) window.requestAnimationFrame(draw);
    };

    draw();
  }, { once: true });

  image.addEventListener('error', renderStaticFallback, { once: true });
  image.src = ART_SOURCE;
}

function setWidgetState(nextState, message) {
  if (!elements.widget) return;
  elements.widget.dataset.state = nextState;
  if (elements.status && message) elements.status.textContent = message;
}

function setLoading(visible, message = '') {
  if (!elements.loadingNote) return;
  elements.loadingNote.hidden = !visible;
  if (message && elements.loadingText) elements.loadingText.textContent = message;
}

function setComposerDisabled(disabled) {
  if (elements.input) elements.input.disabled = disabled;
  if (elements.send) elements.send.disabled = disabled;
}

function addMessage(role, text) {
  if (!elements.messages) return null;

  const message = document.createElement('div');
  message.className = `guppy-message guppy-message--${role}`;

  const name = document.createElement('span');
  name.className = 'guppy-message-name';
  name.textContent = role === 'user' ? 'you' : 'fish';

  const body = document.createElement('p');
  body.textContent = text;

  message.append(name, body);
  elements.messages.appendChild(message);
  elements.messages.scrollTop = elements.messages.scrollHeight;
  return message;
}

function addTypingMessage() {
  const node = addMessage('fish', 'blub blub blub…');
  if (node) node.dataset.typing = 'true';
  return node;
}

function createBubble() {
  if (!elements.bubbles || document.hidden) return;

  const bubble = document.createElement('span');
  const size = 6 + Math.random() * 9;
  bubble.className = 'guppy-bubble';
  bubble.style.width = `${size}px`;
  bubble.style.height = `${size}px`;
  bubble.style.left = `${42 + Math.random() * 22}%`;
  bubble.style.setProperty('--bubble-drift', `${-14 + Math.random() * 30}px`);
  bubble.addEventListener('animationend', () => bubble.remove(), { once: true });
  elements.bubbles.appendChild(bubble);
}

function startBubbles() {
  if (state.bubbleTimer) return;
  state.bubbleTimer = window.setInterval(() => {
    if (Math.random() > 0.28) createBubble();
  }, 1250);
}

function openChat() {
  if (!elements.chat || !elements.toggle) return;
  elements.chat.hidden = false;
  elements.toggle.setAttribute('aria-expanded', 'true');
  window.requestAnimationFrame(() => elements.input?.focus());
  void loadModel();
}

function closeChat() {
  if (!elements.chat || !elements.toggle) return;
  elements.chat.hidden = true;
  elements.toggle.setAttribute('aria-expanded', 'false');
  elements.toggle.focus();
}

async function loadModel() {
  if (state.session && state.tokenizer) return;
  if (state.loadPromise) return state.loadPromise;

  setWidgetState('loading', '正在下载约 10 MB 的小鱼脑袋');
  setLoading(true, '正在加载 tokenizer…');
  setComposerDisabled(true);

  state.loadPromise = (async () => {
    try {
      const ort = await import(`${ORT_BASE}ort.min.mjs`);
      state.ort = ort;
      ort.env.wasm.wasmPaths = ORT_BASE;

      const tokenizerResponse = await fetch(`${MODEL_BASE}/tokenizer.json`);
      if (!tokenizerResponse.ok) throw new Error(`Tokenizer HTTP ${tokenizerResponse.status}`);
      state.tokenizer = buildTokenizer(await tokenizerResponse.json());

      setLoading(true, '正在加载模型（约 10 MB）…');
      const modelResponse = await fetch(`${MODEL_BASE}/model.onnx`);
      if (!modelResponse.ok) throw new Error(`Model HTTP ${modelResponse.status}`);

      state.session = await ort.InferenceSession.create(await modelResponse.arrayBuffer(), {
        executionProviders: ['wasm']
      });

      setWidgetState('ready', '9M 参数 · 浏览器本地运行');
      setLoading(false);
      setComposerDisabled(false);
      addMessage('fish', 'tiny fish brain online. ask me about food, bubbles, or life.');
      elements.input?.focus();
    } catch (error) {
      console.error('[guppy] Failed to load GuppyLM:', error);
      setWidgetState('error', '模型加载失败 · 已切换到小鱼备用脑袋');
      setLoading(false);
      setComposerDisabled(false);
      addMessage('fish', 'my big fish brain did not load. i still have a tiny backup brain. blub.');
    }
  })();

  return state.loadPromise;
}

function buildTokenizer(json) {
  const vocab = json.model.vocab;
  const merges = json.model.merges;
  const addedTokens = {};

  for (const token of json.added_tokens || []) {
    addedTokens[token.content] = token.id;
  }

  const idToToken = {};
  for (const [token, id] of Object.entries(vocab)) idToToken[id] = token;
  for (const [token, id] of Object.entries(addedTokens)) idToToken[id] = token;

  const byteToCharacter = {};
  const characterToByte = {};
  const directBytes = new Set();

  for (const [start, end] of [[33, 126], [161, 172], [174, 255]]) {
    for (let byte = start; byte <= end; byte += 1) directBytes.add(byte);
  }

  let extraIndex = 0;
  for (let byte = 0; byte < 256; byte += 1) {
    if (directBytes.has(byte)) {
      byteToCharacter[byte] = String.fromCharCode(byte);
    } else {
      byteToCharacter[byte] = String.fromCharCode(256 + extraIndex);
      extraIndex += 1;
    }
  }

  for (const [byte, character] of Object.entries(byteToCharacter)) {
    characterToByte[character] = Number(byte);
  }

  const mergeRank = {};
  merges.forEach((merge, index) => {
    const key = Array.isArray(merge) ? merge.join(' ') : merge;
    mergeRank[key] = index;
  });

  function applyBpe(characters) {
    if (characters.length <= 1) return characters;
    let pieces = characters.slice();

    while (pieces.length > 1) {
      let bestRank = Infinity;
      let bestIndex = -1;

      for (let index = 0; index < pieces.length - 1; index += 1) {
        const rank = mergeRank[`${pieces[index]} ${pieces[index + 1]}`];
        if (rank !== undefined && rank < bestRank) {
          bestRank = rank;
          bestIndex = index;
        }
      }

      if (bestIndex === -1) break;
      const merged = pieces[bestIndex] + pieces[bestIndex + 1];
      pieces = [
        ...pieces.slice(0, bestIndex),
        merged,
        ...pieces.slice(bestIndex + 2)
      ];
    }

    return pieces;
  }

  const wordPattern = /'(?:[sdmt]|ll|ve|re)| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu;
  const escapedSpecialTokens = Object.keys(addedTokens)
    .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  const specialTokenPattern = new RegExp(`(${escapedSpecialTokens})`);

  function encode(text) {
    const ids = [];
    const segments = text.split(specialTokenPattern);

    for (const segment of segments) {
      if (!segment) continue;

      if (addedTokens[segment] !== undefined) {
        ids.push(addedTokens[segment]);
        continue;
      }

      const words = segment.match(wordPattern) || [segment];
      for (const word of words) {
        const bytes = new TextEncoder().encode(word);
        const characters = Array.from(bytes, (byte) => byteToCharacter[byte]);
        const tokens = applyBpe(characters);
        for (const token of tokens) {
          const id = vocab[token];
          if (id !== undefined) ids.push(id);
        }
      }
    }

    return ids;
  }

  function decode(ids) {
    const pieces = [];

    for (const id of ids) {
      const token = idToToken[id];
      if (!token || addedTokens[token] !== undefined) continue;
      pieces.push(token);
    }

    const bytes = Uint8Array.from(
      [...pieces.join('')].map((character) => characterToByte[character] ?? character.charCodeAt(0))
    );
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  }

  return { encode, decode };
}

function sampleToken(logits) {
  const values = new Float32Array(MODEL_CONFIG.vocabSize);
  let maxValue = -Infinity;

  for (let index = 0; index < MODEL_CONFIG.vocabSize; index += 1) {
    const value = logits[index] / GENERATION_CONFIG.temperature;
    values[index] = value;
  }

  if (GENERATION_CONFIG.topK > 0) {
    const sorted = Array.from(values).sort((a, b) => b - a);
    const cutoff = sorted[Math.min(GENERATION_CONFIG.topK, sorted.length) - 1];
    for (let index = 0; index < values.length; index += 1) {
      if (values[index] < cutoff) values[index] = -Infinity;
    }
  }

  for (const value of values) {
    if (Number.isFinite(value) && value > maxValue) maxValue = value;
  }

  const probabilities = new Float32Array(MODEL_CONFIG.vocabSize);
  let probabilitySum = 0;

  for (let index = 0; index < values.length; index += 1) {
    const probability = Number.isFinite(values[index]) ? Math.exp(values[index] - maxValue) : 0;
    probabilities[index] = probability;
    probabilitySum += probability;
  }

  let random = Math.random();
  let accumulated = 0;

  for (let index = 0; index < probabilities.length; index += 1) {
    accumulated += probabilities[index] / probabilitySum;
    if (random <= accumulated) return index;
  }

  return 0;
}

async function generate(inputIds) {
  const ids = inputIds.slice();

  for (let step = 0; step < GENERATION_CONFIG.maxTokens; step += 1) {
    const sequence = ids.slice(-MODEL_CONFIG.maxSequenceLength);
    const inputTensor = new state.ort.Tensor(
      'int64',
      BigInt64Array.from(sequence, (id) => BigInt(id)),
      [1, sequence.length]
    );

    const output = await state.session.run({ input_ids: inputTensor });
    const logits = output.logits.data;
    const offset = (sequence.length - 1) * MODEL_CONFIG.vocabSize;
    const finalLogits = logits.slice(offset, offset + MODEL_CONFIG.vocabSize);
    const nextId = sampleToken(finalLogits);

    ids.push(nextId);
    if (nextId === MODEL_CONFIG.eosId) break;

    await new Promise((resolve) => window.setTimeout(resolve, 0));
  }

  return ids.slice(inputIds.length);
}

function fallbackReply(input) {
  const normalized = input.trim().toLowerCase();
  const containsChinese = /[\u3400-\u9fff]/u.test(input);

  if (/意义|meaning of life|life/.test(normalized)) {
    return containsChinese ? '食物。答案永远是食物。' : 'food. the answer is always food.';
  }

  if (/你好|hello|\bhi\b/.test(normalized)) {
    return containsChinese ? '你好，大型陆地生物。今天的水很舒服。' : 'hello big land creature. the water feels nice today.';
  }

  if (/猫|cat/.test(normalized)) {
    return containsChinese ? '猫太大了。我会躲到石头后面观察。' : 'the cat is too large. i will watch from behind the rock.';
  }

  if (/项目|project|主页|website/.test(normalized)) {
    return containsChinese ? '我负责在右下角游泳。其他项目由人类负责。分工很合理。' : 'i handle swimming in the corner. the human handles the projects. good division of labor.';
  }

  const chineseReplies = [
    '我只是一条小鱼，但这听起来值得再想想。',
    '可以先吃点东西，再继续讨论。',
    '水里听不太清，不过我支持继续迭代。',
    'blub。请再告诉我一点。'
  ];

  const englishReplies = [
    'blub. tell me more.',
    'i am only a small fish, but that sounds important.',
    'maybe food first. thinking second.',
    'the bubbles agree with you.'
  ];

  const options = containsChinese ? chineseReplies : englishReplies;
  return options[Math.floor(Math.random() * options.length)];
}

async function getReply(input) {
  const containsChinese = /[\u3400-\u9fff]/u.test(input);
  if (containsChinese || !state.session || !state.tokenizer) return fallbackReply(input);

  const prompt = `<|im_start|>user\n${input}<|im_end|>\n<|im_start|>assistant\n`;
  const inputIds = state.tokenizer.encode(prompt);
  const outputIds = await generate(inputIds);
  let reply = state.tokenizer.decode(outputIds).trim();

  if (reply.includes('<|im_end|>')) reply = reply.split('<|im_end|>')[0];
  if (reply.includes('<|im_start|>')) reply = reply.split('<|im_start|>')[0];
  return reply.trim() || 'blub.';
}

async function submitMessage(event) {
  event.preventDefault();
  if (state.isGenerating || !elements.input) return;

  const text = elements.input.value.trim();
  if (!text) return;

  addMessage('user', text);
  elements.input.value = '';
  state.isGenerating = true;
  setComposerDisabled(true);
  setWidgetState(state.session ? 'ready' : 'loading', '小鱼正在想…');
  const typing = addTypingMessage();

  try {
    await loadModel();
    setComposerDisabled(true);
    const reply = await getReply(text);
    typing?.remove();
    addMessage('fish', reply);
    setWidgetState(state.session ? 'ready' : 'error', state.session ? '9M 参数 · 浏览器本地运行' : '备用小鱼脑袋');
  } catch (error) {
    console.error('[guppy] Generation failed:', error);
    typing?.remove();
    addMessage('fish', fallbackReply(text));
    setWidgetState('error', '推理失败 · 已使用备用回答');
  } finally {
    state.isGenerating = false;
    setComposerDisabled(false);
    elements.input?.focus();
  }
}

function initialize() {
  if (!elements.widget || !elements.toggle || !elements.chat || !elements.form) return;

  setWidgetState('idle', '点击后在浏览器中醒来');
  initializeWalkingArt();
  startBubbles();

  elements.toggle.addEventListener('click', () => {
    if (elements.chat.hidden) openChat();
    else closeChat();
  });

  elements.close?.addEventListener('click', closeChat);
  elements.form.addEventListener('submit', submitMessage);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !elements.chat.hidden) closeChat();
  });
}

initialize();
