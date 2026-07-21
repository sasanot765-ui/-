const http = require('http');

// กำหนด Port ที่ Server จะเปิดใช้งาน (Render จะกำหนดค่านี้ให้ผ่าน process.env.PORT)
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    // 1. ตั้งค่า Header ให้ตอบกลับเป็นตัวอักษรแบบ UTF-8
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

    // 2. ข้อมูลที่จะส่งกลับไป (Response) — เหลือแค่พื้นหลังหิมะตก (canvas) + การ์ดข้อมูล
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
                    /* พื้นหลังไล่โทนสีฟ้าไอซ์บลูและเทาพาสเทลแบบฤดูหนาว */
                    background: linear-gradient(135deg, #e0f2fe 0%, #f1f5f9 50%, #e0e7ff 100%);
                    color: #334155;
                    font-family: 'Fira Code', 'Sarabun', monospace, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    position: relative;
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
                // --- ระบบหิมะตกแบบ Canvas (เบา เรียบง่าย ไม่มีปุ่ม/ตัวควบคุมใดๆ) ---
                (function () {
                    const canvas = document.getElementById('snowCanvas');
                    const ctx = canvas.getContext('2d');
                    let snowflakes = [];
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
                        ctx.fillStyle = 'rgba(56, 189, 248, ' + flake.opacity + ')';
                        ctx.beginPath();
                        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    function animate() {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        for (const flake of snowflakes) {
                            update(flake);
                            draw(flake);
                        }
                        requestAnimationFrame(animate);
                    }

                    window.addEventListener('resize', () => {
                        resize();
                        createSnowflakes();
                    });

                    resize();
                    createSnowflakes();
                    animate();
                })();
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
