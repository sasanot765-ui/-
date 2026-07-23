const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;
// 1. ตั้งคาให Server อานขอมูลที่สงมาจากฟอรม (HTML Form) ได
app.use(express.urlencoded({ extended: true }));
// 2. ตั้งคาเชื่อมตอฐานขอมูล PostgreSQL
const pool = new Pool({
connectionString: process.env.DATABASE_URL,
});
// ---------------------------------------------------------
// เสนทางที่ 1: (GET /) เมื่อเปดหนาเว็บหลัก ใหแสดงฟอรมและตารางขอมูล
// ---------------------------------------------------------
app.get('/', async (req, res) => {
try {
const client = await pool.connect();
// ดึงขอมูลทั้งหมด เรียงตาม ID
const result = await client.query('SELECT * FROM students ORDER BY id ASC');
client.release();
// สรางหนาเว็บ HTML (มีฟอรมสําหรับกรอกขอมูล และตารางแสดงผล)
let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">

<title>ระบบจัดการนักศึกษา</title>
<style>
body { font-family: Tahoma, sans-serif; padding: 20px; background-color:
#f4f7f6; }
.container { max-width: 800px; margin: 0 auto; background: white; padding:
20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
table { width: 100%; border-collapse: collapse; margin-top: 20px; }
th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
th { background-color: #007bff; color: white; }
input[type="text"] { width: 100%; padding: 8px; margin: 8px 0; border: 1px
solid #ccc; border-radius: 4px; box-sizing: border-box; }
.btn-add { background-color: #28a745; color: white; padding: 10px 15px;
border: none; border-radius: 4px; cursor: pointer; }
.btn-delete { background-color: #dc3545; color: white; padding: 5px 10px;
border: none; border-radius: 4px; cursor: pointer; }
</style>
</head>
<body>
<div class="container">
<h2>➕ เพิ่มขอมูลนักศึกษาใหม</h2>
<!-- ฟอรมนี้จะสงขอมูลไปที่ /add ดวยวิธี POST -->
<form action="/add" method="POST" style="margin-bottom: 30px;">

<label>รหสันักศึกษา:</label>

<input type="text" name="student_id" placeholder="กรอกรหัสนักศึกษา"
required>
<label>ชื่อ-นามสกุล:</label>

<input type="text" name="student_name" placeholder="กรอกชื่อ-
นามสกุล" required>

<button type="submit" class="btn-add">บันทึกขอมูล</button>
</form>
<h2>ഹഺ഻഼ഽാ รายชื่อนักศึกษาในระบบ</h2>
<table>
<tr><th>ID ระบบ</th><th>รหัสนักศึกษา</th><th>ชื่อ-นามสกุล</th><th>
จัดการ</th></tr>

`;
// นําขอมูลจากฐานขอมูลมาวนลูปแสดงในตาราง
result.rows.forEach(row => {
html += `
<tr>
<td>${row.id}</td>
<td>${row.student_id}</td>
<td>${row.student_name}</td>
<td style="text-align: center;">
<!-- ปุมลบ จะสง id ไปท่ี/delete -->

<form action="/delete" method="POST" style="margin:0;">
<input type="hidden" name="id" value="${row.id}">
<button type="submit" class="btn-delete" onclick="return
confirm('ยืนยันการลบขอมูลนี้?')">ลบ</button>
</form>
</td>
</tr>
`;
});
html += `
</table>
</div>
</body>
</html>
`;
res.send(html);
} catch (err) {
res.send(`เกิดขอผิดพลาด: ${err.message}`);
}
});
