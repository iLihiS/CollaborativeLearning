
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Accessibility, 
  Plus, 
  Minus, 
  Eye, 
  EyeOff, 
  Contrast,
  Search,
  Keyboard,
  Volume2,
  RotateCcw,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { User } from '@/api/entities';

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    fontSize: 100,
    highContrast: false,
    grayscale: false,
    highlightLinks: false,
    readableFont: false,
    hideImages: false,
    textSpacing: false,
    soundEnabled: false
  });
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('accessibilitySettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      applySettings(parsed);
    }

    // Load current theme
    const currentTheme = localStorage.getItem('theme') || 'light';
    setTheme(currentTheme);
  }, []);

  const saveSettings = (newSettings) => {
    localStorage.setItem('accessibilitySettings', JSON.stringify(newSettings));
    setSettings(newSettings);
    applySettings(newSettings);
  };

  const applySettings = (settings) => {
    const root = document.documentElement;
    
    // Font size - This now controls the root font size via a CSS variable
    root.style.setProperty('--accessibility-font-scale', `${settings.fontSize / 100}`);
    
    // Apply CSS classes based on settings
    root.classList.toggle('accessibility-high-contrast', settings.highContrast);
    root.classList.toggle('accessibility-grayscale', settings.grayscale);
    root.classList.toggle('accessibility-highlight-links', settings.highlightLinks);
    root.classList.toggle('accessibility-readable-font', settings.readableFont);
    root.classList.toggle('accessibility-hide-images', settings.hideImages);
    root.classList.toggle('accessibility-text-spacing', settings.textSpacing);
  };

  const adjustFontSize = (direction) => {
    const newSize = direction === 'increase' 
      ? Math.min(settings.fontSize + 5, 130)
      : Math.max(settings.fontSize - 5, 85);
    
    saveSettings({ ...settings, fontSize: newSize });
  };

  const toggleSetting = (key) => {
    saveSettings({ ...settings, [key]: !settings[key] });
  };

  const handleThemeChange = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    
    try {
      await User.updateMyUserData({ theme_preference: newTheme });
    } catch (error) {
      console.log("Could not save theme preference to user profile");
    }
  };

  const resetSettings = () => {
    const defaultSettings = {
      fontSize: 100,
      highContrast: false,
      grayscale: false,
      highlightLinks: false,
      readableFont: false,
      hideImages: false,
      textSpacing: false,
      soundEnabled: false
    };
    saveSettings(defaultSettings);
  };

  return (
    <>
      {/* Accessibility Styles */}
      <style>{`
        :root {
          /* Define the variable with a default value of 1 */
          --accessibility-font-scale: 1;
        }
        
        /* Apply font scaling to the root element. Tailwind uses 'rem' units which are relative to this, so everything scales proportionally. */
        html {
           font-size: calc(16px * var(--accessibility-font-scale));
        }
        
        .accessibility-high-contrast {
          filter: contrast(150%) !important;
        }
        
        .accessibility-grayscale {
          filter: grayscale(100%) !important;
        }
        
        .accessibility-highlight-links a {
          background-color: yellow !important;
          color: black !important;
          text-decoration: underline !important;
          border: 2px solid red !important;
          border-radius: 4px !important;
          padding: 2px 4px !important;
        }
        
        .accessibility-readable-font,
        .accessibility-readable-font * {
          font-family: Arial, Helvetica, sans-serif !important;
        }
        
        .accessibility-hide-images img,
        .accessibility-hide-images svg:not(.accessibility-keep) {
          display: none !important;
        }
        
        .accessibility-text-spacing * {
          line-height: 1.8 !important;
          letter-spacing: 0.05em !important;
          word-spacing: 0.1em !important;
        }
        
        /* Widget positioning */
        .accessibility-widget {
          position: fixed;
          left: 20px;
          bottom: 20px;
          z-index: 9999;
          direction: ltr;
        }
        
        .accessibility-panel {
          position: absolute;
          bottom: 70px;
          left: 0;
          width: 320px;
          max-height: 80vh;
          overflow-y: auto;
        }

        /* For desktop screens, remove the height limit and scrollbar */
        @media (min-width: 1024px) {
            .accessibility-panel {
                max-height: none;
                overflow-y: visible;
            }
        }
      `}</style>

      <div className="accessibility-widget">
        {/* Main Accessibility Button */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center"
          aria-label="פתח תפריט נגישות"
        >
          <Accessibility className="w-6 h-6 accessibility-keep" />
        </Button>

        {/* Accessibility Panel */}
        {isOpen && (
          <Card className="accessibility-panel shadow-2xl border-2 border-blue-200">
            <CardHeader className="pb-3" dir="rtl">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Accessibility className="w-5 h-5 text-blue-600 accessibility-keep" />
                  נגישות
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6"
                >
                  <X className="w-4 h-4 accessibility-keep" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4" dir="rtl">
              
              {/* Theme Toggle */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">ערכת נושא</h4>
                <Button
                  variant="outline"
                  onClick={handleThemeChange}
                  className="w-full justify-start gap-2 h-9"
                >
                  {theme === 'light' ? (
                    <>
                      <Moon className="w-4 h-4 accessibility-keep" />
                      מעבר למצב כהה
                    </>
                  ) : (
                    <>
                      <Sun className="w-4 h-4 accessibility-keep" />
                      מעבר למצב בהיר
                    </>
                  )}
                </Button>
              </div>

              <hr />

              {/* Font Size Controls */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">גודל טקסט</span>
                  <Badge variant="outline">{settings.fontSize}%</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => adjustFontSize('decrease')}
                    disabled={settings.fontSize <= 85}
                    className="h-8 w-8"
                  >
                    <Minus className="w-4 h-4 accessibility-keep" />
                  </Button>
                  <div className="flex-1 text-center text-sm">
                    {settings.fontSize === 100 ? 'רגיל' : settings.fontSize > 100 ? 'גדול' : 'קטן'}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => adjustFontSize('increase')}
                    disabled={settings.fontSize >= 130}
                    className="h-8 w-8"
                  >
                    <Plus className="w-4 h-4 accessibility-keep" />
                  </Button>
                </div>
              </div>

              <hr />

              {/* Visual Settings */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">הגדרות ויזואליות</h4>
                
                <div className="space-y-2">
                  <Button
                    variant={settings.highContrast ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSetting('highContrast')}
                    className="w-full justify-start gap-2 h-9"
                  >
                    <Contrast className="w-4 h-4 accessibility-keep" />
                    ניגודיות גבוהה
                  </Button>
                  
                  <Button
                    variant={settings.grayscale ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSetting('grayscale')}
                    className="w-full justify-start gap-2 h-9"
                  >
                    <Eye className="w-4 h-4 accessibility-keep" />
                    גווני אפור
                  </Button>
                  
                  <Button
                    variant={settings.hideImages ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSetting('hideImages')}
                    className="w-full justify-start gap-2 h-9"
                  >
                    <EyeOff className="w-4 h-4 accessibility-keep" />
                    הסתר תמונות
                  </Button>
                </div>
              </div>

              <hr />

              {/* Navigation Settings */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">הגדרות ניווט</h4>
                
                <div className="space-y-2">
                  <Button
                    variant={settings.highlightLinks ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSetting('highlightLinks')}
                    className="w-full justify-start gap-2 h-9"
                  >
                    <Keyboard className="w-4 h-4 accessibility-keep" />
                    הדגש קישורים
                  </Button>
                </div>
              </div>

              <hr />

              {/* Reading Settings */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">הגדרות קריאה</h4>
                
                <div className="space-y-2">
                  <Button
                    variant={settings.readableFont ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSetting('readableFont')}
                    className="w-full justify-start gap-2 h-9"
                  >
                    <span className="w-4 h-4 text-center font-bold accessibility-keep">Aa</span>
                    גופן קריא
                  </Button>
                  
                  <Button
                    variant={settings.textSpacing ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSetting('textSpacing')}
                    className="w-full justify-start gap-2 h-9"
                  >
                    <span className="w-4 h-4 text-center accessibility-keep">| |</span>
                    ריווח טקסט
                  </Button>
                </div>
              </div>

              <hr />

              {/* Reset Button */}
              <Button
                variant="outline"
                onClick={resetSettings}
                className="w-full gap-2"
              >
                <RotateCcw className="w-4 h-4 accessibility-keep" />
                איפוס הגדרות
              </Button>
              
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
