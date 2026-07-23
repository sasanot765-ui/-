const http = require('http');
// 1. เรียกใช้งาน Pool จากไลบรารี pg สำหรับจัดการการเชื่อมต่อฐานข้อมูล
const { Pool } = require('pg');

// 2. ตั้งค่าการเชื่อมต่อ โดยดึง URL มาจาก Environment Variable ของ Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const port = process.env.PORT || 3000;

// ฟังก์ชันเตรียมฐานข้อมูล: ลบตารางเก่า (ถ้ามี) แล้วสร้างใหม่ให้ตรงกับโค้ด
// พร้อมเพิ่มข้อมูลนักศึกษาตั้งต้น
async function setupDatabase() {
  const client = await pool.connect();
  try {
    // ลบตารางเก่าทิ้งก่อน เผื่อโครงสร้าง/ชื่อคอลัมน์เดิมไม่ตรงกัน
    // (คำเตือน: คำสั่งนี้จะลบข้อมูลเดิมในตาราง students ทั้งหมด)
    await client.query(`DROP TABLE IF EXISTS students`);

    // สร้างตารางใหม่ให้มีคอลัมน์ตรงกับที่โค้ดใช้งาน
    await client.query(`
      CREATE TABLE students (
        student_id VARCHAR(20) PRIMARY KEY,
        student_name VARCHAR(255) NOT NULL
      )
    `);

    // เพิ่มข้อมูลนักศึกษา (ถ้ามี student_id นี้อยู่แล้วจะไม่เพิ่มซ้ำ)
    await client.query(
      `INSERT INTO students (student_id, student_name)
       VALUES ($1, $2)
       ON CONFLICT (student_id) DO NOTHING`,
      ['69319011159', 'มานะเพชร ขันเงิน']
    );

    console.log('Database setup complete.');
  } catch (err) {
    console.error('Setup error:', err.message);
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

    // 4. นำข้อมูลที่ได้ (result.rows) มาประกอบเป็นตาราง HTML
    let html = `<h1>ฐานข้อมูลนักศึกษา (ทดสอบการเชื่อมต่อ)</h1>`;
    html += `<table border="1" cellpadding="10">`;
    html += `<tr><th>รหัสนักศึกษา</th><th>ชื่อ-นามสกุล</th></tr>`;

    // วนลูปนำข้อมูลแต่ละแถวมาแสดง
    result.rows.forEach(row => {
      html += `<tr><td>${row.student_id}</td><td>${row.student_name}</td></tr>`;
    });

    html += `</table>`;
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
setupDatabase().then(() => {
  server.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
  });
});
