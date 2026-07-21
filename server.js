const http = require('http');

// กำหนด Port ที่ Server จะเปิดใช้งาน (Render จะกำหนดค่านี้ให้ผ่าน process.env.PORT)
const PORT = process.env.PORT || 3000;

// --- พื้นหลังภาพจริงแบบ SVG (ทิวทัศน์คืนหิมะ: ท้องฟ้า, ดวงจันทร์, ดวงดาว, ภูเขา) ---
// ฝังเป็น data URI ในตัว ไม่ต้องพึ่งลิงก์ภายนอก โหลดไวและไม่มีวันลิงก์เสีย
const bgSvg = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900'>
  <defs>
    <linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0%' stop-color='%230f172a'/>
      <stop offset='45%' stop-color='%231e3a5f'/>
      <stop offset='100%' stop-color='%23335c81'/>
    </linearGradient>
  </defs>
  <rect width='1600' height='900' fill='url(%23sky)'/>
  <circle cx='1320' cy='150' r='95' fill='%23f1f5f9' opacity='0.12'/>
  <circle cx='1320' cy='150' r='65' fill='%23f8fafc' opacity='0.95'/>
  <circle cx='120' cy='80' r='2' fill='white' opacity='0.8'/>
  <circle cx='260' cy='140' r='1.6' fill='white' opacity='0.7'/>
  <circle cx='400' cy='60' r='2.2' fill='white' opacity='0.9'/>
  <circle cx='560' cy='160' r='1.5' fill='white' opacity='0.6'/>
  <circle cx='720' cy='90' r='2' fill='white' opacity='0.8'/>
  <circle cx='880' cy='50' r='1.8' fill='white' opacity='0.7'/>
  <circle cx='1000' cy='180' r='1.5' fill='white' opacity='0.6'/>
  <circle cx='150' cy='260' r='1.4' fill='white' opacity='0.5'/>
  <circle cx='620' cy='230' r='1.6' fill='white' opacity='0.6'/>
  <circle cx='980' cy='300' r='1.3' fill='white' opacity='0.5'/>
  <circle cx='1450' cy='90' r='1.8' fill='white' opacity='0.7'/>
  <circle cx='60' cy='200' r='1.5' fill='white' opacity='0.6'/>
  <polygon points='0,900 0,640 260,480 560,680 880,430 1180,630 1600,520 1600,900' fill='%2314213d' opacity='0.9'/>
  <polygon points='0,900 0,760 380,650 760,800 1160,690 1600,770 1600,900' fill='%230b1626'/>
  <polygon points='90,900 150,780 210,900' fill='%230b1626'/>
  <polygon points='260,900 320,760 380,900' fill='%23132038'/>
  <polygon points='1250,900 1310,770 1370,900' fill='%230b1626'/>
  <polygon points='1420,900 1480,800 1540,900' fill='%23132038'/>
</svg>
`.trim().replace(/\s+/g, ' ');

const server = http.createServer((req, res) => {
    // 1. ตั้งค่า Header ให้ตอบกลับเป็นตัวอักษรแบบ UTF-8
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

    // 2. ข้อมูลที่จะส่งกลับไป (Response) — พื้นหลังภาพหิมะยามค่ำคืน + หิมะตก (canvas) + ปุ่มควบคุม + การ์ดข้อมูล
    res.write(`
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>My Snowy Web Server</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Sarabun:wght@300;600&display=swap');

                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                html, body {
                    width: 100%;
                    height: 100vh;
                    overflow: hidden;
                }

                body {
                    background-image: url("data:image/svg+xml,${bgSvg}");
                    background-size: cover;
                    background-position: center bottom;
                    background-attachment: fixed;
                    color: #334155;
                    font-family: 'Fira Code', 'Sarabun', monospace, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    position: relative;
                    transition: filter 0.5s ease;
                }

                body.light-theme {
                    filter: brightness(1.25) saturate(0.9);
                }

                /* --- เอฟเฟกต์หิมะตก (Canvas Snowfall) --- */
                #snowCanvas {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 1;
                }

                /* --- ปุ่มควบคุม --- */
                #controlBar {
                    position: fixed;
                    top: 25px;
                    right: 25px;
                    display: flex;
                    gap: 12px;
                    z-index: 4;
                }

                .control-btn {
                    width: 46px;
                    height: 46px;
                    border-radius: 50%;
                    border: 1.5px solid rgba(255, 255, 255, 0.6);
                    background: rgba(255, 255, 255, 0.35);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    font-size: 20px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.15);
                }

                .control-btn:hover {
                    background: rgba(255, 255, 255, 0.55);
                    transform: scale(1.1);
                }

                .control-btn.active {
                    background: rgba(56, 189, 248, 0.55);
                    border-color: #38bdf8;
                }

                /* --- การ์ดสไตล์กระจกฝ้า (Glassmorphism Frosted Card) --- */
                .card {
                    background: rgba(255, 255, 255, 0.45);
                    border: 1px solid rgba(255, 255, 255, 0.6);
                    border-radius: 20px;
                    padding: 35px 30px;
                    box-shadow: 0 8px 32px 0 rgba(148, 163, 184, 0.15);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    max-width: 450px;
                    width: 90%;
                    text-align: center;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    z-index: 2;
                    position: relative;
                }

                .card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 15px 40px 0 rgba(148, 163, 184, 0.3);
                    background: rgba(255, 255, 255, 0.55);
                }

                h1 {
                    color: #0369a1;
                    font-size: 1.8rem;
                    margin-bottom: 25px;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    border-bottom: 2px dashed #cbd5e1;
                    padding-bottom: 15px;
                }

                .info-group {
                    text-align: left;
                    background: rgba(255, 255, 255, 0.8);
                    padding: 15px 20px;
                    border-radius: 12px;
                    margin-bottom: 15px;
                    border-left: 4px solid #38bdf8;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
                }

                .label {
                    color: #64748b;
                    font-size: 0.85rem;
                    display: block;
                    margin-bottom: 5px;
                    text-transform: uppercase;
                    font-weight: 600;
                }

                .value {
                    color: #0f172a;
                    font-size: 1.1rem;
                    font-weight: 600;
                }

                .status-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-top: 25px;
                    font-size: 0.85rem;
                    color: #0284c7;
                    font-weight: 600;
                    letter-spacing: 1px;
                }

                .pulse-dot {
                    width: 10px;
                    height: 10px;
                    background-color: #38bdf8;
                    border-radius: 50%;
                    margin-right: 8px;
                    box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7);
                    animation: pulse 1.8s infinite;
                }

                @keyframes pulse {
                    0% {
                        transform: scale(0.9);
                        box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7);
                    }
                    70% {
                        transform: scale(1.1);
                        box-shadow: 0 0 0 8px rgba(56, 189, 248, 0);
                    }
                    100% {
                        transform: scale(0.9);
                        box-shadow: 0 0 0 0 rgba(56, 189, 248, 0);
                    }
                }
            </style>
        </head>
        <body>
            <canvas id="snowCanvas"></canvas>

            <div id="controlBar">
                <button class="control-btn active" id="snowToggle" title="เปิด/ปิด หิมะตก">❄️</button>
                <button class="control-btn" id="themeToggle" title="สลับธีม">🌙</button>
            </div>

            <div class="card">
                <h1>❄️ Welcome to My Server</h1>

                <div class="info-group">
                    <span class="label">Student ID</span>
                    <span class="value">69319011159</span>
                </div>

                <div class="info-group">
                    <span class="label">Full Name</span>
                    <span class="value">มานะเพชร ขันเงิน</span>
                </div>

                <div class="status-container">
                    <div class="pulse-dot"></div>
                    <span>SERVER COZY ACTIVE</span>
                </div>
            </div>

            <script>
                // --- ระบบหิมะตกแบบ Canvas ---
                const canvas = document.getElementById('snowCanvas');
                const ctx = canvas.getContext('2d');
                let snowflakes = [];
                let snowEnabled = true;
                let animId = null;
                const COUNT = 120;

                function resize() {
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                }

                function createSnowflakes() {
                    snowflakes = [];
                    for (let i = 0; i < COUNT; i++) {
                        snowflakes.push({
                            x: Math.random() * canvas.width,
                            y: Math.random() * canvas.height,
                            radius: Math.random() * 2.5 + 0.5,
                            speedX: Math.random() * 1.2 - 0.6,
                            speedY: Math.random() * 1.5 + 0.8,
                            opacity: Math.random() * 0.6 + 0.3
                        });
                    }
                }

                function update(flake) {
                    flake.x += flake.speedX;
                    flake.y += flake.speedY;

                    if (flake.x < -10) flake.x = canvas.width + 10;
                    if (flake.x > canvas.width + 10) flake.x = -10;
                    if (flake.y > canvas.height) {
                        flake.y = -10;
                        flake.x = Math.random() * canvas.width;
                    }
                }

                function draw(flake) {
                    ctx.fillStyle = 'rgba(255, 255, 255, ' + flake.opacity + ')';
                    ctx.beginPath();
                    ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
                    ctx.fill();
                }

                function animate() {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    if (snowEnabled) {
                        for (const flake of snowflakes) {
                            update(flake);
                            draw(flake);
                        }
                    }
                    animId = requestAnimationFrame(animate);
                }

                window.addEventListener('resize', () => {
                    resize();
                    createSnowflakes();
                });

                resize();
                createSnowflakes();
                animate();

                // --- ปุ่มควบคุม ---
                const snowToggle = document.getElementById('snowToggle');
                const themeToggle = document.getElementById('themeToggle');

                snowToggle.addEventListener('click', () => {
                    snowEnabled = !snowEnabled;
                    snowToggle.classList.toggle('active', snowEnabled);
                });

                themeToggle.addEventListener('click', () => {
                    const isLight = document.body.classList.toggle('light-theme');
                    themeToggle.textContent = isLight ? '☀️' : '🌙';
                    themeToggle.classList.toggle('active', isLight);
                });
            </script>
        </body>
        </html>
    `);

    // 3. สิ้นสุดการทำงานและส่งข้อมูลออกไป
    res.end();
});

// สั่งให้ Server รันตาม Port ที่กำหนด
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
