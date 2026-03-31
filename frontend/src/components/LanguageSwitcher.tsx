import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useGetCallerLanguagePreference, useSetCallerLanguagePreference } from '../hooks/useQueries';
import { LanguagePreference } from '../backend';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useState, useEffect } from 'react';

export default function LanguageSwitcher() {
  const { identity } = useInternetIdentity();
  const { data: languagePreference } = useGetCallerLanguagePreference();
  const setLanguagePreference = useSetCallerLanguagePreference();
  const [localLanguage, setLocalLanguage] = useState<LanguagePreference>(LanguagePreference.english);

  const isAuthenticated = !!identity;

  // Sync with backend preference when authenticated
  useEffect(() => {
    if (isAuthenticated && languagePreference) {
      setLocalLanguage(languagePreference);
    }
  }, [isAuthenticated, languagePreference]);

  // Load from localStorage for non-authenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      const stored = localStorage.getItem('language');
      if (stored === 'german' || stored === 'english') {
        setLocalLanguage(stored as LanguagePreference);
      }
    }
  }, [isAuthenticated]);

  const handleLanguageChange = async (language: LanguagePreference) => {
    setLocalLanguage(language);
    
    if (isAuthenticated) {
      try {
        await setLanguagePreference.mutateAsync(language);
      } catch (error) {
        console.error('Failed to save language preference:', error);
      }
    } else {
      localStorage.setItem('language', language);
    }
  };

  const currentLanguage = isAuthenticated ? (languagePreference || LanguagePreference.english) : localLanguage;
  const displayText = currentLanguage === LanguagePreference.english ? 'EN' : 'DE';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="font-semibold">
          {displayText}
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleLanguageChange(LanguagePreference.english)}
          className={currentLanguage === LanguagePreference.english ? 'bg-accent' : ''}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleLanguageChange(LanguagePreference.german)}
          className={currentLanguage === LanguagePreference.german ? 'bg-accent' : ''}
        >
          Deutsch
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
