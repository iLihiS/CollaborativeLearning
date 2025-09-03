# רשימת בדיקות להגדרת Firestore

## בעיה נוכחית: שגיאה 400 ב-Firestore

### 🔍 בדיקות נדרשות:

#### 1. ודא שהפרויקט קיים ב-Firebase Console
- [ ] לך ל-[Firebase Console](https://console.firebase.google.com/)
- [ ] ודא שהפרויקט "collaborativelearning-ono" קיים ונגיש
- [ ] ודא שיש לך הרשאות לפרויקט

#### 2. הפעל את Firestore Database
- [ ] לך לפרויקט ב-Firebase Console
- [ ] לחץ על "Firestore Database" בתפריט השמאלי
- [ ] אם הוא לא מופעל, לחץ "Create database"
- [ ] בחר "Start in test mode" (לפיתוח)
- [ ] בחר מיקום (לדוגמה: europe-west3)

#### 3. הגדר כללי אבטחה
לך ל-Firestore Database > Rules והחלף את הכללים ב:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read and write access for development
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

לחץ "Publish"

#### 4. בדוק את מפתחות ה-API
- [ ] לך ל-Project Settings (גלגל השיניים)
- [ ] לך לכרטיסייה "General"
- [ ] גלול למטה ל-"Your apps"
- [ ] ודא שיש Web App
- [ ] אם אין, לחץ "Add app" ובחר Web
- [ ] העתק את ה-config המלא

#### 5. ודא שה-config נכון
הconfig שלך צריך להיראות כך:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB_dLHcwU9kfAZ2sd_w52Wk_hKRbD5Ee8g", // ✅
  authDomain: "collaborativelearning-ono.firebaseapp.com", // ✅
  projectId: "collaborativelearning-ono", // ✅
  storageBucket: "collaborativelearning-ono.firebasestorage.app", // ✅
  messagingSenderId: "34474671446", // ✅
  appId: "1:34474671446:web:f416421e9e20a5f1856af7", // ✅
  measurementId: "G-W51V007Y3E" // ✅
};
```

### 🔧 פתרונות אפשריים:

#### אם עדיין יש שגיאת 400:

1. **ודא שהפרויקט פעיל:**
   - לך ל-Firebase Console
   - ודא שהפרויקט לא מושעה או מושבת

2. **נסה ליצור פרויקט חדש:**
   - אם הבעיה נמשכת, ייתכן שיש בעיה עם הפרויקט הנוכחי
   - צור פרויקט חדש ב-Firebase Console
   - העתק את המפתחות החדשים

3. **ודא שה-API Keys נכונים:**
   - לכל פרויקט Firebase יש מפתחות ייחודיים
   - ודא שלא התבלבלת בין פרויקטים

4. **בדוק את רשת האינטרנט:**
   - ודא שיש חיבור לאינטרנט
   - נסה לגשת ל-Firebase Console מהדפדפן

### 📋 צעדים מיידיים:

1. רץ את האפליקציה: `npm run dev`
2. פתח את הקונסול בדפדפן (F12)
3. חפש הודעות מ-Firebase
4. אם יש שגיאת "permission-denied" - תקן את כללי האבטחה
5. אם יש שגיאת "project-not-found" - ודא את פרטי הפרויקט

### 🆘 אם כלום לא עוזר:

צור פרויקט Firebase חדש:
1. לך ל-[Firebase Console](https://console.firebase.google.com/)
2. לחץ "Add project"
3. תן שם חדש לפרויקט
4. עקב אחרי ההוראות
5. הפעל Firestore Database
6. העתק את ה-config החדש ל-`src/config/firebase.ts` 