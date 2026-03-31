import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetLessons, useGetCallerUserProfile, useSubmitFeedback, useGetCallerFeedbackSubmissions, useGetFeedbackResponsesForSubmission } from '../hooks/useQueries';
import { FeedbackSubmission, FeedbackStatus, ExternalBlob, MembershipTier } from '../backend';
import { toast } from 'sonner';
import { Upload, Youtube, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../lib/translations';
import { Link } from '@tanstack/react-router';

export default function FeedbackPage() {
  const { identity } = useInternetIdentity();
  const { t } = useTranslation();
  const { data: lessons } = useGetLessons();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: submissions } = useGetCallerFeedbackSubmissions();
  const submitFeedback = useSubmitFeedback();
  const getResponses = useGetFeedbackResponsesForSubmission();

  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [youtubeLink, setYoutubeLink] = useState('');
  const [comment, setComment] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, any[]>>({});

  const isAuthenticated = !!identity;

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

  const accessibleLessons = lessons?.filter((lesson) => hasAccess(lesson.requiredMembership)) || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size: 50MB');
      return;
    }

    if (!file.type.includes('video/mp4') && !file.type.includes('video/quicktime')) {
      toast.error('Please select an MP4 or MOV file');
      return;
    }

    setVideoFile(file);
    setYoutubeLink(''); // Clear YouTube link if file is selected
  };

  const fileToExternalBlob = async (file: File): Promise<ExternalBlob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });
        resolve(blob);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLesson) {
      toast.error(t('feedback.selectLessonPlaceholder'));
      return;
    }

    if (!videoFile && !youtubeLink.trim()) {
      toast.error('Please upload a video or provide a YouTube link');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please add a comment');
      return;
    }

    try {
      let videoBlob: ExternalBlob | undefined;

      if (videoFile) {
        videoBlob = await fileToExternalBlob(videoFile);
      }

      const submission: FeedbackSubmission = {
        id: `feedback-${Date.now()}`,
        user: identity!.getPrincipal(),
        lessonId: selectedLesson,
        videoFile: videoBlob,
        youtubeLink: youtubeLink.trim() || undefined,
        comment: comment.trim(),
        submittedAt: BigInt(Date.now() * 1000000),
        status: FeedbackStatus.pending,
      };

      await submitFeedback.mutateAsync(submission);
      toast.success(t('feedback.submitSuccess'));

      // Reset form
      setSelectedLesson('');
      setVideoFile(null);
      setYoutubeLink('');
      setComment('');
      setUploadProgress(0);
    } catch (error) {
      toast.error(t('feedback.submitError'));
      console.error(error);
    }
  };

  const handleViewResponses = async (submissionId: string) => {
    if (expandedSubmission === submissionId) {
      setExpandedSubmission(null);
      return;
    }

    try {
      const submissionResponses = await getResponses.mutateAsync(submissionId);
      setResponses((prev) => ({ ...prev, [submissionId]: submissionResponses }));
      setExpandedSubmission(submissionId);
    } catch (error) {
      console.error('Failed to fetch responses:', error);
    }
  };

  const getStatusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case FeedbackStatus.pending:
        return <Badge variant="secondary">{t('feedback.status.pending')}</Badge>;
      case FeedbackStatus.reviewed:
        return <Badge variant="default">{t('feedback.status.reviewed')}</Badge>;
      case FeedbackStatus.responded:
        return <Badge variant="default" className="bg-green-600">{t('feedback.status.responded')}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container py-12">
        <Card className="p-12 text-center">
          <CardTitle className="mb-4">{t('toast.loginRequired')}</CardTitle>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{t('feedback.title')}</h1>
        <p className="text-lg text-muted-foreground">{t('feedback.subtitle')}</p>
      </div>

      {/* Submit Feedback Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t('feedback.submit')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lesson">{t('feedback.selectLesson')}</Label>
              <Select value={selectedLesson} onValueChange={setSelectedLesson}>
                <SelectTrigger>
                  <SelectValue placeholder={t('feedback.selectLessonPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {accessibleLessons.map((lesson) => (
                    <SelectItem key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoFile">{t('feedback.uploadVideo')}</Label>
              <Input
                id="videoFile"
                type="file"
                accept="video/mp4,video/quicktime"
                onChange={handleFileChange}
                disabled={!!youtubeLink}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">{t('feedback.uploadVideoDescription')}</p>
              {videoFile && <p className="text-xs text-primary">✓ {videoFile.name}</p>}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <p className="text-xs text-muted-foreground">Uploading: {uploadProgress}%</p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-sm text-muted-foreground">{t('feedback.orYoutubeLink')}</span>
              <Separator className="flex-1" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="youtubeLink" className="flex items-center gap-2">
                <Youtube className="h-4 w-4" />
                {t('feedback.youtubeLink')}
              </Label>
              <Input
                id="youtubeLink"
                type="url"
                placeholder={t('feedback.youtubeLinkPlaceholder')}
                value={youtubeLink}
                onChange={(e) => {
                  setYoutubeLink(e.target.value);
                  if (e.target.value) setVideoFile(null);
                }}
                disabled={!!videoFile}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">{t('feedback.comment')}</Label>
              <Textarea
                id="comment"
                placeholder={t('feedback.commentPlaceholder')}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                required
              />
            </div>

            <Button type="submit" disabled={submitFeedback.isPending} className="w-full">
              {submitFeedback.isPending ? t('feedback.submitting') : t('feedback.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* My Submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t('feedback.mySubmissions')}
          </CardTitle>
          <CardDescription>
            {submissions?.length || 0} submission{submissions?.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissions && submissions.length > 0 ? (
            <div className="space-y-4">
              {submissions.map((submission) => {
                const lesson = lessons?.find((l) => l.id === submission.lessonId);
                const submissionResponses = responses[submission.id] || [];
                const isExpanded = expandedSubmission === submission.id;

                return (
                  <div key={submission.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{lesson?.title || submission.lessonId}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{submission.comment}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {t('feedback.submittedAt')}: {new Date(Number(submission.submittedAt) / 1000000).toLocaleDateString()}
                          </span>
                          {submission.videoFile && <span>📹 Video</span>}
                          {submission.youtubeLink && <span>🎬 YouTube</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(submission.status)}
                        {submission.status === FeedbackStatus.responded && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewResponses(submission.id)}
                          >
                            {isExpanded ? 'Hide' : 'View'} Response
                          </Button>
                        )}
                      </div>
                    </div>

                    {isExpanded && submissionResponses.length > 0 && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          {t('feedback.adminResponse')}
                        </h4>
                        {submissionResponses.map((response) => (
                          <div key={response.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
                            {response.textResponse && (
                              <p className="text-sm">{response.textResponse}</p>
                            )}
                            {response.videoResponse && (
                              <div className="text-sm text-primary">📹 Video response attached</div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {new Date(Number(response.createdAt) / 1000000).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('feedback.noSubmissions')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
