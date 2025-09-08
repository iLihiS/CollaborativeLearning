# מטלת סקר קוד - תיעוד הפרות וסטנדרטים

## פרטי ההגשה

**קישור לריפוזיטורי GitHub:** https://github.com/iLihiS/CollaborativeLearning

**ענפים:**
- `main` / `problematic-code` - קוד בעייתי עם הפרות מכוונות
- `corrected-code` - קוד מתוקן

---

## תיעוד הפרות הסטנדרטים

### הפרה #1: Function Naming Standard

**הסטנדרט שהופר:** שמות פונקציות צריכים להיות ב-camelCase

**קטע הקוד הבעייתי:**
```typescript
// קובץ: src/pages/AdminStudentManagement.tsx, שורות 59-61
/* ❌ VIOLATION: Function Naming Standard - Functions should use camelCase */
const load_data = async () => {
  setLoading(true);
```

**הסבר השגיאה:** על פי הסטנדרט שנלמד בקורס, שמות פונקציות צריכים להיות ב-camelCase כדי לשפר קריאות ועקביות הקוד. השם `load_data` כתוב ב-snake_case במקום ב-camelCase הנדרש.

**קטע הקוד המתוקן:**
```typescript
/* ✅ FIXED: Function Naming Standard - Now uses camelCase */
const loadData = async () => {
  setLoading(true);
```

---

### הפרה #2: Variable Naming Standard

**הסטנדרט שהופר:** שמות משתנים צריכים להיות ב-camelCase

**קטע הקוד הבעייתי:**
```typescript
// קובץ: src/pages/AdminStudentManagement.tsx, שורות 22-26
/* ❌ VIOLATION: Variable Naming Standard - Variables should use camelCase */
const [Filtered_Students, setFiltered_Students] = useState<student_data[]>([]);
/* ❌ VIOLATION: Variable Naming Standard - Variables should use camelCase */
const [Is_Dialog_Open, setIs_Dialog_Open] = useState(false);
```

**הסבר השגיאה:** המשתנים `Filtered_Students` ו-`Is_Dialog_Open` משלבים PascalCase עם snake_case, בניגוד לסטנדרט שקובע שמשתנים צריכים להיות ב-camelCase בלבד.

**קטע הקוד המתוקן:**
```typescript
/* ✅ FIXED: Variable Naming Standard - Now uses camelCase */
const [filteredStudents, setFilteredStudents] = useState<StudentData[]>([]);
/* ✅ FIXED: Variable Naming Standard - Now uses camelCase */
const [isDialogOpen, setIsDialogOpen] = useState(false);
```

---

### הפרה #3: Type Naming Standard

**הסטנדרט שהופר:** שמות טיפוסים צריכים להיות ב-PascalCase

**קטע הקוד הבעייתי:**
```typescript
// קובץ: src/pages/AdminStudentManagement.tsx, שורות 6-9, 11-14, 16-19, 21-24
/* ❌ VIOLATION: Type Naming Standard - Types should use PascalCase */
type student_data = {
  id: string;
  full_name: string;
};

/* ❌ VIOLATION: Type Naming Standard - Types should use PascalCase */
type academic_track_data = {
  id: string;
  name: string;
};
```

**הסבר השגיאה:** שמות הטיפוסים `student_data`, `academic_track_data`, `form_data`, `form_errors` כתובים ב-snake_case במקום ב-PascalCase הנדרש לטיפוסים בTypeScript.

**קטע הקוד המתוקן:**
```typescript
/* ✅ FIXED: Type Naming Standard - Now uses PascalCase */
type StudentData = {
  id: string;
  full_name: string;
};

/* ✅ FIXED: Type Naming Standard - Now uses PascalCase */
type AcademicTrackData = {
  id: string;
  name: string;
};
```

---

### הפרה #4: Component Naming Standard

**הסטנדרט שהופר:** שמות קומפוננטות צריכים להיות ב-PascalCase

**קטע הקוד הבעייתי:**
```typescript
// קובץ: src/pages/AdminStudentManagement.tsx, שורה 19
/* ❌ VIOLATION: Component Naming Standard - Components should use PascalCase */
export default function admin_student_management() {
```

**הסבר השגיאה:** שם הקומפוננטה `admin_student_management` כתוב ב-snake_case במקום ב-PascalCase, מה שפוגע בקונבנציה המקובלת ב-React ומקשה על זיהוי קומפוננטות בקוד.

**קטע הקוד המתוקן:**
```typescript
/* ✅ FIXED: Component Naming Standard - Now uses PascalCase */
export default function AdminStudentManagement() {
```

---

### הפרה #5: CSS Naming Standard

**הסטנדרט שהופר:** שמות מחלקות CSS צריכים להיות ב-kebab-case

**קטע הקוד הבעייתי:**
```typescript
// קובץ: src/pages/AdminStudentManagement.tsx, שורות שונות
/* ❌ VIOLATION: CSS Naming Standard - Class names should use kebab-case */
<div className="MainContainer">
<Button className="BackButton">
<div className="HeaderSection">
<div className="TitleContainer">
<Avatar className="TitleAvatar">
```

**הסבר השגיאה:** שמות המחלקות כתובים ב-PascalCase במקום ב-kebab-case הנדרש. לפי הסטנדרט, שמות מחלקות CSS צריכים להיות באותיות קטנות עם מקפים לחיבור מילים.

**קטע הקוד המתוקן:**
```typescript
/* ✅ FIXED: CSS Naming Standard - Now uses kebab-case */
<Box className="main-container">
<Button className="back-button">
<Box className="header-section">
<Box className="title-container">
<Avatar className="title-avatar">
```

---

### הפרה #6: CSS Best Practices - Inline Styles

**הסטנדרט שהופר:** העדפת מחלקות CSS על פני inline styles

**קטע הקוד הבעייתי:**
```typescript
// קובץ: src/pages/AdminStudentManagement.tsx, שורות שונות
/* ❌ VIOLATION: CSS Best Practices - Should use CSS classes instead of inline styles */
<div className="MainContainer" style={{ padding: '16px', backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
<Button style={{ marginBottom: '24px', borderColor: '#1976d2' }}>
<form style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
```

**הסבר השגיאה:** השימוש ב-inline styles (תכונת `style`) במקום במחלקות CSS פוגע בהפרדה בין תוכן לעיצוב, מקשה על תחזוקה ומונע שימוש חוזר בסגנונות.

**קטע הקוד המתוקן:**
```typescript
/* ✅ FIXED: CSS Best Practices - Now uses proper MUI sx props instead of inline styles */
<Box component="main" className="main-container" sx={{ p: 2, bgcolor: 'var(--bg-primary)', minHeight: '100vh' }}>
<Button className="back-button" sx={{ mb: 3 }}>
<Box component="form" className="form-container" sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
```

---

### הפרה #7: HTML Best Practices - Semantic Tags

**הסטנדרט שהופר:** שימוש בתגיות סמנטיות במקום תגי div גנריים

**קטע הקוד הבעייתי:**
```typescript
// קובץ: src/pages/AdminStudentManagement.tsx, שורות 147, 153
/* ❌ VIOLATION: HTML Best Practices - Should use semantic tags like <main> instead of <div> */
<div className="MainContainer">
/* ❌ VIOLATION: HTML Best Practices - Should use semantic tags like <header> instead of <div> */
<div className="HeaderSection">
```

**הסבר השגיאה:** השימוש בתגי `<div>` גנריים במקום בתגיות סמנטיות כמו `<main>` ו-`<header>` פוגע בנגישות האתר ובהבנת המבנה על ידי קוראי מסך וכלי חיפוש.

**קטע הקוד המתוקן:**
```typescript
/* ✅ FIXED: HTML Best Practices - Now uses semantic tags */
<Box component="main" className="main-container">
/* ✅ FIXED: HTML Best Practices - Now uses semantic <header> tag */
<Box component="header" className="header-section">
```

---

## סיכום

בסך הכל זוהו ותוקנו 7 הפרות של סטנדרטי קידוד שונים:
1. **Function Naming** - מ-snake_case ל-camelCase
2. **Variable Naming** - מ-mixed case ל-camelCase
3. **Type Naming** - מ-snake_case ל-PascalCase  
4. **Component Naming** - מ-snake_case ל-PascalCase
5. **CSS Naming** - מ-PascalCase ל-kebab-case
6. **CSS Best Practices** - מ-inline styles ל-CSS classes/MUI sx
7. **HTML Best Practices** - מ-generic divs לsemantic tags

כל הפרה תוקנה בהתאם לסטנדרטים שנלמדו בקורס ותועדה בהתאם למחוון ההערכה. 