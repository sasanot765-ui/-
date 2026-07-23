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
