'use client';

import React from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Trophy, LogIn, LogOut, User, Plus, Globe } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { Language } from '@/lib/translations';

export function GlobalHeader() {
  const { user, loading, signInWithGoogle, logout } = useUser();
  const { language, setLanguage, t } = useI18n();

  const langNames = {
    en: 'English',
    hi: 'हिन्दी',
    ur: 'اردو',
    bn: 'বাংলা'
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md px-4 h-14 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <div className="bg-primary p-1.5 rounded-lg shadow-sm">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <span className="font-black tracking-tighter text-lg text-primary">ScoreCric</span>
      </Link>

      <div className="flex items-center gap-2 sm:gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Globe className="w-5 h-5 text-primary" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-2xl">
            {(Object.keys(langNames) as Language[]).map((lang) => (
              <DropdownMenuItem 
                key={lang} 
                onClick={() => setLanguage(lang)}
                className={`font-bold ${language === lang ? 'bg-primary/10 text-primary' : ''}`}
              >
                {langNames[lang]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {loading ? (
          <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
        ) : user ? (
          <>
            <Link href="/match/setup" className="hidden sm:block">
              <Button size="sm" className="rounded-full gap-1.5 font-bold">
                <Plus className="w-4 h-4" /> {t('newMatch')}
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full ring-offset-background transition-all hover:ring-2 hover:ring-primary/20">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-black uppercase">
                      {user.displayName?.slice(0, 2) || 'SC'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/match/setup" className="cursor-pointer font-medium">
                    <Plus className="mr-2 h-4 w-4" /> {t('newMatch')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive cursor-pointer font-medium">
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button onClick={() => signInWithGoogle()} variant="outline" size="sm" className="rounded-full gap-2 font-bold shadow-sm">
            <LogIn className="w-4 h-4" /> Sign In
          </Button>
        )}
      </div>
    </header>
  );
}
