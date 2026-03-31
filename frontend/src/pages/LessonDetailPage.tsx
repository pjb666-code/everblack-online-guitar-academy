import { useParams, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGetLessons, useGetCallerUserProfile, useGetCallerProgress, useUpdateCallerProgress, useGetRecommendedLessons, useGetCategories, useGetLevels } from '../hooks/useQueries';
import { MembershipTier, Progress } from '../backend';
import { Download, ArrowLeft, CheckCircle2, ArrowRight, AlertCircle, Loader2, ExternalLink, FileText, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '../lib/translations';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useState, useEffect, useRef } from 'react';

export default function LessonDetailPage() {
  const { t, language } = useTranslation();
  const { identity } = useInternetIdentity();
  const { lessonId } = useParams({ from: '/lessons/$lessonId' });
  const { data: lessons, isLoading } = useGetLessons();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: progress } = useGetCallerProgress();
  const { data: categories } = useGetCategories();
  const { data: levels } = useGetLevels();
  const updateProgress = useUpdateCallerProgress();
  const { data: recommendedLessons } = useGetRecommendedLessons(lessonId);

  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(100);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const lesson = lessons?.find((l) => l.id === lessonId);

  // Load PDF via fetch when lesson is available
  useEffect(() => {
    if (!lesson?.pdfFile) {
      setPdfData(null);
      setPdfBlobUrl(null);
      setPdfLoading(false);
      setPdfError(null);
      return;
    }

    const loadPdf = async () => {
      setPdfLoading(true);
      setPdfError(null);
      
      try {
        // Type guard to ensure pdfFile exists
        if (!lesson.pdfFile) {
          throw new Error('PDF file not available');
        }

        const fileUrl = lesson.pdfFile.getDirectURL();
        
        if (!fileUrl || fileUrl.trim() === '') {
          throw new Error('Invalid PDF URL');
        }

        // Fetch PDF as ArrayBuffer
        const response = await fetch(fileUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to load PDF: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        setPdfData(uint8Array);
        
        // Create blob URL for iframe display
        const blob = new Blob([uint8Array], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(blobUrl);
        
        setPdfLoading(false);
      } catch (error) {
        console.error('Error loading PDF:', error);
        setPdfError(error instanceof Error ? error.message : 'Failed to load PDF');
        setPdfLoading(false);
      }
    };

    loadPdf();

    // Cleanup blob URL on unmount
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [lesson?.pdfFile]);

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

  const isCompleted = progress?.some((p) => p.lessonId === lessonId && p.completed) || false;

  const handleMarkComplete = async () => {
    if (!lesson) return;

    const newProgress: Progress = {
      lessonId: lesson.id,
      completed: true,
      lastAccessed: BigInt(Date.now() * 1000000),
    };

    const updatedProgress = progress
      ? progress.filter((p) => p.lessonId !== lesson.id).concat(newProgress)
      : [newProgress];

    try {
      await updateProgress.mutateAsync(updatedProgress);
      toast.success(language === 'de' ? 'Lektion als abgeschlossen markiert!' : 'Lesson marked as complete!');
    } catch (error) {
      toast.error(language === 'de' ? 'Fehler beim Aktualisieren des Fortschritts' : 'Failed to update progress');
      console.error(error);
    }
  };

  const handleDownload = async (blob: any, filename: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    try {
      toast.info(language === 'de' ? 'Download wird vorbereitet...' : 'Preparing download...');
      
      const bytes = await blob.getBytes();
      const mimeType = filename.endsWith('.pdf') 
        ? 'application/pdf' 
        : filename.endsWith('.gp') || filename.endsWith('.gp5') || filename.endsWith('.gpx')
        ? 'application/octet-stream'
        : 'application/octet-stream';
      
      const blobObj = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blobObj);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast.success(language === 'de' ? 'Download gestartet' : 'Download started');
    } catch (error) {
      toast.error(language === 'de' ? 'Fehler beim Herunterladen der Datei' : 'Failed to download file');
      console.error('Download error:', error);
    }
  };

  const handleOpenInNewTab = () => {
    if (pdfBlobUrl) {
      window.open(pdfBlobUrl, '_blank', 'noopener,noreferrer');
      toast.info(language === 'de' ? 'PDF in neuem Tab geöffnet' : 'PDF opened in new tab');
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const handleFullscreen = () => {
    if (iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      }
    }
  };

  const getYouTubeEmbedUrl = (url: string): string => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
    }

    return url;
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

  if (isLoading) {
    return (
      <div className="container py-12">
        <Skeleton className="h-8 w-32 mb-8" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full mb-6" />
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-2/3" />
          </div>
          <div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="container py-12">
        <Card className="p-12 text-center">
          <CardTitle className="mb-4">{language === 'de' ? 'Lektion nicht gefunden' : 'Lesson Not Found'}</CardTitle>
          <CardDescription className="mb-6">
            {language === 'de' ? 'Die gesuchte Lektion existiert nicht.' : "The lesson you're looking for doesn't exist."}
          </CardDescription>
          <Button asChild>
            <Link to="/lessons">{language === 'de' ? 'Zurück zu Lektionen' : 'Back to Lessons'}</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const canAccess = hasAccess(lesson.requiredMembership);

  if (!canAccess) {
    return (
      <div className="container py-12">
        <Button asChild variant="ghost" className="mb-8">
          <Link to="/lessons">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'de' ? 'Zurück zu Lektionen' : 'Back to Lessons'}
          </Link>
        </Button>
        <Card className="p-12 text-center">
          <CardTitle className="mb-4">{language === 'de' ? 'Upgrade erforderlich' : 'Upgrade Required'}</CardTitle>
          <CardDescription className="mb-6">
            {language === 'de' 
              ? `Diese Lektion erfordert eine ${lesson.requiredMembership}-Mitgliedschaft oder höher.`
              : `This lesson requires a ${lesson.requiredMembership} membership or higher.`}
          </CardDescription>
          <Button asChild>
            <Link to="/">{language === 'de' ? 'Mitgliedschaftspläne anzeigen' : 'View Membership Plans'}</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const embedUrl = getYouTubeEmbedUrl(lesson.videoUrl);

  return (
    <div className="container py-12">
      <Button asChild variant="ghost" className="mb-8">
        <Link to="/lessons">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === 'de' ? 'Zurück zu Lektionen' : 'Back to Lessons'}
        </Link>
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={lesson.title}
            />
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
              <div className="flex items-center gap-2 mb-4">
                <Badge>{lesson.requiredMembership}</Badge>
                <Badge variant="outline">{getCategoryName(lesson.categoryId)}</Badge>
                <Badge variant="outline">{getLevelName(lesson.levelId)}</Badge>
              </div>
            </div>
            {isCompleted && <CheckCircle2 className="h-8 w-8 text-primary flex-shrink-0" />}
          </div>

          <p className="text-muted-foreground">{lesson.description}</p>

          {lesson.tags && lesson.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {lesson.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {!isCompleted && (
            <Button onClick={handleMarkComplete} disabled={updateProgress.isPending}>
              {updateProgress.isPending 
                ? (language === 'de' ? 'Aktualisieren...' : 'Updating...') 
                : (language === 'de' ? 'Als abgeschlossen markieren' : 'Mark as Complete')}
            </Button>
          )}

          {/* PDF Viewer with Controls */}
          {lesson.pdfFile && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {language === 'de' ? 'PDF Noten' : 'PDF Sheet Music'}
                    </CardTitle>
                    <CardDescription>
                      {language === 'de' 
                        ? 'Interaktive PDF-Ansicht mit Zoom- und Navigationsfunktionen' 
                        : 'Interactive PDF viewer with zoom and navigation controls'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleOpenInNewTab}
                      disabled={!pdfBlobUrl}
                      title={language === 'de' ? 'In neuem Tab öffnen' : 'Open in new tab'}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {language === 'de' ? 'Neuer Tab' : 'New Tab'}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={(e) => handleDownload(lesson.pdfFile, `${lesson.title}.pdf`, e)}
                      title={language === 'de' ? 'PDF herunterladen' : 'Download PDF'}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {language === 'de' ? 'Herunterladen' : 'Download'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {pdfLoading && (
                  <div className="flex items-center justify-center py-12 bg-muted rounded-lg">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
                      <p className="text-sm font-medium text-foreground">
                        {language === 'de' ? 'PDF wird geladen...' : 'Loading PDF...'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {language === 'de' ? 'Bitte warten Sie einen Moment' : 'Please wait a moment'}
                      </p>
                    </div>
                  </div>
                )}

                {pdfError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-semibold mb-2">
                        {language === 'de' 
                          ? 'PDF konnte nicht geladen werden' 
                          : 'Failed to load PDF'}
                      </p>
                      <p className="text-sm mb-3">{pdfError}</p>
                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleOpenInNewTab}
                          disabled={!pdfBlobUrl}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {language === 'de' ? 'In neuem Tab öffnen' : 'Open in new tab'}
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={(e) => handleDownload(lesson.pdfFile, `${lesson.title}.pdf`, e)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {language === 'de' ? 'PDF herunterladen' : 'Download PDF'}
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {!pdfLoading && !pdfError && pdfBlobUrl && (
                  <div className="space-y-4">
                    {/* PDF Controls */}
                    <div className="flex items-center justify-between gap-4 p-3 bg-muted rounded-lg flex-wrap">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleZoomOut}
                          disabled={zoom <= 50}
                          title={language === 'de' ? 'Verkleinern' : 'Zoom out'}
                        >
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium min-w-[60px] text-center">
                          {zoom}%
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleZoomIn}
                          disabled={zoom >= 200}
                          title={language === 'de' ? 'Vergrößern' : 'Zoom in'}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleFullscreen}
                        title={language === 'de' ? 'Vollbild' : 'Fullscreen'}
                      >
                        <Maximize className="h-4 w-4 mr-2" />
                        {language === 'de' ? 'Vollbild' : 'Fullscreen'}
                      </Button>
                    </div>

                    {/* PDF Viewer */}
                    <div 
                      className="relative bg-muted rounded-lg overflow-hidden border"
                      style={{ height: '600px' }}
                    >
                      <iframe
                        ref={iframeRef}
                        src={`${pdfBlobUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=${zoom}`}
                        className="w-full h-full"
                        title={`${lesson.title} - ${language === 'de' ? 'PDF Noten' : 'PDF Sheet Music'}`}
                        style={{ border: 'none' }}
                      />
                    </div>

                    {/* Helper Text */}
                    <div className="text-center space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {language === 'de' 
                          ? 'Verwenden Sie die Steuerelemente oben zum Zoomen oder öffnen Sie das PDF in einem neuen Tab für erweiterte Funktionen' 
                          : 'Use the controls above to zoom or open the PDF in a new tab for advanced features'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'de' 
                          ? 'Tipp: Im Vollbildmodus können Sie das PDF besser betrachten' 
                          : 'Tip: Use fullscreen mode for a better viewing experience'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recommended Lessons */}
          {recommendedLessons && recommendedLessons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'de' ? 'Empfohlene nächste Lektionen' : 'Recommended Next Lessons'}
                </CardTitle>
                <CardDescription>
                  {language === 'de' 
                    ? 'Setzen Sie Ihre Lernreise mit diesen Lektionen fort' 
                    : 'Continue your learning journey with these lessons'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendedLessons.slice(0, 3).map((recLesson) => {
                  const recCanAccess = hasAccess(recLesson.requiredMembership);
                  return (
                    <div key={recLesson.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{recLesson.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{getLevelName(recLesson.levelId)}</Badge>
                          <Badge variant="outline" className="text-xs">{getCategoryName(recLesson.categoryId)}</Badge>
                        </div>
                      </div>
                      {recCanAccess ? (
                        <Button asChild size="sm" variant="ghost">
                          <Link to="/lessons/$lessonId" params={{ lessonId: recLesson.id }}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="text-xs">{recLesson.requiredMembership}</Badge>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'de' ? 'Lektionsmaterialien' : 'Lesson Materials'}</CardTitle>
              <CardDescription>
                {language === 'de' ? 'Dateien herunterladen zum Offline-Üben' : 'Download files to practice offline'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {lesson.pdfFile && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={(e) => handleDownload(lesson.pdfFile, `${lesson.title}.pdf`, e)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {language === 'de' ? 'PDF Noten' : 'PDF Sheet Music'}
                </Button>
              )}
              {lesson.gpFile && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={(e) => handleDownload(lesson.gpFile, `${lesson.title}.gp`, e)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {language === 'de' ? 'Guitar Pro Datei' : 'Guitar Pro File'}
                </Button>
              )}
              {!lesson.gpFile && !lesson.pdfFile && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {language === 'de' 
                    ? 'Keine herunterladbaren Materialien verfügbar' 
                    : 'No downloadable materials available'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
