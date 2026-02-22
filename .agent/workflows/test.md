---
description: مسار اختبار عميل شامل لمنصة Stratix — يُطبّق مع كل تحديث
---

# مسار اختبار العميل

## المتطلبات
- السيرفر يعمل على `http://localhost:3000`
- بيانات الدخول: `admin@stratix.com` / `Admin123!`

## الخطوات

### 1. تشغيل السيرفر
```bash
cd "/Users/ali/startix featires" && node server.js
```

### 2. فحص APIs السريع
```bash
// turbo
cd "/Users/ali/startix featires" && node -e '
const http=require("http"),d=JSON.stringify({email:"admin@stratix.com",password:"Admin123!"});
const r=http.request({hostname:"localhost",port:3000,path:"/api/auth/login",method:"POST",headers:{"Content-Type":"application/json","Content-Length":d.length}},(res)=>{let b="";res.on("data",c=>b+=c);res.on("end",()=>{const t=JSON.parse(b).token;const eps=["/api/dashboard/stats","/api/strategic/objectives","/api/strategic/kpis","/api/strategic/initiatives","/api/risks","/api/assessments","/api/versions","/api/financial","/api/integrations","/api/corrections/diagnoses","/api/analysis/points","/api/scenarios","/api/stakeholders"];let done=0;const results=[];eps.forEach(ep=>{const q=http.request({hostname:"localhost",port:3000,path:ep,method:"GET",headers:{"Authorization":"Bearer "+t}},(r)=>{let b="";r.on("data",c=>b+=c);r.on("end",()=>{results.push({ep,s:r.statusCode});done++;if(done===eps.length){results.sort((a,b)=>a.s-b.s);results.forEach(r=>console.log(r.s<300?"✅":"❌",r.s,r.ep));console.log("\n"+results.filter(r=>r.s<300).length+"/"+eps.length+" APIs OK");process.exit();}});});q.end();});});});r.write(d);r.end();'
```

### 3. فتح المتصفح وتسجيل الدخول
- افتح `http://localhost:3000/login.html`
- أدخل البريد والباسورد
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

### 5. اختبار CRUD (إنشاء/قراءة/تعديل/حذف)
- **أنشئ** هدف اختباري في `/objectives.html`
- **تحقق** أنه يظهر في القائمة
- **عدّل** اسمه
- **احذفه** وتحقق من الاختفاء

### 6. اختبار المستشار الذكي
- تحقق من الزر 🤖 في كل صفحة
- افتح اللوحة وتحقق من الاقتراحات
- تحقق من Nudge tooltip

### 7. اختبار تسجيل الخروج
- اضغط خروج
- حاول فتح `/dashboard.html` → يجب إعادة التوجيه لـ login

### 8. مرجع مفصل
لمزيد من التفاصيل، راجع: `TEST-WORKFLOW.md` في جذر المشروع
