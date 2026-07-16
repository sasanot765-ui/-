const http = require('http');

// กำหนด Port ที่ Server จะเปิดใช้งาน (Render จะกำหนดค่านี้ให้ผ่าน process.env.PORT)
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    // 1. ตั้งค่า Header ให้ตอบกลับเป็นตัวอักษรแบบ UTF-8
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    
    // 2. ข้อมูลที่จะส่งกลับไป (Response) พร้อมตกแต่ง CSS สไตล์ Cozy Snowy ❄️
    res.write(`
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>My Snowy Web Server</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Sarabun:wght@300;600&display=swap');
                
                body {
                    /* พื้นหลังไล่โทนสีฟ้าไอซ์บลูและเทาพาสเทลแบบฤดูหนาว */
                    background: linear-gradient(135deg, #e0f2fe 0%, #f1f5f9 50%, #e0e7ff 100%);
                    color: #334155;
                    font-family: 'Fira Code', 'Sarabun', monospace, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    overflow: hidden;
                    position: relative;
                }

                /* --- เอฟเฟกต์หิมะตก (Snowflake CSS Animation) --- */
                .snow-container {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 1;
                    overflow: hidden;
                }

                .snowflake {
                    position: absolute;
                    top: -10px;
                    color: #ffffff;
                    font-size: 1.2rem;
                    text-shadow: 0 0 5px rgba(255,255,255,0.8);
                    user-select: none;
                    animation: fall linear infinite;
                }

                @keyframes fall {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 0;
                    }
                    10% {
                        opacity: 0.9;
                    }
                    90% {
                        opacity: 0.9;
                    }
                    100% {
                        transform: translateY(105vh) rotate(360deg);
                        opacity: 0;
                    }
                }

                /* ตั้งค่าตำแหน่งและความเร็วของหิมะแต่ละเม็ดแบบสุ่ม */
                .snowflake:nth-child(1) { left: 10%; animation-duration: 8s; animation-delay: 0s; }
                .snowflake:nth-child(2) { left: 25%; animation-duration: 12s; animation-delay: 2s; font-size: 0.8rem; }
                .snowflake:nth-child(3) { left: 40%; animation-duration: 10s; animation-delay: 1s; font-size: 1.5rem; }
                .snowflake:nth-child(4) { left: 55%; animation-duration: 14s; animation-delay: 4s; }
                .snowflake:nth-child(5) { left: 70%; animation-duration: 9s; animation-delay: 3s; font-size: 1rem; }
                .snowflake:nth-child(6) { left: 85%; animation-duration: 11s; animation-delay: 5s; font-size: 1.3rem; }
                .snowflake:nth-child(7) { left: 95%; animation-duration: 13s; animation-delay: 1.5s; }

                /* --- ตกแต่งการ์ดสไตล์กระจกฝ้า (Glassmorphism Frosted Card) --- */
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
                }

                .card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 15px 40px 0 rgba(148, 163, 184, 0.3);
                    background: rgba(255, 255, 255, 0.55);
                }

                /* ตกแต่งหัวข้อ */
                h1 {
                    color: #0369a1;
                    font-size: 1.8rem;
                    margin-bottom: 25px;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    border-bottom: 2px dashed #cbd5e1;
                    padding-bottom: 15px;
                }

                /* ตกแต่งกลุ่มข้อมูล */
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

                /* สเตตัสการทำงาน สีฟ้าหิมะพาสเทล */
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
            <div class="snow-container">
                <div class="snowflake">❄</div>
                <div class="snowflake">❅</div>
                <div class="snowflake">❆</div>
                <div class="snowflake">❄</div>
                <div class="snowflake">❅</div>
                <div class="snowflake">❆</div>
                <div class="snowflake">❄</div>
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
