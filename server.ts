import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Health / Status endpoint
app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    engine: 'WhisperX ARTYVERSE AVx Engine',
    hasApiKey: Boolean(apiKey),
    version: '2.5.0-production',
  });
});

// Chat endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      message,
      history = [],
      model = 'gemini-3.8-flash',
      systemInstruction,
      searchGrounding = false,
      highThinking = false,
      imageAttachment, // { mimeType: string, data: string (base64) }
    } = req.body;

    if (!message && !imageAttachment) {
      return res.status(400).json({ error: 'Message or image attachment is required' });
    }

    if (!ai) {
      // Offline fallback when GEMINI_API_KEY is not yet attached
      return res.json({
        text: `[โหมดออฟไลน์ / Smart Demo]: ได้รับข้อความ "${message || 'วิเคราะห์ไฟล์'}" แล้วค่ะ! ผีน้อย WhisperX และระบบ STAGE Sandbox พร้อมทำงานทันที หากต้องการเชื่อมต่อสมองกล Gemini ให้ระบุ GEMINI_API_KEY ใน Settings > Secrets ค่ะ ✨`,
        offline: true,
      });
    }

    // Determine target model
    let targetModel = model;
    if (highThinking) {
      targetModel = 'gemini-4-argon';
    }

    // Configure tools
    const tools: any[] = [];
    if (searchGrounding) {
      tools.push({ googleSearch: {} });
    }

    const defaultSystemInstruction =
      'You are WhisperX AI Studio (ARTYVERSE AVx Engine), an ultra-advanced creative AI agent with a living physics mascot and real-time code execution stage. You respond fluently in Thai and English with a futuristic, friendly, polite tone (e.g. สวัสดีค่ะ~ ผีน้อย WhisperX พร้อมช่วยเหลือค่ะ 👻). You provide thoughtful answers, creative ideas, code snippets, and designs. When asked to create apps or games, format your response clearly.';

    const config: any = {
      systemInstruction: systemInstruction || defaultSystemInstruction,
    };

    if (tools.length > 0) {
      config.tools = tools;
    }

    if (highThinking && (targetModel === 'gemini-4-argon' || targetModel === 'gemini-3.8-flash')) {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    // Multi-turn chat
    const tryGenerate = async (m: string) => {
      if (imageAttachment) {
        const parts: any[] = [
          {
            inlineData: {
              mimeType: imageAttachment.mimeType,
              data: imageAttachment.data,
            },
          },
        ];
        if (message) parts.push({ text: message });
        return await ai.models.generateContent({
          model: m,
          contents: { parts },
          config,
        });
      }

      if (history && history.length > 0) {
        const chat = ai.chats.create({
          model: m,
          config,
          history: history.map((h: any) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text || h.content }],
          })),
        });
        return await chat.sendMessage({ message });
      }

      return await ai.models.generateContent({
        model: m,
        contents: message,
        config,
      });
    };

    let response;
    try {
      response = await tryGenerate(targetModel);
    } catch (primaryErr: any) {
      console.warn(`Primary model ${targetModel} encountered error, trying fallback gemini-3.1-flash-lite:`, primaryErr?.message);
      try {
        response = await tryGenerate('gemini-3.1-flash-lite');
      } catch (fallbackErr: any) {
        console.warn('Fallback model error:', fallbackErr?.message);
        return res.json({
          text: `สวัสดีค่ะ~ ผีน้อย WhisperX พร้อมช่วยเหลือค่ะ! (ระบบตอบกลับอัตโนมัติ): สำหรับข้อความ "${message || 'คำสั่งของคุณ'}" ผีน้อยได้บันทึกคำสั่งและเตรียมพร้อมใน STAGE V0/V1 เรียบร้อยแล้วค่ะ ✨`,
          offlineFallback: true,
        });
      }
    }

    return res.json({ text: response.text ?? '' });
  } catch (error: any) {
    console.error('Gemini Chat Error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate response from Gemini API',
    });
  }
});

// Autonomous Stage App Generator
app.post('/api/generate-app', async (req: Request, res: Response) => {
  try {
    const { prompt, type = 'webapp' } = req.body;

    if (!ai) {
      // High-quality offline demo template generator
      const fallbackCode = getDemoAppCode(prompt || 'Cyberpunk Digital Clock');
      return res.json({ code: fallbackCode, offline: true });
    }

    const codePrompt = `You are the autonomous Code Generator for WhisperX STAGE V0/V1 Sandbox.
The user wants to generate an interactive web application: "${prompt}".
Create a SINGLE COMPLETE, STANDALONE HTML document containing all necessary HTML, CSS (using inline styles or Tailwind CDN), and JavaScript (vanilla JS or Canvas) needed to run this application interactively in an iframe.
DO NOT use markdown backticks, DO NOT wrap in \`\`\`html. Return ONLY the raw valid executable HTML string starting with <!DOCTYPE html>.
Ensure the UI is gorgeous, cyberpunk/modern, responsive, interactive, and includes error handling.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: codePrompt,
      config: {
        systemInstruction:
          'You are a master web developer that outputs only raw standalone HTML code with embedded styles and scripts ready to render in an iframe sandbox. No explanations, no markdown wrappers.',
      },
    });

    let code = (response.text ?? '').trim();
    if (code.startsWith('```html')) {
      code = code.replace(/^```html\s*/i, '').replace(/```\s*$/i, '');
    } else if (code.startsWith('```')) {
      code = code.replace(/^```\s*/, '').replace(/```\s*$/i, '');
    }

    return res.json({ code });
  } catch (err: any) {
    console.error('App generator error:', err);
    // Fall back to preset app
    const fallback = getDemoAppCode(req.body.prompt || 'Neon Particle Game');
    return res.json({ code: fallback, fallback: true, error: err?.message });
  }
});

function getDemoAppCode(prompt: string): string {
  const isGame = /game|เกม|ball|บอล|dodge|jump/i.test(prompt);
  if (isGame) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Neon Cyber Pong</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#07080E; color:#B6FF00; font-family:sans-serif; overflow:hidden; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; }
    #canvas { border:2px solid #00F0FF; border-radius:12px; box-shadow:0 0 30px rgba(0,240,255,0.3); background:#0c0f1d; }
    .hud { position:absolute; top:20px; font-weight:bold; letter-spacing:2px; font-size:18px; color:#00F0FF; text-shadow:0 0 10px #00F0FF; }
    .btn { margin-top:10px; background:#B6FF00; color:#07080E; border:none; padding:8px 24px; border-radius:20px; font-weight:bold; cursor:pointer; }
  </style>
</head>
<body>
  <div class="hud">SCORE: <span id="score">0</span> | BEST: <span id="best">0</span></div>
  <canvas id="canvas" width="480" height="380"></canvas>
  <button class="btn" onclick="resetGame()">RESTART</button>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    let score = 0, best = 0;
    let ball = { x: 240, y: 190, dx: 4, dy: -4, r: 8, color: '#B6FF00' };
    let paddle = { x: 190, y: 350, w: 100, h: 12, color: '#00F0FF' };
    let trails = [];

    window.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, e.clientX - rect.left - paddle.w / 2));
    });
    window.addEventListener('touchmove', (e) => {
      const rect = canvas.getBoundingClientRect();
      if(e.touches[0]) paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, e.touches[0].clientX - rect.left - paddle.w / 2));
    });

    function loop() {
      ctx.fillStyle = 'rgba(12, 15, 29, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Trail
      trails.push({ x: ball.x, y: ball.y, alpha: 0.8 });
      if(trails.length > 10) trails.shift();
      trails.forEach((t, i) => {
        ctx.fillStyle = 'rgba(182, 255, 0, ' + (i/12) + ')';
        ctx.beginPath();
        ctx.arc(t.x, t.y, ball.r * 0.7, 0, Math.PI * 2);
        ctx.fill();
      });

      // Move ball
      ball.x += ball.dx;
      ball.y += ball.dy;

      if (ball.x + ball.r > canvas.width || ball.x - ball.r < 0) ball.dx *= -1;
      if (ball.y - ball.r < 0) ball.dy *= -1;

      // Paddle hit
      if (ball.y + ball.r >= paddle.y && ball.x >= paddle.x && ball.x <= paddle.x + paddle.w && ball.dy > 0) {
        ball.dy = -Math.abs(ball.dy) * 1.05;
        ball.dx += (Math.random() - 0.5) * 2;
        score += 10;
        document.getElementById('score').innerText = score;
        if(score > best) { best = score; document.getElementById('best').innerText = best; }
      }

      // Miss
      if (ball.y - ball.r > canvas.height) {
        score = 0;
        document.getElementById('score').innerText = score;
        ball.x = 240; ball.y = 190; ball.dx = 4; ball.dy = -4;
      }

      // Draw Ball
      ctx.fillStyle = ball.color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = ball.color;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
      ctx.fill();

      // Draw Paddle
      ctx.fillStyle = paddle.color;
      ctx.shadowColor = paddle.color;
      ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
      ctx.shadowBlur = 0;

      requestAnimationFrame(loop);
    }
    function resetGame() {
      score = 0;
      ball = { x: 240, y: 190, dx: 4, dy: -4, r: 8, color: '#B6FF00' };
    }
    loop();
  </script>
</body>
</html>`;
  }

  // Default Cyberpunk Clock & Visualizer
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>Cyberpunk Quantum HUD</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background: radial-gradient(circle at center, #101322 0%, #07080E 100%); color:#F0F2FA; font-family: monospace; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; overflow:hidden; }
    .card { background:rgba(16, 19, 34, 0.8); border:1px solid rgba(0,240,255,0.3); border-radius:16px; padding:32px 48px; text-align:center; box-shadow:0 0 40px rgba(0,240,255,0.15); backdrop-filter:blur(20px); }
    .title { color:#8A90A6; font-size:14px; letter-spacing:4px; margin-bottom:12px; }
    .time { font-size:52px; font-weight:bold; color:#B6FF00; text-shadow:0 0 20px rgba(182,255,0,0.6); }
    .date { color:#00F0FF; font-size:16px; margin-top:8px; letter-spacing:2px; }
    .bars { display:flex; gap:6px; margin-top:24px; justify-content:center; }
    .bar { width:8px; height:32px; background:#00F0FF; border-radius:4px; animation:bounce 1.2s infinite ease-in-out; }
    @keyframes bounce { 0%,100% { transform:scaleY(0.3); opacity:0.4; } 50% { transform:scaleY(1.2); opacity:1; filter:drop-shadow(0 0 8px #B6FF00); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">WHISPERX / QUANTUM CHRONO</div>
    <div class="time" id="clock">00:00:00</div>
    <div class="date" id="date">CYBER DOCK ACTIVE</div>
    <div class="bars">
      <div class="bar" style="animation-delay:0s"></div>
      <div class="bar" style="animation-delay:0.2s"></div>
      <div class="bar" style="animation-delay:0.4s"></div>
      <div class="bar" style="animation-delay:0.6s"></div>
      <div class="bar" style="animation-delay:0.8s"></div>
    </div>
  </div>
  <script>
    function update() {
      const now = new Date();
      document.getElementById('clock').innerText = now.toTimeString().split(' ')[0];
      document.getElementById('date').innerText = now.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    setInterval(update, 1000);
    update();
  </script>
</body>
</html>`;
}

// Development Vite Middleware setup or Production Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[WhisperX Engine] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
