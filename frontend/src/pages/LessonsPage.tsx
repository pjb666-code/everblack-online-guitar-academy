import { useState, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetLessons, useGetCallerUserProfile, useGetCategories, useGetLevels, useGetCallerProgress } from '../hooks/useQueries';
import { MembershipTier } from '../backend';
import { Lock, Play, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../lib/translations';

export default function LessonsPage() {
  const { t, language } = useTranslation();
  const { data: lessons, isLoading } = useGetLessons();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: categories } = useGetCategories();
  const { data: levels } = useGetLevels();
  const { data: progress } = useGetCallerProgress();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  const getMembershipLevel = (tier: MembershipTier): number => {
    const levels = {
      [MembershipTier.visitor]: 0,
      [MembershipTier.free]: 1,
      [MembershipTier.starter]: 2,
      [MembershipTier.pro]: 3,
      [MembershipTier.coaching]: 4,
    };
    return levels[tier] || 0;
  };

  const hasAccess = (requiredTier: MembershipTier): boolean => {
    if (!userProfile) return requiredTier === MembershipTier.visitor || requiredTier === MembershipTier.free;
    return getMembershipLevel(userProfile.membership) >= getMembershipLevel(requiredTier);
  };

  const isLessonCompleted = (lessonId: string): boolean => {
    return progress?.some((p) => p.lessonId === lessonId && p.completed) || false;
  };

  const getTierBadgeVariant = (tier: MembershipTier) => {
    switch (tier) {
      case MembershipTier.free:
        return 'secondary';
      case MembershipTier.starter:
        return 'default';
      case MembershipTier.pro:
        return 'default';
      case MembershipTier.coaching:
        return 'default';
      default:
        return 'outline';
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories?.find(c => c.id === categoryId);
    if (!category) return categoryId;
    return language === 'de' ? category.nameDe : category.nameEn;
  };

  const getLevelName = (levelId: string) => {
    const level = levels?.find(l => l.id === levelId);
    if (!level) return levelId;
    return language === 'de' ? level.nameDe : level.nameEn;
  };

  // Filter lessons based on selected category and level
  const filteredLessons = useMemo(() => {
    if (!lessons) return [];
    
    return lessons.filter(lesson => {
      const categoryMatch = selectedCategory === 'all' || lesson.categoryId === selectedCategory;
      const levelMatch = selectedLevel === 'all' || lesson.levelId === selectedLevel;
      return categoryMatch && levelMatch;
    });
  }, [lessons, selectedCategory, selectedLevel]);

  // Group lessons by category
  const groupedLessons = useMemo(() => {
    if (!filteredLessons || !categories) return [];

    const groups = new Map<string, typeof filteredLessons>();
    
    filteredLessons.forEach(lesson => {
      const categoryId = lesson.categoryId;
      if (!groups.has(categoryId)) {
        groups.set(categoryId, []);
      }
      groups.get(categoryId)!.push(lesson);
    });

    return Array.from(groups.entries()).map(([categoryId, lessons]) => ({
      categoryId,
      categoryName: getCategoryName(categoryId),
      lessons,
    }));
  }, [filteredLessons, categories, language]);

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full rounded-t-lg" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{t('lessons.title')}</h1>
        <p className="text-lg text-muted-foreground">
          {t('lessons.subtitle')}
        </p>
      </div>

      {/* Filter Controls */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <img src="/assets/generated/filter-icon-transparent.dim_32x32.png" alt="" className="h-5 w-5" />
            {t('lessons.filters.title')}
          </CardTitle>
          <CardDescription>{t('lessons.filters.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('lessons.filters.category')}</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('lessons.filters.allCategories')}</SelectItem>
                  {categories?.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {language === 'de' ? category.nameDe : category.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('lessons.filters.level')}</label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('lessons.filters.allLevels')}</SelectItem>
                  {levels?.map(level => (
                    <SelectItem key={level.id} value={level.id}>
                      {language === 'de' ? level.nameDe : level.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(selectedCategory !== 'all' || selectedLevel !== 'all') && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedLevel('all');
                }}
              >
                {t('lessons.filters.clearFilters')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grouped Lessons */}
      {groupedLessons.length > 0 ? (
        <div className="space-y-12">
          {groupedLessons.map(group => (
            <div key={group.categoryId}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <img src="/assets/generated/category-icon-transparent.dim_64x64.png" alt="" className="h-6 w-6" />
                  {group.categoryName}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {group.lessons.length} {group.lessons.length === 1 ? t('lessons.lesson') : t('lessons.lessons')}
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.lessons.map((lesson) => {
                  const canAccess = hasAccess(lesson.requiredMembership);
                  const isCompleted = isLessonCompleted(lesson.id);
                  const thumbnailUrl = lesson.thumbnail?.getDirectURL() || '/assets/generated/lesson-default.dim_400x300.png';

                  return (
                    <Card key={lesson.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative">
                        <img
                          src={thumbnailUrl}
                          alt={lesson.title}
                          className="w-full h-48 object-cover"
                        />
                        {!canAccess && (
                          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                            <Lock className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        {isCompleted && canAccess && (
                          <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full p-1">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                        )}
                        <Badge className="absolute top-2 right-2" variant={getTierBadgeVariant(lesson.requiredMembership)}>
                          {lesson.requiredMembership}
                        </Badge>
                      </div>
                      <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            <img src="/assets/generated/level-icon-transparent.dim_64x64.png" alt="" className="h-3 w-3 mr-1" />
                            {getLevelName(lesson.levelId)}
                          </Badge>
                        </div>
                        <CardTitle className="line-clamp-1">{lesson.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{lesson.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {canAccess ? (
                          <Button asChild className="w-full">
                            <Link to="/lessons/$lessonId" params={{ lessonId: lesson.id }}>
                              <Play className="h-4 w-4 mr-2" />
                              {t('lessons.startLesson')}
                            </Link>
                          </Button>
                        ) : (
                          <Button variant="outline" className="w-full" disabled>
                            <Lock className="h-4 w-4 mr-2" />
                            {t('lessons.upgradeToAccess')}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <CardTitle className="mb-4">{t('lessons.noLessons')}</CardTitle>
          <CardDescription>{t('lessons.noLessonsDescription')}</CardDescription>
        </Card>
      )}
    </div>
  );
}
