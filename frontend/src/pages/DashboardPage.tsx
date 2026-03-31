import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetCallerUserProfile, useGetCallerProgress, useGetLessons } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { TrendingUp, BookOpen, CheckCircle2, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: progress, isLoading: progressLoading } = useGetCallerProgress();
  const { data: lessons, isLoading: lessonsLoading } = useGetLessons();

  const isAuthenticated = !!identity;

  if (!isAuthenticated) {
    return (
      <div className="container py-12">
        <Card className="p-12 text-center">
          <CardTitle className="mb-4">Login Required</CardTitle>
          <CardDescription className="mb-6">Please log in to view your dashboard.</CardDescription>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (profileLoading || progressLoading || lessonsLoading) {
    return (
      <div className="container py-12">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const completedLessons = progress?.filter((p) => p.completed).length || 0;
  const totalLessons = lessons?.length || 0;
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  const recentLessons = progress
    ?.sort((a, b) => Number(b.lastAccessed - a.lastAccessed))
    .slice(0, 5)
    .map((p) => lessons?.find((l) => l.id === p.lessonId))
    .filter(Boolean);

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome back, {userProfile?.name}!</h1>
        <p className="text-lg text-muted-foreground">Track your progress and continue learning</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Membership</CardTitle>
            <Badge>{userProfile?.membership}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{userProfile?.membership}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Lessons</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedLessons}</div>
            <p className="text-xs text-muted-foreground">out of {totalLessons} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressPercentage.toFixed(0)}%</div>
            <Progress value={progressPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available Lessons</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLessons}</div>
            <p className="text-xs text-muted-foreground">lessons to explore</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your recently accessed lessons</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLessons && recentLessons.length > 0 ? (
            <div className="space-y-4">
              {recentLessons.map((lesson) => {
                if (!lesson) return null;
                const lessonProgress = progress?.find((p) => p.lessonId === lesson.id);
                return (
                  <div key={lesson.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <img
                        src="/assets/generated/lesson-default.dim_400x300.png"
                        alt={lesson.title}
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div>
                        <h3 className="font-medium">{lesson.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Last accessed: {new Date(Number(lessonProgress?.lastAccessed || 0) / 1000000).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {lessonProgress?.completed && <CheckCircle2 className="h-5 w-5 text-primary" />}
                      <Button asChild variant="outline" size="sm">
                        <Link to="/lessons/$lessonId" params={{ lessonId: lesson.id }}>
                          Continue
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No recent activity yet</p>
              <Button asChild>
                <Link to="/lessons">Start Learning</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
