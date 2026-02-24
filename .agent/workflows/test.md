---
description: مسار اختبار عميل شامل لمنصة Stratix — يُطبّق مع كل تحديث
---

# مسار اختبار العميل

## المتطلبات
- السيرفر يعمل على `http://localhost:3000`
- **بيانات Super Admin:** `superadmin@stratix.com` / `Super123!`

## الخطوات

### 1. تشغيل السيرفر
```bash
cd "/Users/ali/startix featires" && node server.js
```

### 2. فحص APIs السريع (31 API)
```bash
// turbo
cd "/Users/ali/startix featires" && node -e '
const http=require("http"),d=JSON.stringify({email:"superadmin@stratix.com",password:"Super123!"});
const r=http.request({hostname:"localhost",port:3000,path:"/api/auth/login",method:"POST",headers:{"Content-Type":"application/json","Content-Length":d.length}},(res)=>{let b="";res.on("data",c=>b+=c);res.on("end",()=>{
const t=JSON.parse(b).token;
const eps=[
"/api/auth/profile","/api/dashboard/stats","/api/strategic/objectives","/api/strategic/kpis",
"/api/strategic/initiatives","/api/risks","/api/assessments","/api/versions","/api/financial",
"/api/integrations","/api/corrections/diagnoses","/api/analysis/points","/api/scenarios",
"/api/admin/stats","/api/admin/users","/api/admin/companies","/api/admin/alerts",
"/api/companies","/api/sectors","/api/entities","/api/users","/api/strategic/reviews",
"/api/choices","/api/directions","/api/kpi-entries","/api/activities","/api/audit",
"/api/comments","/api/tools","/api/ai-advisor/context?entityId=cmly5y3eh0004e1j643wy7wac",
"/api/ai-advisor/tool-chain/cmly5y3eh0004e1j643wy7wac"
];
let done=0;const results=[];
eps.forEach(ep=>{
const q=http.request({hostname:"localhost",port:3000,path:ep,method:"GET",headers:{"Authorization":"Bearer "+t}},(r)=>{let b="";r.on("data",c=>b+=c);r.on("end",()=>{results.push({ep:ep.split("?")[0],s:r.statusCode});done++;if(done===eps.length){results.sort((a,b)=>a.s-b.s);results.forEach(r=>console.log(r.s<300?"✅":"❌",r.s,r.ep));const ok=results.filter(r=>r.s<300).length;console.log("\n📊 "+ok+"/"+eps.length+" APIs OK");process.exit();}});});q.end();});
});});r.write(d);r.end();'
```

### 3. فتح المتصفح وتسجيل الدخول
- افتح `http://localhost:3000/login.html`
- أدخل: `superadmin@stratix.com` / `Super123!`
- تحقق من التحويل للوحة التحكم

### 4. فحص الصفحات الأساسية
افتح كل صفحة وتحقق أنها تحمل:
- `/dashboard.html` — لوحة التحكم + الخيط الذهبي
- `/objectives.html` — الأهداف الاستراتيجية
- `/kpis.html` — مؤشرات الأداء
- `/initiatives.html` — المبادرات
- `/risk-map.html` — خريطة المخاطر
- `/stakeholders.html` — أصحاب المصلحة
- `/swot.html` — تحليل SWOT
- `/admin-dashboard.html` — لوحة الأدمن (Super Admin فقط)

### 5. اختبار CRUD (إنشاء/قراءة/تعديل/حذف)
- **أنشئ** هدف اختباري في `/objectives.html`
- **تحقق** أنه يظهر في القائمة
- **عدّل** اسمه
- **احذفه** وتحقق من الاختفاء

### 6. اختبار لوحة الأدمن
- افتح `/admin-dashboard.html`
- تحقق من إحصائيات النظام (مستخدمين، شركات، تنبيهات)
- أنشئ مستخدم جديد ← تحقق من ظهوره ← احذفه
- تحقق من التنبيهات المركزية

### 7. اختبار المستشار الذكي
- تحقق من الزر 🤖 في كل صفحة
- افتح اللوحة وتحقق من الاقتراحات
- تحقق من Nudge tooltip

### 8. اختبار تسجيل الخروج
- اضغط خروج
- حاول فتح `/dashboard.html` → يجب إعادة التوجيه لـ login

### 9. اختبار CRUD Admin (API)
```bash
// turbo
cd "/Users/ali/startix featires" && node -e '
const http = require("http");
function request(method, path, token, data) {
    return new Promise((resolve) => {
        const body = data ? JSON.stringify(data) : null;
        const headers = { "Authorization": "Bearer " + token, "Content-Type": "application/json" };
        if (body) headers["Content-Length"] = Buffer.byteLength(body);
        const r = http.request({ hostname: "localhost", port: 3000, path, method, headers }, (res) => {
            let b = ""; res.on("data", c => b += c); res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(b) }));
        });
        if (body) r.write(body);
        r.end();
    });
}
async function test() {
    const login = await request("POST", "/api/auth/login", "", { email: "superadmin@stratix.com", password: "Super123!" });
    const token = login.body.token;
    console.log("1️⃣ Login:", login.status === 200 ? "✅" : "❌");
    const create = await request("POST", "/api/admin/users", token, { name: "Test CRUD", email: "crud-test@stratix.com", password: "Test@123" });
    console.log("2️⃣ Create:", create.status === 201 ? "✅" : "❌");
    const uid = create.body.data?.id;
    if (!uid) { process.exit(1); }
    const patch = await request("PATCH", "/api/admin/users/" + uid, token, { name: "Updated", disabled: true });
    console.log("3️⃣ Update:", patch.status === 200 ? "✅" : "❌");
    const blocked = await request("POST", "/api/auth/login", "", { email: "crud-test@stratix.com", password: "Test@123" });
    console.log("4️⃣ Disabled block:", blocked.status === 403 ? "✅" : "❌");
    const del = await request("DELETE", "/api/admin/users/" + uid, token);
    console.log("5️⃣ Delete:", del.status === 200 ? "✅" : "❌");
    console.log("🏁 CRUD test complete!");
    process.exit(0);
}
test();'
```
