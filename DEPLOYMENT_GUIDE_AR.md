# دليل رفع ونشر موقع تخرج معهد التمريض (دفعة 2027)
## GitHub + Netlify + Firebase Hosting & Firestore

تم تجهيز ملفات الإعداد تلقائياً داخل المشروع (`netlify.toml`، `firebase.json`، `.firebaserc`) حتى يعمل الموقع مباشرة بدون أي أخطاء في التوجيه (SPA Routing) ومع بقاء الاتصال بقاعدة بيانات **Firebase Firestore** ونظام تسجيل الدخول **Firebase Auth**.

---

## أولاً: رفع المشروع على GitHub (كت هب)

### الطريقة الأسهل (مباشرة من AI Studio):
1. من القائمة العلوية في واجهة AI Studio اضغط على أيقونة **GitHub / Export to GitHub**.
2. سجّل دخولك بحسابك في GitHub واختر اسم المستودع (مثلاً: `nursing-grad-2027`).
3. اضغط **Create / Push** ليتم رفع الكود بالكامل إلى حسابك.

### أو عبر الأوامر (إذا قمت بتحميل المشروع ZIP على حاسبتك):
افتح Terminal أو Git Bash داخل مجلد المشروع ونفّذ:
```bash
git init
git add .
git commit -m "Initial commit - Nursing Cohort 2027"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git push -u origin main
```

---

## ثانياً: ربط المشروع ونشره على Netlify (نيتلافي)

بفضل ملف `netlify.toml` المضاف في المشروع، سيتعرف Netlify على الإعدادات تلقائياً:

1. ادخل إلى موقع [app.netlify.com](https://app.netlify.com) وسجّل الدخول بحسابك (يفضل عبر GitHub).
2. اضغط على **Add new site** ثم اختر **Import an existing project**.
3. اختر **GitHub** وحدد مستودع المشروع (`nursing-grad-2027`).
4. ستظهر لك إعدادات البناء جاهزة تلقائياً:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. اضغط **Deploy site**. خلال دقيقة واحدة سيعطيك رابط موقعك مثل:
   `https://nursing-grad-2027.netlify.app`

---

## ثالثاً: تفعيل تسجيل الدخول وقاعدة بيانات Firebase مع رابط Netlify

البيانات والطلاب والدفعات مربوطة فعلياً بقاعدة بيانات **Firebase Firestore** الخاصة بمشروعك (`gen-lang-client-0648817247`).
لكي يعمل **تسجيل الدخول بحساب Google** على رابط Netlify الجديد بدون حظر أمني:

1. افتح لوحة تحكم Firebase: [console.firebase.google.com](https://console.firebase.google.com)
2. اختر مشروعك: `gen-lang-client-0648817247`
3. من القائمة الجانبية ادخل إلى **Authentication** ثم تبويب **Settings** ثم **Authorized domains** (النطاقات المصرح بها).
4. اضغط **Add domain** وأضف رابط موقعك في نيتلافي (مثلاً: `nursing-grad-2027.netlify.app`).

---

## رابعاً: الاستضافة المباشرة على Firebase Hosting (بديل أو إضافي لـ Netlify)

إذا أردت استضافة الموقع نفسه على **Firebase Hosting** بجانب قاعدة البيانات (ملف `firebase.json` و `.firebaserc` جاهزان في المشروع):

1. افتح Terminal في مجلد المشروع على حاسبتك وثبّت أدوات Firebase:
   ```bash
   npm install -g firebase-tools
   ```
2. سجّل الدخول بحسابك في Google (`mustafaaalihassonkazh@gmail.com`):
   ```bash
   firebase login
   ```
3. ابنِ نسخة الإنتاج للموقع:
   ```bash
   npm run build
   ```
4. انشر الموقع على استضافة Firebase Hosting:
   ```bash
   firebase deploy --only hosting
   ```
5. سيظهر لك الرابط الرسمي المجاني من فايربيس مباشرة:
   `https://gen-lang-client-0648817247.web.app`
   (والميزة هنا أن النطاق مضاف ومصرح به تلقائياً في Firebase Authentication وقاعدة البيانات).
