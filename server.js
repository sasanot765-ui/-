const http = require('http');
// 1. เรียกใช้งาน Pool จากไลบรารี pg สำหรับจัดการการเชื่อมต่อฐานข้อมูล
const { Pool } = require('pg');

// 2. ตั้งค่าการเชื่อมต่อ โดยดึง URL มาจาก Environment Variable ของ Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const port = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  let client;
  try {
    // 3. ขอเชื่อมต่อและส่งคำสั่ง SQL ไปดึงข้อมูลจากตาราง students
    // (ตารางนี้สร้างและใส่ข้อมูลไว้แล้วผ่าน Railway UI)
    client = await pool.connect();
    const result = await client.query('SELECT * FROM students ORDER BY student_id');

    // 4. นำข้อมูลที่ได้ (result.rows) มาประกอบเป็นตาราง HTML พร้อมตกแต่งด้วย CSS
    let rows = '';
    result.rows.forEach((row, index) => {
      rows += `
        <tr>
          <td>${index + 1}</td>
          <td>${row.student_id}</td>
          <td>${row.student_name}</td>
        </tr>`;
    });

    const html = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <title>ฐานข้อมูลนักศึกษา</title>
        <style>
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 40px 20px;
            font-family: 'Segoe UI', 'Tahoma', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .container {
            background: #ffffff;
            border-radius: 16px;
            padding: 32px 40px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            max-width: 700px;
            width: 100%;
          }
          h1 {
            text-align: center;
            color: #4a2f7a;
            margin-bottom: 8px;
            font-size: 26px;
          }
          p.subtitle {
            text-align: center;
            color: #888;
            margin-top: 0;
            margin-bottom: 24px;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            overflow: hidden;
            border-radius: 10px;
          }
          thead tr {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          th, td {
            padding: 14px 16px;
            text-align: left;
          }
          th {
            font-size: 14px;
            letter-spacing: 0.5px;
          }
          tbody tr {
            border-bottom: 1px solid #eee;
            transition: background 0.2s;
          }
          tbody tr:nth-child(even) {
            background: #f7f5fb;
          }
          tbody tr:hover {
            background: #ece6fb;
          }
          td:first-child {
            color: #999;
            font-weight: bold;
            width: 40px;
          }
          footer {
            text-align: center;
            color: rgba(255,255,255,0.85);
            margin-top: 20px;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📚 ฐานข้อมูลนักศึกษา</h1>
          <p class="subtitle">ทดสอบการเชื่อมต่อฐานข้อมูล PostgreSQL บน Railway</p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>รหัสนักศึกษา</th>
                <th>ชื่อ-นามสกุล</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
        <footer>เชื่อมต่อฐานข้อมูลสำเร็จ ✅ | จำนวนนักศึกษา: ${result.rows.length} คน</footer>
      </body>
      </html>
    `;

    res.end(html);
  } catch (err) {
    // กรณีเชื่อมต่อไม่ได้หรือเขียนชื่อตารางผิด
    console.error(err);
    res.end(`<h1>เกิดข้อผิดพลาด!</h1><p>${err.message}</p>`);
  } finally {
    // คืน connection ทุกกรณี ไม่ว่าจะสำเร็จหรือ error
    if (client) client.release();
  }
});

server.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
