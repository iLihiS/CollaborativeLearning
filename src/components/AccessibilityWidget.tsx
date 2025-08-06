
import { useState, useEffect } from 'react';
import {
    Fab, Card, CardContent, CardHeader, Typography, IconButton, Button,
    ToggleButtonGroup, ToggleButton, Box, Divider
} from '@mui/material';
import { 
  Accessibility, Plus, Minus, Eye, EyeOff, Contrast, Keyboard,
  RotateCcw, X, Sun, Moon
} from 'lucide-react';
import { User } from '@/api/entities';

type Settings = {
    fontSize: number;
    highContrast: boolean;
    grayscale: boolean;
    highlightLinks: boolean;
    readableFont: boolean;
    hideImages: boolean;
    textSpacing: boolean;
    soundEnabled: boolean;
};

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>({
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

  useEffect(() => {
    applySettings(settings);
    localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
  }, [settings]);

  const saveSettings = (newSettings: Settings) => {
    localStorage.setItem('accessibilitySettings', JSON.stringify(newSettings));
    setSettings(newSettings);
    applySettings(newSettings);
  };

  const applySettings = (currentSettings: Settings) => {
    const root = document.documentElement;
    
    // Font size - This now controls the root font size via a CSS variable
    root.style.setProperty('--accessibility-font-scale', `${currentSettings.fontSize / 100}`);
    
    // Apply CSS classes based on settings
    root.classList.toggle('accessibility-high-contrast', currentSettings.highContrast);
    root.classList.toggle('accessibility-grayscale', currentSettings.grayscale);
    root.classList.toggle('accessibility-highlight-links', currentSettings.highlightLinks);
    root.classList.toggle('accessibility-readable-font', currentSettings.readableFont);
    root.classList.toggle('accessibility-hide-images', currentSettings.hideImages);
    root.classList.toggle('accessibility-text-spacing', currentSettings.textSpacing);
  };

  const adjustFontSize = (direction: 'increase' | 'decrease') => {
    const newSize = direction === 'increase' 
      ? Math.min(settings.fontSize + 5, 130)
      : Math.max(settings.fontSize - 5, 85);
    
    saveSettings({ ...settings, fontSize: newSize });
  };

  const toggleSetting = (key: keyof Settings) => {
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
    } catch {
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

  const handleSettingChange = (setting: keyof Settings, value: any) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
  };

  const toggleWidget = () => setIsOpen(!isOpen);

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

      <Box sx={{ position: 'fixed', left: 20, bottom: 20, zIndex: 9999 }}>
        <Fab color="primary" aria-label="accessibility" onClick={toggleWidget}>
          <Accessibility />
        </Fab>

        {isOpen && (
          <Card sx={{ position: 'absolute', bottom: 70, left: 0, width: 320 }}>
            <CardHeader
              title="נגישות"
              action={
                <IconButton onClick={toggleWidget}>
                  <X />
                </IconButton>
              }
            />
            <CardContent>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleThemeChange}
                startIcon={theme === 'light' ? <Moon /> : <Sun />}
              >
                {theme === 'light' ? 'מצב כהה' : 'מצב בהיר'}
              </Button>
              <Divider sx={{ my: 2 }} />
              <Typography>גודל טקסט</Typography>
              <ToggleButtonGroup value={settings.fontSize} exclusive>
                <ToggleButton onClick={() => adjustFontSize('decrease')} value={settings.fontSize - 5} disabled={settings.fontSize <= 85}>
                  <Minus />
                </ToggleButton>
                <ToggleButton onClick={() => adjustFontSize('increase')} value={settings.fontSize + 5} disabled={settings.fontSize >= 130}>
                  <Plus />
                </ToggleButton>
              </ToggleButtonGroup>
              <Divider sx={{ my: 2 }} />
              <Typography>הגדרות ויזואליות</Typography>
              <ToggleButton
                value="highContrast"
                selected={settings.highContrast}
                onChange={() => toggleSetting('highContrast')}
                fullWidth
              >
                <Contrast /> ניגודיות גבוהה
              </ToggleButton>
              <ToggleButton
                value="grayscale"
                selected={settings.grayscale}
                onChange={() => toggleSetting('grayscale')}
                fullWidth
              >
                <Eye /> גווני אפור
              </ToggleButton>
              <ToggleButton
                value="hideImages"
                selected={settings.hideImages}
                onChange={() => toggleSetting('hideImages')}
                fullWidth
              >
                <EyeOff /> הסתר תמונות
              </ToggleButton>
              <Divider sx={{ my: 2 }} />
              <Typography>הגדרות ניווט</Typography>
              <ToggleButton
                value="highlightLinks"
                selected={settings.highlightLinks}
                onChange={() => toggleSetting('highlightLinks')}
                fullWidth
              >
                <Keyboard /> הדגש קישורים
              </ToggleButton>
              <Divider sx={{ my: 2 }} />
              <Typography>הגדרות קריאה</Typography>
              <ToggleButton
                value="readableFont"
                selected={settings.readableFont}
                onChange={() => toggleSetting('readableFont')}
                fullWidth
              >
                Aa גופן קריא
              </ToggleButton>
              <ToggleButton
                value="textSpacing"
                selected={settings.textSpacing}
                onChange={() => toggleSetting('textSpacing')}
                fullWidth
              >
                | | ריווח טקסט
              </ToggleButton>
              <Divider sx={{ my: 2 }} />
              <Button fullWidth variant="outlined" onClick={resetSettings} startIcon={<RotateCcw />}>
                איפוס הגדרות
              </Button>
            </CardContent>
          </Card>
        )}
      </Box>
    </>
  );
}
