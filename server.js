const http = require('http');
// 1. เรียกใช้งาน Pool จากไลบรารี pg สำหรับจัดการการเชื่อมต่อฐานข้อมูล
const { Pool } = require('pg');

// 2. ตั้งค่าการเชื่อมต่อ โดยดึง URL มาจาก Environment Variable ของ Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const port = process.env.PORT || 3000;

// รายชื่อนักศึกษาที่จะใส่ลงฐานข้อมูลอัตโนมัติตอน server เริ่มทำงาน
const STUDENTS = [
  ['69319011103', 'จิรพล วสคุงสิน'],
  ['69319011159', 'มานะเพชร ขันเงิน'],
  ['69319011123', 'รวิสรา ชนะคราม'],
  ['69319011177', 'อารียา พันธ์เพ็ชร'],
  ['69319010090', 'สะมาย โมฮัมมัด'],
];

// ฟังก์ชันเตรียมฐานข้อมูล: ล้างตารางเก่าที่อาจมีชื่อคอลัมน์ไม่ตรง แล้วสร้างใหม่ + ใส่ข้อมูลให้เอง
async function setupDatabase() {
  const client = await pool.connect();
  try {
    console.log('กำลังเตรียมฐานข้อมูล...');

    // ลบตารางเก่าทั้งหมดที่อาจตกค้างจากการทดลองก่อนหน้า
    await client.query(`DROP TABLE IF EXISTS students CASCADE`);
    await client.query(`DROP TABLE IF EXISTS "students0.1" CASCADE`);

    // สร้างตารางใหม่ให้คอลัมน์ตรงกับที่โค้ดต้องการ
    await client.query(`
      CREATE TABLE students (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(20) NOT NULL,
        student_name VARCHAR(255) NOT NULL
      )
    `);

    // ใส่ข้อมูลนักศึกษาทั้งหมด
    for (const [studentId, studentName] of STUDENTS) {
      await client.query(
        `INSERT INTO students (student_id, student_name) VALUES ($1, $2)`,
        [studentId, studentName]
      );
    }

    console.log(`เตรียมฐานข้อมูลสำเร็จ: ใส่ข้อมูลนักศึกษาไปแล้ว ${STUDENTS.length} คน`);
  } catch (err) {
    console.error('!!! เตรียมฐานข้อมูลล้มเหลว:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

const server = http.createServer(async (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  let client;
  try {
    // 3. ขอเชื่อมต่อและส่งคำสั่ง SQL ไปดึงข้อมูลจากตาราง students
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

// เตรียมฐานข้อมูลก่อน แล้วค่อยเปิด server
setupDatabase()
  .then(() => {
    server.listen(port, () => {
      console.log(`Server is running on port: ${port}`);
    });
  })
  .catch((err) => {
    console.error('ไม่สามารถเริ่ม server ได้ เพราะเตรียมฐานข้อมูลล้มเหลว:', err.message);
    process.exit(1);
  });
