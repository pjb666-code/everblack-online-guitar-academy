import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { BookOpen, LayoutDashboard, Shield, MessageSquare } from 'lucide-react';
import { useGetCallerUserRole, useGetHomepageContent } from '../hooks/useQueries';
import { UserRole } from '../backend';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from '../lib/translations';

export default function Header() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: userRole } = useGetCallerUserRole();
  const { data: homepageContent } = useGetHomepageContent();
  const { t } = useTranslation();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';
  const text = loginStatus === 'logging-in' ? t('nav.login') + '...' : isAuthenticated ? t('nav.logout') : t('nav.login');

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
      navigate({ to: '/' });
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const isAdmin = userRole === UserRole.admin;

  // Use headerLogo from homepage content if available, otherwise use default
  const logoUrl = homepageContent?.headerLogo?.getDirectURL() || '/assets/generated/everblack-logo-transparent.dim_200x200.png';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img 
            src={logoUrl} 
            alt="Everblack Music" 
            className="h-10 w-auto max-w-[200px] object-contain" 
          />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Everblack Music
          </span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link
            to="/lessons"
            className="flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary"
          >
            <BookOpen className="h-4 w-4" />
            <span>{t('nav.lessons')}</span>
          </Link>
          {isAuthenticated && (
            <>
              <Link
                to="/dashboard"
                className="flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>{t('nav.dashboard')}</span>
              </Link>
              <Link
                to="/feedback"
                className="flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary"
              >
                <MessageSquare className="h-4 w-4" />
                <span>{t('nav.feedback')}</span>
              </Link>
            </>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary"
            >
              <Shield className="h-4 w-4" />
              <span>{t('nav.admin')}</span>
            </Link>
          )}
        </nav>

        <div className="flex items-center space-x-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button
            onClick={handleAuth}
            disabled={disabled}
            variant={isAuthenticated ? 'outline' : 'default'}
            className="font-medium"
          >
            {text}
          </Button>
        </div>
      </div>
    </header>
  );
}
