
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, Upload, CheckSquare, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Help() {
  const howItWorks = [
    {
      title: "1. העלאת קבצים",
      description: "סטודנטים מעלים חומרי לימוד כמו סיכומים, מבחנים ודפי נוסחאות ומשייכים אותם לקורס הרלוונטי.",
      icon: <Upload className="w-6 h-6 text-lime-700 dark:text-lime-300" />,
      color: "bg-lime-100 dark:bg-lime-900/50"
    },
    {
      title: "2. אישור מרצה",
      description: "כל קובץ עובר בדיקה ואישור של המרצה המלמד בקורס כדי להבטיח את איכות ודיוק התכנים.",
      icon: <CheckSquare className="w-6 h-6 text-lime-700 dark:text-lime-300" />,
      color: "bg-lime-100 dark:bg-lime-900/50"
    },
    {
      title: "3. שיתוף ולימוד",
      description: "לאחר האישור, הקבצים זמינים לכלל הסטודנטים בקורס, ויוצרים מאגר ידע קהילתי עשיר.",
      icon: <BarChart3 className="w-6 h-6 text-lime-700 dark:text-lime-300" />,
      color: "bg-lime-100 dark:bg-lime-900/50"
    }
  ];

  const faqs = [
    {
      question: "איך אני מעלה קובץ חדש?",
      answer: "פשוט! נווטו לעמוד 'העלאת קובץ' מהתפריט הראשי, מלאו את פרטי הקובץ, בחרו את הקורס הרלוונטי וצרפו את הקובץ מהמחשב שלכם."
    },
    {
      question: "איפה אני יכול לראות את סטטוס הקבצים שהעליתי?",
      answer: "כל הקבצים שהעליתם, יחד עם הסטטוס העדכני שלהם (ממתין, אושר, נדחה), מרוכזים בעמוד 'הקבצים שלי'."
    },
    {
      question: "הקובץ שלי נדחה, מה לעשות?",
      answer: "אם קובץ נדחה, ייתכן שהוא לא עמד בהנחיות האיכות או התוכן של הקורס. לעיתים המרצה יוסיף הערה. תוכלו לערוך את הפרטים ולהעלות גרסה מתוקנת."
    },
    {
      question: "האם אני יכול למחוק קובץ לאחר שהועלה?",
      answer: "כן, כל עוד הקובץ נמצא בסטטוס 'ממתין' לאישור, תוכלו למחוק אותו מעמוד 'הקבצים שלי'. לאחר שהקובץ אושר, לא ניתן למחוק אותו כדי לשמור על רצף המידע לכלל הסטודנטים."
    }
  ];

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen flex flex-col" dir="rtl">
       <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(100%) skewX(-15deg);
          }
          100% {
            transform: translateX(-100%) skewX(-15deg);
          }
        }

        .shimmer-effect::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          transform: translateX(100%) skewX(-15deg);
          background: linear-gradient(to right, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0) 100%);
          animation: shimmer 4s infinite linear;
          z-index: 1;
        }

        .shimmer-effect > * {
          position: relative;
          z-index: 2;
        }
      `}</style>
      <div className="max-w-7xl mx-auto flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-8">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-lime-500 to-lime-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                    <HelpCircle className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-200">מרכז העזרה</h1>
            </div>
            <p className="text-slate-500 mt-2 max-w-2xl dark:text-slate-300">
                מצאו תשובות לשאלות נפוצות ומדריכים לשימוש במערכת.
            </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 flex-1">
          {/* How it works Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 text-right dark:text-gray-200">איך המערכת עובדת?</h2>
            {howItWorks.map((step) => (
              <div key={step.title} className="flex items-start gap-4 text-right">
                <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl ${step.color}`}>
                    {step.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-gray-200">{step.title}</h3>
                  <p className="text-slate-600 dark:text-gray-300">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* FAQ Section */}
          <div className="space-y-4">
             <h2 className="text-2xl font-bold text-slate-800 text-right dark:text-gray-200">שאלות נפוצות</h2>
             <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  value={`item-${index}`} 
                  key={index}
                  className="border-b dark:border-slate-700"
                >
                  <AccordionTrigger className="text-right font-semibold text-base text-slate-800 hover:no-underline py-4 dark:text-gray-200 dark:hover:text-gray-100">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm pb-4 dark:text-slate-300">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* Contact Section - Fixed to bottom */}
        <div className="mt-auto pt-6">
          <Card className="border-0 shadow-xl bg-gradient-to-r from-lime-500 to-lime-600 text-white relative overflow-hidden shimmer-effect">
            <div className="absolute inset-0 bg-black/10 z-0"></div>
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-bold mb-3">צריך עזרה נוספת?</h3>
              <p className="text-lime-100 mb-4">
                אם לא מצאת את התשובה שחיפשת, אנחנו כאן לעזור
              </p>
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => window.open('tel:+972525551981', '_self')}
                  className="bg-white text-lime-700 dark:bg-slate-800 dark:text-white hover:bg-lime-100 hover:text-lime-800 dark:hover:bg-lime-100 dark:hover:text-lime-800 border-2 border-transparent hover:border-lime-200 dark:hover:border-lime-200 px-5 py-2 rounded-lg font-semibold transition-all duration-300"
                >
                  צור קשר
                </button>
                <Link to={createPageUrl("TrackInquiries?new=true")}>
                  <button className="border-2 border-white text-white px-5 py-2 rounded-lg font-semibold hover:bg-lime-100 hover:text-lime-800 hover:border-lime-200 dark:hover:bg-lime-100 dark:hover:text-lime-800 dark:hover:border-lime-200 transition-all duration-300">
                    שלח פנייה
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
