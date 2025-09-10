# מטלת סקר קוד - Coding Standards Assignment

## תיאור המטלה

מטלה זו עוסקת ביצירה מכוונת של קוד שמפר סטנדרטי קידוד, ולאחר מכן ביצוע סקר קוד מקיף לזיהוי ותיקון ההפרות.

## מבנה הפרויקט

### ענפים (Branches)

1. **`problematic-code`** - מכיל את הקוד הבעייתי עם 7 הפרות מכוונות
2. **`corrected-code`** - מכיל את הקוד המתוקן עם כל התיקונים

### קבצים מרכזיים

- **`src/pages/AdminStudentManagement.tsx`** - הקובץ הראשי שנבחר למטלה
- **`code-review-documentation.md`** - תיעוד מפורט של כל ההפרות והתיקונים
- **`reflection.md`** - רפלקציה אישית על תהליך הלמידה

## איך לנווט בין הענפים

```bash
# לעבור לענף הקוד הבעייתי
git checkout problematic-code

# לעבור לענף הקוד המתוקן
git checkout corrected-code

# לראות רשימת כל הענפים
git branch -a
```

## הסטנדרטים שהופרו

1. **Function Naming** - שמות פונקציות לא ב-camelCase
2. **Resposivness** - גדלים קבוע ולא באופן יחסי למסך  
3. **Type Naming** - שמות טיפוסים לא ב-PascalCase
4. **Component Naming** - שם קומפוננטה לא ב-PascalCase
5. **CSS Naming** - שמות מחלקות CSS לא ב-kebab-case
6. **CSS Best Practices** - שימוש ב-inline styles במקום מחלקות
7. **HTML Best Practices** - שימוש ב-div גנרי במקום תגיות סמנטיות

## היסטוריית Commits

כל הפרה ותיקון נעשו בcommit נפרד לצורך מעקב מדויק:

### Problematic Code Branch
- Clean project structure
- VIOLATION #1: Function Naming
- VIOLATION #2: Resposivness  
- VIOLATION #3: Type Naming
- VIOLATION #4: Component Naming
- VIOLATION #5: CSS Naming
- VIOLATION #6: CSS Inline Styles
- VIOLATION #7: HTML Semantic Tags

### Corrected Code Branch
- FIX #1: Function Naming
- FIX #2: Responsivness
- FIX #3: Type Naming  
- FIX #4: Component Naming
- FIX #5: CSS Naming
- FIX #6: CSS Best Practices
- FIX #7: HTML Best Practices

## הרצת הפרויקט

```bash
# התקנת תלויות
npm install

# הרצת הפרויקט
npm run dev
```

הפרויקט יעבד בשני הענפים - הקוד הבעייתי והמתוקן כאחד פונקציונליים ויעבדו כראוי. 