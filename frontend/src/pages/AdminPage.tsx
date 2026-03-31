import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useIsCallerAdmin, useGetLessons, useAddLesson, useUpdateLesson, useDeleteLesson, useIsStripeConfigured, useSetStripeConfiguration, useGetAllUserProfiles, useAssignUserRole, useSuspendUser, useReactivateUser, useGetAllFeedbackSubmissions, useAddFeedbackResponse, useGetCategories, useAddCategory, useUpdateCategory, useDeleteCategory, useGetLevels, useAddLevel, useUpdateLevel, useDeleteLevel, useExportData, useImportData, useGetCallerUserRole, useGetHomepageContent, useUpdateHomepageContent, useUpdateTierFeatures } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Link } from '@tanstack/react-router';
import { MembershipTier, Lesson, ExternalBlob, UserRole, FeedbackStatus, FeedbackResponse, Category, Level, HomepageContent, FeatureCard, PricingOption, TierFeatureList, TierFeature, ExportData } from '../backend';
import { toast } from 'sonner';
import { Trash2, Edit, BookOpen, Users, CreditCard, Upload, X, MessageSquare, Youtube, FolderTree, Download, FileUp, Tag, AlertCircle, Home, GripVertical, Plus, CheckCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '../lib/translations';
import { Principal } from '@icp-sdk/core/principal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export default function AdminPage() {
  const { identity } = useInternetIdentity();
  const { t } = useTranslation();
  const { data: isAdmin, isLoading } = useIsCallerAdmin();
  const { data: lessons } = useGetLessons();
  const addLesson = useAddLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();
  const { data: isStripeConfigured } = useIsStripeConfigured();
  const setStripeConfig = useSetStripeConfiguration();
  const { data: allUsers } = useGetAllUserProfiles();
  const { data: userRoles } = useGetCallerUserRole();
  const assignRole = useAssignUserRole();
  const suspendUser = useSuspendUser();
  const reactivateUser = useReactivateUser();
  const { data: feedbackSubmissions } = useGetAllFeedbackSubmissions();
  const addResponse = useAddFeedbackResponse();

  const { data: categories } = useGetCategories();
  const addCategory = useAddCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const { data: levels } = useGetLevels();
  const addLevel = useAddLevel();
  const updateLevel = useUpdateLevel();
  const deleteLevel = useDeleteLevel();

  const exportData = useExportData();
  const importData = useImportData();

  const { data: homepageContent } = useGetHomepageContent();
  const updateHomepageContentMutation = useUpdateHomepageContent();
  const updateTierFeaturesMutation = useUpdateTierFeatures();

  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    requiredMembership: MembershipTier.free,
    categoryId: null as string | null,
    levelId: null as string | null,
    tags: '',
    recommendedNextLessonId: null as string | null,
  });

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [gpFile, setGpFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ pdf: number; gp: number; thumbnail: number }>({ pdf: 0, gp: 0, thumbnail: 0 });

  const [stripeData, setStripeData] = useState({
    secretKey: '',
    countries: 'US,CA,GB,DE,AT,CH',
  });

  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responseVideoFile, setResponseVideoFile] = useState<File | null>(null);
  const [responseUploadProgress, setResponseUploadProgress] = useState(0);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({ nameEn: '', nameDe: '' });
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [levelFormData, setLevelFormData] = useState({ nameEn: '', nameDe: '' });

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [exportProgress, setExportProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Track user roles for the user management table
  const [userRoleMap, setUserRoleMap] = useState<Map<string, UserRole>>(new Map());

  // Homepage content state
  const [homepageFormData, setHomepageFormData] = useState({
    heroTextEn: homepageContent?.heroTextEn || '',
    heroTextDe: homepageContent?.heroTextDe || '',
    whyChooseTitleEn: homepageContent?.whyChooseSection.titleEn || '',
    whyChooseTitleDe: homepageContent?.whyChooseSection.titleDe || '',
    whyChooseDescEn: homepageContent?.whyChooseSection.descriptionEn || '',
    whyChooseDescDe: homepageContent?.whyChooseSection.descriptionDe || '',
    featureCards: homepageContent?.whyChooseSection.featureCards || [],
    pricingTitleEn: homepageContent?.chooseYourPathSection.titleEn || '',
    pricingTitleDe: homepageContent?.chooseYourPathSection.titleDe || '',
    pricingDescEn: homepageContent?.chooseYourPathSection.descriptionEn || '',
    pricingDescDe: homepageContent?.chooseYourPathSection.descriptionDe || '',
    pricingOptions: homepageContent?.chooseYourPathSection.pricingOptions || [],
  });

  // Tier features state
  const [tierFeatures, setTierFeatures] = useState<TierFeatureList[]>(
    homepageContent?.chooseYourPathSection.tierFeatures || []
  );

  const [headerLogoFile, setHeaderLogoFile] = useState<File | null>(null);
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [featureIconFiles, setFeatureIconFiles] = useState<Map<string, File>>(new Map());
  const [homepageUploadProgress, setHomepageUploadProgress] = useState<{ headerLogo: number; heroImage: number }>({ headerLogo: 0, heroImage: 0 });

  const isAuthenticated = !!identity;

  // Update homepage form data when content is loaded
  useEffect(() => {
    if (homepageContent) {
      setHomepageFormData({
        heroTextEn: homepageContent.heroTextEn,
        heroTextDe: homepageContent.heroTextDe,
        whyChooseTitleEn: homepageContent.whyChooseSection.titleEn,
        whyChooseTitleDe: homepageContent.whyChooseSection.titleDe,
        whyChooseDescEn: homepageContent.whyChooseSection.descriptionEn,
        whyChooseDescDe: homepageContent.whyChooseSection.descriptionDe,
        featureCards: homepageContent.whyChooseSection.featureCards,
        pricingTitleEn: homepageContent.chooseYourPathSection.titleEn,
        pricingTitleDe: homepageContent.chooseYourPathSection.titleDe,
        pricingDescEn: homepageContent.chooseYourPathSection.descriptionEn,
        pricingDescDe: homepageContent.chooseYourPathSection.descriptionDe,
        pricingOptions: homepageContent.chooseYourPathSection.pricingOptions,
      });
      setTierFeatures(homepageContent.chooseYourPathSection.tierFeatures || []);
    }
  }, [homepageContent]);

  if (!isAuthenticated || isLoading) {
    return (
      <div className="container py-12">
        <Card className="p-12 text-center">
          <CardTitle className="mb-4">Loading...</CardTitle>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container py-12">
        <Card className="p-12 text-center">
          <CardTitle className="mb-4">Access Denied</CardTitle>
          <CardDescription className="mb-6">
            You don't have permission to access this page.
          </CardDescription>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'gp' | 'thumbnail') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = type === 'thumbnail' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum size: ${type === 'thumbnail' ? '5MB' : '10MB'}`);
      return;
    }

    if (type === 'pdf') {
      if (!file.type.includes('pdf')) {
        toast.error('Please select a PDF file');
        return;
      }
      setPdfFile(file);
    } else if (type === 'thumbnail') {
      if (!file.type.includes('image/png') && !file.type.includes('image/jpeg')) {
        toast.error('Please select a PNG or JPG file');
        return;
      }
      setThumbnailFile(file);
    } else {
      if (!file.name.endsWith('.gp') && !file.name.endsWith('.gp5') && !file.name.endsWith('.gpx')) {
        toast.error('Please select a Guitar Pro file (.gp, .gp5, .gpx)');
        return;
      }
      setGpFile(file);
    }
  };

  const fileToExternalBlob = async (file: File, type: 'pdf' | 'gp' | 'video' | 'thumbnail' | 'headerLogo' | 'heroImage' | 'featureIcon'): Promise<ExternalBlob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          if (type === 'video') {
            setResponseUploadProgress(percentage);
          } else if (type === 'headerLogo' || type === 'heroImage') {
            setHomepageUploadProgress((prev) => ({ ...prev, [type]: percentage }));
          } else {
            setUploadProgress((prev) => ({ ...prev, [type]: percentage }));
          }
        });
        resolve(blob);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim() || !formData.description.trim() || !formData.videoUrl.trim()) {
      toast.error('Please fill in all required fields (Title, Description, Video URL)');
      return;
    }

    if (!formData.categoryId) {
      toast.error('Please select a category');
      return;
    }

    if (!formData.levelId) {
      toast.error('Please select a level');
      return;
    }

    // Check if categories and levels exist
    if (!categories || categories.length === 0) {
      toast.error('Please create at least one category first');
      return;
    }

    if (!levels || levels.length === 0) {
      toast.error('Please create at least one level first');
      return;
    }

    try {
      let pdfBlob = editingLesson?.pdfFile;
      let gpBlob = editingLesson?.gpFile;
      let thumbnailBlob = editingLesson?.thumbnail;

      if (pdfFile) {
        pdfBlob = await fileToExternalBlob(pdfFile, 'pdf');
      }

      if (gpFile) {
        gpBlob = await fileToExternalBlob(gpFile, 'gp');
      }

      if (thumbnailFile) {
        thumbnailBlob = await fileToExternalBlob(thumbnailFile, 'thumbnail');
      }

      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

      const lessonData: Lesson = {
        id: editingLesson?.id || `lesson-${Date.now()}`,
        title: formData.title.trim(),
        description: formData.description.trim(),
        videoUrl: formData.videoUrl.trim(),
        requiredMembership: formData.requiredMembership,
        categoryId: formData.categoryId,
        levelId: formData.levelId,
        tags,
        recommendedNextLessonId: formData.recommendedNextLessonId || undefined,
        createdAt: editingLesson?.createdAt || BigInt(Date.now() * 1000000),
        gpFile: gpBlob,
        pdfFile: pdfBlob,
        thumbnail: thumbnailBlob,
      };

      if (editingLesson) {
        await updateLesson.mutateAsync(lessonData);
        toast.success('Lesson updated successfully!');
      } else {
        await addLesson.mutateAsync(lessonData);
        toast.success('Lesson created successfully!');
      }
      
      setFormData({ 
        title: '', 
        description: '', 
        videoUrl: '', 
        requiredMembership: MembershipTier.free, 
        categoryId: null, 
        levelId: null,
        tags: '',
        recommendedNextLessonId: null,
      });
      setEditingLesson(null);
      setPdfFile(null);
      setGpFile(null);
      setThumbnailFile(null);
      setUploadProgress({ pdf: 0, gp: 0, thumbnail: 0 });
    } catch (error) {
      toast.error('Failed to save lesson');
      console.error(error);
    }
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description,
      videoUrl: lesson.videoUrl,
      requiredMembership: lesson.requiredMembership,
      categoryId: lesson.categoryId,
      levelId: lesson.levelId,
      tags: lesson.tags?.join(', ') || '',
      recommendedNextLessonId: lesson.recommendedNextLessonId || null,
    });
    setPdfFile(null);
    setGpFile(null);
    setThumbnailFile(null);
  };

  const handleDelete = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
      await deleteLesson.mutateAsync(lessonId);
      toast.success('Lesson deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete lesson');
      console.error(error);
    }
  };

  const handleCancel = () => {
    setEditingLesson(null);
    setFormData({ 
      title: '', 
      description: '', 
      videoUrl: '', 
      requiredMembership: MembershipTier.free, 
      categoryId: null, 
      levelId: null,
      tags: '',
      recommendedNextLessonId: null,
    });
    setPdfFile(null);
    setGpFile(null);
    setThumbnailFile(null);
    setUploadProgress({ pdf: 0, gp: 0, thumbnail: 0 });
  };

  const handleStripeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripeData.secretKey.trim()) {
      toast.error('Please enter your Stripe secret key');
      return;
    }

    try {
      await setStripeConfig.mutateAsync({
        secretKey: stripeData.secretKey.trim(),
        allowedCountries: stripeData.countries.split(',').map((c) => c.trim()),
      });
      toast.success('Stripe configured successfully!');
      setStripeData({ secretKey: '', countries: 'US,CA,GB,DE,AT,CH' });
    } catch (error) {
      toast.error('Failed to configure Stripe');
      console.error(error);
    }
  };

  const handleRoleChange = async (userPrincipal: Principal, newRole: UserRole) => {
    try {
      await assignRole.mutateAsync({ user: userPrincipal, role: newRole });
      setUserRoleMap(prev => new Map(prev).set(userPrincipal.toString(), newRole));
      toast.success(t('admin.users.roleUpdated'));
    } catch (error) {
      toast.error(t('admin.users.actionError'));
      console.error(error);
    }
  };

  const handleSuspend = async (userPrincipal: Principal) => {
    try {
      await suspendUser.mutateAsync(userPrincipal);
      toast.success(t('admin.users.userSuspended'));
    } catch (error) {
      toast.error(t('admin.users.actionError'));
      console.error(error);
    }
  };

  const handleReactivate = async (userPrincipal: Principal) => {
    try {
      await reactivateUser.mutateAsync(userPrincipal);
      toast.success(t('admin.users.userReactivated'));
    } catch (error) {
      toast.error(t('admin.users.actionError'));
      console.error(error);
    }
  };

  const handleResponseVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size: 50MB');
      return;
    }

    if (!file.type.includes('video/mp4') && !file.type.includes('video/quicktime')) {
      toast.error('Please select an MP4 or MOV file');
      return;
    }

    setResponseVideoFile(file);
  };

  const handleSubmitResponse = async (submissionId: string) => {
    if (!responseText.trim() && !responseVideoFile) {
      toast.error('Please provide a text response or video response');
      return;
    }

    try {
      let videoBlob: ExternalBlob | undefined;

      if (responseVideoFile) {
        videoBlob = await fileToExternalBlob(responseVideoFile, 'video');
      }

      const response: FeedbackResponse = {
        id: `response-${Date.now()}`,
        submissionId,
        admin: identity!.getPrincipal(),
        textResponse: responseText.trim() || undefined,
        videoResponse: videoBlob,
        createdAt: BigInt(Date.now() * 1000000),
      };

      await addResponse.mutateAsync(response);
      toast.success(t('admin.feedback.responseSuccess'));

      setRespondingTo(null);
      setResponseText('');
      setResponseVideoFile(null);
      setResponseUploadProgress(0);
    } catch (error) {
      toast.error(t('admin.feedback.responseError'));
      console.error(error);
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

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.nameEn.trim() || !categoryFormData.nameDe.trim()) {
      toast.error(t('admin.categories.fillAllFields'));
      return;
    }

    try {
      const categoryData: Category = {
        id: editingCategory?.id || `category-${Date.now()}`,
        nameEn: categoryFormData.nameEn.trim(),
        nameDe: categoryFormData.nameDe.trim(),
        createdAt: editingCategory?.createdAt || BigInt(Date.now() * 1000000),
      };

      if (editingCategory) {
        await updateCategory.mutateAsync(categoryData);
        toast.success(t('admin.categories.updateSuccess'));
      } else {
        await addCategory.mutateAsync(categoryData);
        toast.success(t('admin.categories.createSuccess'));
      }

      setCategoryFormData({ nameEn: '', nameDe: '' });
      setEditingCategory(null);
    } catch (error) {
      toast.error(t('admin.categories.actionError'));
      console.error(error);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({ nameEn: category.nameEn, nameDe: category.nameDe });
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await deleteCategory.mutateAsync(categoryId);
      toast.success(t('admin.categories.deleteSuccess'));
    } catch (error) {
      toast.error(t('admin.categories.actionError'));
      console.error(error);
    }
  };

  const handleCancelCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({ nameEn: '', nameDe: '' });
  };

  const handleLevelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!levelFormData.nameEn.trim() || !levelFormData.nameDe.trim()) {
      toast.error(t('admin.categories.fillAllFields'));
      return;
    }

    try {
      const levelData: Level = {
        id: editingLevel?.id || `level-${Date.now()}`,
        nameEn: levelFormData.nameEn.trim(),
        nameDe: levelFormData.nameDe.trim(),
        createdAt: editingLevel?.createdAt || BigInt(Date.now() * 1000000),
      };

      if (editingLevel) {
        await updateLevel.mutateAsync(levelData);
        toast.success(t('admin.categories.updateSuccess'));
      } else {
        await addLevel.mutateAsync(levelData);
        toast.success(t('admin.categories.createSuccess'));
      }

      setLevelFormData({ nameEn: '', nameDe: '' });
      setEditingLevel(null);
    } catch (error) {
      toast.error(t('admin.categories.actionError'));
      console.error(error);
    }
  };

  const handleEditLevel = (level: Level) => {
    setEditingLevel(level);
    setLevelFormData({ nameEn: level.nameEn, nameDe: level.nameDe });
  };

  const handleDeleteLevel = async (levelId: string) => {
    if (!confirm('Are you sure you want to delete this level?')) return;

    try {
      await deleteLevel.mutateAsync(levelId);
      toast.success(t('admin.categories.deleteSuccess'));
    } catch (error) {
      toast.error(t('admin.categories.actionError'));
      console.error(error);
    }
  };

  const handleCancelLevel = () => {
    setEditingLevel(null);
    setLevelFormData({ nameEn: '', nameDe: '' });
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories?.find(c => c.id === categoryId);
    return category ? category.nameEn : categoryId;
  };

  const getLevelName = (levelId: string) => {
    const level = levels?.find(l => l.id === levelId);
    return level ? level.nameEn : levelId;
  };

  const handleExportData = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      setExportProgress(10);
      toast.info(t('admin.data.exportStarting'));
      
      const data = await exportData.mutateAsync();
      setExportProgress(50);
      
      // Serialize ExternalBlob objects to URLs and BigInt to strings
      const serializeBlob = (blob: ExternalBlob | undefined) => {
        if (!blob) return undefined;
        return blob.getDirectURL();
      };

      const serializedData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        userProfiles: data.userProfiles.map(([principal, profile]) => ({
          principal: principal.toString(),
          profile: {
            ...profile,
            createdAt: profile.createdAt.toString(),
          },
        })),
        lessons: data.lessons.map(lesson => ({
          ...lesson,
          createdAt: lesson.createdAt.toString(),
          gpFile: serializeBlob(lesson.gpFile),
          pdfFile: serializeBlob(lesson.pdfFile),
          thumbnail: serializeBlob(lesson.thumbnail),
        })),
        learningPaths: data.learningPaths.map(path => ({
          ...path,
          createdAt: path.createdAt.toString(),
        })),
        userProgress: data.userProgress.map(([principal, progress]) => ({
          principal: principal.toString(),
          progress: progress.map(p => ({
            ...p,
            lastAccessed: p.lastAccessed.toString(),
          })),
        })),
        files: data.files.map(file => ({
          ...file,
          uploadedAt: file.uploadedAt.toString(),
          blob: serializeBlob(file.blob),
        })),
        feedbackSubmissions: data.feedbackSubmissions.map(submission => ({
          ...submission,
          user: submission.user.toString(),
          submittedAt: submission.submittedAt.toString(),
          videoFile: serializeBlob(submission.videoFile),
        })),
        feedbackResponses: data.feedbackResponses.map(response => ({
          ...response,
          admin: response.admin.toString(),
          createdAt: response.createdAt.toString(),
          videoResponse: serializeBlob(response.videoResponse),
        })),
        categories: data.categories.map(category => ({
          ...category,
          createdAt: category.createdAt.toString(),
        })),
        levels: data.levels.map(level => ({
          ...level,
          createdAt: level.createdAt.toString(),
        })),
        homepageContent: data.homepageContent ? {
          ...data.homepageContent,
          lastUpdated: data.homepageContent.lastUpdated.toString(),
          headerLogo: serializeBlob(data.homepageContent.headerLogo),
          heroImage: serializeBlob(data.homepageContent.heroImage),
          whyChooseSection: {
            ...data.homepageContent.whyChooseSection,
            featureCards: data.homepageContent.whyChooseSection.featureCards.map(card => ({
              ...card,
              icon: serializeBlob(card.icon),
            })),
          },
          chooseYourPathSection: {
            ...data.homepageContent.chooseYourPathSection,
            pricingOptions: data.homepageContent.chooseYourPathSection.pricingOptions.map(option => ({
              ...option,
              priceEur: option.priceEur.toString(),
            })),
            tierFeatures: data.homepageContent.chooseYourPathSection.tierFeatures.map(tierFeature => ({
              ...tierFeature,
              features: tierFeature.features.map(feature => ({
                ...feature,
                position: feature.position.toString(),
              })),
            })),
          },
        } : null,
      };
      
      setExportProgress(80);
      
      const jsonString = JSON.stringify(serializedData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `everblack-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setExportProgress(100);
      toast.success(t('admin.data.exportSuccess'));
      
      setTimeout(() => {
        setExportProgress(0);
        setIsProcessing(false);
      }, 1000);
    } catch (error: any) {
      setExportProgress(0);
      setIsProcessing(false);
      toast.error(`${t('admin.data.exportError')}: ${error.message || 'Unknown error'}`);
      console.error('Export error:', error);
    }
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error(t('admin.data.invalidFileType'));
      return;
    }

    setImportFile(file);
  };

  const handleImportData = async () => {
    if (!importFile || isProcessing) {
      if (!importFile) toast.error(t('admin.data.selectFile'));
      return;
    }

    if (!confirm(t('admin.data.importConfirm'))) {
      return;
    }

    try {
      setIsProcessing(true);
      setImportProgress(10);
      toast.info(t('admin.data.importStarting'));
      
      const fileContent = await importFile.text();
      setImportProgress(20);
      
      let parsedData: any;
      try {
        parsedData = JSON.parse(fileContent);
      } catch (parseError) {
        throw new Error('Invalid JSON format. Please check your backup file.');
      }
      
      setImportProgress(30);
      
      // Validate data structure
      if (!parsedData.version) {
        throw new Error('Invalid backup file: missing version information');
      }
      
      if (parsedData.version !== '1.0.0') {
        throw new Error(`Unsupported backup version: ${parsedData.version}. Please use a compatible backup file.`);
      }
      
      setImportProgress(40);
      
      // Deserialize data back to proper types
      const deserializeBlob = async (url: string | undefined): Promise<ExternalBlob | undefined> => {
        if (!url) return undefined;
        return ExternalBlob.fromURL(url);
      };

      const importDataPayload: ExportData = {
        userProfiles: await Promise.all(parsedData.userProfiles.map(async (item: any) => [
          Principal.fromText(item.principal),
          {
            ...item.profile,
            createdAt: BigInt(item.profile.createdAt),
          },
        ])),
        lessons: await Promise.all(parsedData.lessons.map(async (lesson: any) => ({
          ...lesson,
          createdAt: BigInt(lesson.createdAt),
          gpFile: await deserializeBlob(lesson.gpFile),
          pdfFile: await deserializeBlob(lesson.pdfFile),
          thumbnail: await deserializeBlob(lesson.thumbnail),
        }))),
        learningPaths: parsedData.learningPaths.map((path: any) => ({
          ...path,
          createdAt: BigInt(path.createdAt),
        })),
        userProgress: await Promise.all(parsedData.userProgress.map(async (item: any) => [
          Principal.fromText(item.principal),
          item.progress.map((p: any) => ({
            ...p,
            lastAccessed: BigInt(p.lastAccessed),
          })),
        ])),
        files: await Promise.all(parsedData.files.map(async (file: any) => ({
          ...file,
          uploadedAt: BigInt(file.uploadedAt),
          blob: await deserializeBlob(file.blob),
        }))),
        feedbackSubmissions: await Promise.all(parsedData.feedbackSubmissions.map(async (submission: any) => ({
          ...submission,
          user: Principal.fromText(submission.user),
          submittedAt: BigInt(submission.submittedAt),
          videoFile: await deserializeBlob(submission.videoFile),
        }))),
        feedbackResponses: await Promise.all(parsedData.feedbackResponses.map(async (response: any) => ({
          ...response,
          admin: Principal.fromText(response.admin),
          createdAt: BigInt(response.createdAt),
          videoResponse: await deserializeBlob(response.videoResponse),
        }))),
        categories: parsedData.categories.map((category: any) => ({
          ...category,
          createdAt: BigInt(category.createdAt),
        })),
        levels: parsedData.levels.map((level: any) => ({
          ...level,
          createdAt: BigInt(level.createdAt),
        })),
        homepageContent: parsedData.homepageContent ? {
          ...parsedData.homepageContent,
          lastUpdated: BigInt(parsedData.homepageContent.lastUpdated),
          headerLogo: await deserializeBlob(parsedData.homepageContent.headerLogo),
          heroImage: await deserializeBlob(parsedData.homepageContent.heroImage),
          whyChooseSection: {
            ...parsedData.homepageContent.whyChooseSection,
            featureCards: await Promise.all(parsedData.homepageContent.whyChooseSection.featureCards.map(async (card: any) => ({
              ...card,
              icon: await deserializeBlob(card.icon),
            }))),
          },
          chooseYourPathSection: {
            ...parsedData.homepageContent.chooseYourPathSection,
            pricingOptions: parsedData.homepageContent.chooseYourPathSection.pricingOptions.map((option: any) => ({
              ...option,
              priceEur: BigInt(option.priceEur),
            })),
            tierFeatures: parsedData.homepageContent.chooseYourPathSection.tierFeatures.map((tierFeature: any) => ({
              ...tierFeature,
              features: tierFeature.features.map((feature: any) => ({
                ...feature,
                position: BigInt(feature.position),
              })),
            })),
          },
        } : undefined,
      };
      
      setImportProgress(70);
      
      await importData.mutateAsync(importDataPayload);
      
      setImportProgress(100);
      toast.success(t('admin.data.importSuccess'));
      setImportFile(null);
      
      setTimeout(() => {
        setImportProgress(0);
        setIsProcessing(false);
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      setImportProgress(0);
      setIsProcessing(false);
      toast.error(`${t('admin.data.importError')}: ${error.message || 'Unknown error'}`);
      console.error('Import error:', error);
    }
  };

  // Homepage content handlers
  const handleHomepageImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'headerLogo' | 'heroImage') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size: 5MB');
      return;
    }

    if (!file.type.includes('image/png') && !file.type.includes('image/jpeg')) {
      toast.error('Please select a PNG or JPG file');
      return;
    }

    if (type === 'headerLogo') {
      setHeaderLogoFile(file);
    } else {
      setHeroImageFile(file);
    }
  };

  const handleFeatureIconChange = (e: React.ChangeEvent<HTMLInputElement>, cardId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size: 2MB');
      return;
    }

    if (!file.type.includes('image/png') && !file.type.includes('image/jpeg')) {
      toast.error('Please select a PNG or JPG file');
      return;
    }

    setFeatureIconFiles(prev => new Map(prev).set(cardId, file));
  };

  const handleAddFeatureCard = () => {
    const newCard: FeatureCard = {
      id: `feature-${Date.now()}`,
      titleEn: '',
      titleDe: '',
      descriptionEn: '',
      descriptionDe: '',
      icon: undefined,
    };
    setHomepageFormData(prev => ({
      ...prev,
      featureCards: [...prev.featureCards, newCard],
    }));
  };

  const handleRemoveFeatureCard = (cardId: string) => {
    setHomepageFormData(prev => ({
      ...prev,
      featureCards: prev.featureCards.filter(card => card.id !== cardId),
    }));
    setFeatureIconFiles(prev => {
      const newMap = new Map(prev);
      newMap.delete(cardId);
      return newMap;
    });
  };

  const handleUpdateFeatureCard = (cardId: string, field: keyof FeatureCard, value: string) => {
    setHomepageFormData(prev => ({
      ...prev,
      featureCards: prev.featureCards.map(card =>
        card.id === cardId ? { ...card, [field]: value } : card
      ),
    }));
  };

  const handleAddPricingOption = () => {
    const newOption: PricingOption = {
      id: `pricing-${Date.now()}`,
      nameEn: '',
      nameDe: '',
      descriptionEn: '',
      descriptionDe: '',
      priceEur: BigInt(0),
      membershipTier: MembershipTier.free,
    };
    setHomepageFormData(prev => ({
      ...prev,
      pricingOptions: [...prev.pricingOptions, newOption],
    }));
  };

  const handleRemovePricingOption = (optionId: string) => {
    setHomepageFormData(prev => ({
      ...prev,
      pricingOptions: prev.pricingOptions.filter(option => option.id !== optionId),
    }));
  };

  const handleUpdatePricingOption = (optionId: string, field: keyof PricingOption, value: string | bigint | MembershipTier) => {
    setHomepageFormData(prev => ({
      ...prev,
      pricingOptions: prev.pricingOptions.map(option =>
        option.id === optionId ? { ...option, [field]: value } : option
      ),
    }));
  };

  // Tier features handlers
  const getTierFeatureList = (tier: MembershipTier): TierFeatureList => {
    const existing = tierFeatures.find(tf => tf.tier === tier);
    if (existing) return existing;
    return { tier, features: [] };
  };

  const handleAddTierFeature = (tier: MembershipTier) => {
    const newFeature: TierFeature = {
      id: `feature-${tier}-${Date.now()}`,
      featureEn: '',
      featureDe: '',
      position: BigInt(getTierFeatureList(tier).features.length),
    };

    setTierFeatures(prev => {
      const existing = prev.find(tf => tf.tier === tier);
      if (existing) {
        return prev.map(tf =>
          tf.tier === tier
            ? { ...tf, features: [...tf.features, newFeature] }
            : tf
        );
      } else {
        return [...prev, { tier, features: [newFeature] }];
      }
    });
  };

  const handleRemoveTierFeature = (tier: MembershipTier, featureId: string) => {
    setTierFeatures(prev =>
      prev.map(tf =>
        tf.tier === tier
          ? {
              ...tf,
              features: tf.features
                .filter(f => f.id !== featureId)
                .map((f, index) => ({ ...f, position: BigInt(index) })),
            }
          : tf
      ).filter(tf => tf.features.length > 0)
    );
  };

  const handleUpdateTierFeature = (tier: MembershipTier, featureId: string, field: 'featureEn' | 'featureDe', value: string) => {
    setTierFeatures(prev =>
      prev.map(tf =>
        tf.tier === tier
          ? {
              ...tf,
              features: tf.features.map(f =>
                f.id === featureId ? { ...f, [field]: value } : f
              ),
            }
          : tf
      )
    );
  };

  const handleMoveTierFeature = (tier: MembershipTier, featureId: string, direction: 'up' | 'down') => {
    setTierFeatures(prev =>
      prev.map(tf => {
        if (tf.tier !== tier) return tf;

        const features = [...tf.features];
        const index = features.findIndex(f => f.id === featureId);
        if (index === -1) return tf;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= features.length) return tf;

        [features[index], features[newIndex]] = [features[newIndex], features[index]];

        return {
          ...tf,
          features: features.map((f, i) => ({ ...f, position: BigInt(i) })),
        };
      })
    );
  };

  const handleSaveTierFeatures = async () => {
    // Validation
    for (const tierFeatureList of tierFeatures) {
      for (const feature of tierFeatureList.features) {
        if (!feature.featureEn.trim() || !feature.featureDe.trim()) {
          toast.error('Please fill in all feature fields in both languages');
          return;
        }
      }
    }

    try {
      await updateTierFeaturesMutation.mutateAsync(tierFeatures);
      toast.success('Tier features updated successfully! Changes are now live.');
    } catch (error) {
      toast.error('Failed to update tier features');
      console.error(error);
    }
  };

  const handleHomepageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!homepageFormData.heroTextEn.trim() || !homepageFormData.heroTextDe.trim()) {
      toast.error('Please fill in hero text for both languages');
      return;
    }

    if (!homepageFormData.whyChooseTitleEn.trim() || !homepageFormData.whyChooseTitleDe.trim()) {
      toast.error('Please fill in "Why Choose" section title for both languages');
      return;
    }

    if (!homepageFormData.pricingTitleEn.trim() || !homepageFormData.pricingTitleDe.trim()) {
      toast.error('Please fill in pricing section title for both languages');
      return;
    }

    // Validate feature cards
    for (const card of homepageFormData.featureCards) {
      if (!card.titleEn.trim() || !card.titleDe.trim() || !card.descriptionEn.trim() || !card.descriptionDe.trim()) {
        toast.error('Please fill in all fields for feature cards in both languages');
        return;
      }
    }

    // Validate pricing options
    for (const option of homepageFormData.pricingOptions) {
      if (!option.nameEn.trim() || !option.nameDe.trim() || !option.descriptionEn.trim() || !option.descriptionDe.trim()) {
        toast.error('Please fill in all fields for pricing options in both languages');
        return;
      }
    }

    try {
      let headerLogoBlob = homepageContent?.headerLogo;
      let heroImageBlob = homepageContent?.heroImage;

      if (headerLogoFile) {
        headerLogoBlob = await fileToExternalBlob(headerLogoFile, 'headerLogo');
      }

      if (heroImageFile) {
        heroImageBlob = await fileToExternalBlob(heroImageFile, 'heroImage');
      }

      // Process feature card icons
      const processedFeatureCards: FeatureCard[] = await Promise.all(
        homepageFormData.featureCards.map(async (card) => {
          let iconBlob = card.icon;
          const iconFile = featureIconFiles.get(card.id);
          if (iconFile) {
            iconBlob = await fileToExternalBlob(iconFile, 'featureIcon');
          }
          return {
            ...card,
            icon: iconBlob,
          };
        })
      );

      const content: HomepageContent = {
        headerLogo: headerLogoBlob,
        heroImage: heroImageBlob,
        heroTextEn: homepageFormData.heroTextEn.trim(),
        heroTextDe: homepageFormData.heroTextDe.trim(),
        whyChooseSection: {
          titleEn: homepageFormData.whyChooseTitleEn.trim(),
          titleDe: homepageFormData.whyChooseTitleDe.trim(),
          descriptionEn: homepageFormData.whyChooseDescEn.trim(),
          descriptionDe: homepageFormData.whyChooseDescDe.trim(),
          featureCards: processedFeatureCards,
        },
        chooseYourPathSection: {
          titleEn: homepageFormData.pricingTitleEn.trim(),
          titleDe: homepageFormData.pricingTitleDe.trim(),
          descriptionEn: homepageFormData.pricingDescEn.trim(),
          descriptionDe: homepageFormData.pricingDescDe.trim(),
          pricingOptions: homepageFormData.pricingOptions,
          tierFeatures: tierFeatures,
        },
        lastUpdated: BigInt(Date.now() * 1000000),
      };

      await updateHomepageContentMutation.mutateAsync(content);
      toast.success(t('admin.homepage.saveSuccess'));
      setHeaderLogoFile(null);
      setHeroImageFile(null);
      setFeatureIconFiles(new Map());
      setHomepageUploadProgress({ headerLogo: 0, heroImage: 0 });
    } catch (error) {
      toast.error(t('admin.homepage.saveError'));
      console.error(error);
    }
  };

  // Check if categories and levels are available
  const hasCategoriesAndLevels = categories && categories.length > 0 && levels && levels.length > 0;

  const membershipTiers = [
    { tier: MembershipTier.free, name: 'Free' },
    { tier: MembershipTier.starter, name: 'Starter' },
    { tier: MembershipTier.pro, name: 'Pro' },
    { tier: MembershipTier.coaching, name: 'Coaching' },
  ];

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
        <p className="text-lg text-muted-foreground">
          Manage lessons, categories, users, feedback, and payment settings
        </p>
      </div>

      <Tabs defaultValue="lessons" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 lg:w-auto">
          <TabsTrigger value="lessons" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">{t('admin.tabs.lessons')}</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            <span className="hidden sm:inline">{t('admin.tabs.categories')}</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{t('admin.tabs.users')}</span>
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">{t('admin.tabs.feedback')}</span>
          </TabsTrigger>
          <TabsTrigger value="stripe" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">{t('admin.tabs.stripe')}</span>
          </TabsTrigger>
          <TabsTrigger value="homepage" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">{t('admin.tabs.homepage')}</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{t('admin.tabs.data')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="space-y-6">
          {!hasCategoriesAndLevels && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Before creating lessons, please create at least one category and one level in the "Categories & Levels" tab.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>All Lessons</CardTitle>
              <CardDescription>View and manage your lesson library</CardDescription>
            </CardHeader>
            <CardContent>
              {lessons && lessons.length > 0 ? (
                <div className="space-y-4">
                  {lessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex gap-4 flex-1">
                        {lesson.thumbnail && (
                          <img 
                            src={lesson.thumbnail.getDirectURL()} 
                            alt={lesson.title}
                            className="w-20 h-20 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium">{lesson.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{lesson.description}</p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            <p className="text-xs text-muted-foreground">
                              Required: {lesson.requiredMembership}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {getCategoryName(lesson.categoryId)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {getLevelName(lesson.levelId)}
                            </Badge>
                            {lesson.tags && lesson.tags.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                {lesson.tags.length} tags
                              </Badge>
                            )}
                            {lesson.pdfFile && <span className="text-xs text-primary">📄 PDF</span>}
                            {lesson.gpFile && <span className="text-xs text-primary">🎸 GP</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(lesson)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(lesson.id)}
                          disabled={deleteLesson.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No lessons yet. Create your first lesson below!
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{editingLesson ? 'Edit Lesson' : 'Create New Lesson'}</CardTitle>
              <CardDescription>
                {editingLesson ? 'Update lesson details' : 'Add a new lesson to your library'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Lesson Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Introduction to Guitar Basics"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what students will learn in this lesson"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoUrl">Video URL (YouTube) *</Label>
                  <Input
                    id="videoUrl"
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste YouTube link (will be embedded automatically)
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.categoryId || undefined}
                      onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories && categories.length > 0 ? (
                          categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.nameEn}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            No categories available. Create one in the Categories tab first.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {!formData.categoryId && (
                      <p className="text-xs text-destructive">Category is required</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="level">Level *</Label>
                    <Select
                      value={formData.levelId || undefined}
                      onValueChange={(value) => setFormData({ ...formData, levelId: value })}
                    >
                      <SelectTrigger id="level">
                        <SelectValue placeholder="Select level..." />
                      </SelectTrigger>
                      <SelectContent>
                        {levels && levels.length > 0 ? (
                          levels.map((level) => (
                            <SelectItem key={level.id} value={level.id}>
                              {level.nameEn}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            No levels available. Create one in the Categories tab first.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {!formData.levelId && (
                      <p className="text-xs text-destructive">Level is required</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    placeholder="e.g., scales, fingerpicking, blues"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Add tags to help recommend related lessons
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recommendedNext">Recommended Next Lesson (optional)</Label>
                  <Select
                    value={formData.recommendedNextLessonId || undefined}
                    onValueChange={(value) => setFormData({ ...formData, recommendedNextLessonId: value === 'none' ? null : value })}
                  >
                    <SelectTrigger id="recommendedNext">
                      <SelectValue placeholder="Select next lesson..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {lessons?.filter(l => l.id !== editingLesson?.id).map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id}>
                          {lesson.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="membership">Required Membership</Label>
                  <Select
                    value={formData.requiredMembership}
                    onValueChange={(value) =>
                      setFormData({ ...formData, requiredMembership: value as MembershipTier })
                    }
                  >
                    <SelectTrigger id="membership">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={MembershipTier.free}>Free</SelectItem>
                      <SelectItem value={MembershipTier.starter}>Starter</SelectItem>
                      <SelectItem value={MembershipTier.pro}>Pro</SelectItem>
                      <SelectItem value={MembershipTier.coaching}>Coaching</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnailFile">Thumbnail Image (PNG/JPG, optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="thumbnailFile"
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={(e) => handleFileChange(e, 'thumbnail')}
                      className="cursor-pointer"
                    />
                    {thumbnailFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setThumbnailFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {thumbnailFile && <p className="text-xs text-muted-foreground">🖼️ {thumbnailFile.name}</p>}
                  {editingLesson?.thumbnail && !thumbnailFile && (
                    <p className="text-xs text-primary">✓ Thumbnail already uploaded</p>
                  )}
                  {uploadProgress.thumbnail > 0 && uploadProgress.thumbnail < 100 && (
                    <p className="text-xs text-muted-foreground">Uploading: {uploadProgress.thumbnail}%</p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pdfFile">PDF File (optional)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="pdfFile"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileChange(e, 'pdf')}
                        className="cursor-pointer"
                      />
                      {pdfFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPdfFile(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {pdfFile && <p className="text-xs text-muted-foreground">📄 {pdfFile.name}</p>}
                    {editingLesson?.pdfFile && !pdfFile && (
                      <p className="text-xs text-primary">✓ PDF already uploaded</p>
                    )}
                    {uploadProgress.pdf > 0 && uploadProgress.pdf < 100 && (
                      <p className="text-xs text-muted-foreground">Uploading: {uploadProgress.pdf}%</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gpFile">Guitar Pro File (optional)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="gpFile"
                        type="file"
                        accept=".gp,.gp5,.gpx"
                        onChange={(e) => handleFileChange(e, 'gp')}
                        className="cursor-pointer"
                      />
                      {gpFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setGpFile(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {gpFile && <p className="text-xs text-muted-foreground">🎸 {gpFile.name}</p>}
                    {editingLesson?.gpFile && !gpFile && (
                      <p className="text-xs text-primary">✓ GP already uploaded</p>
                    )}
                    {uploadProgress.gp > 0 && uploadProgress.gp < 100 && (
                      <p className="text-xs text-muted-foreground">Uploading: {uploadProgress.gp}%</p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button 
                    type="submit" 
                    disabled={addLesson.isPending || updateLesson.isPending || !hasCategoriesAndLevels}
                  >
                    {addLesson.isPending || updateLesson.isPending
                      ? 'Saving...'
                      : editingLesson
                        ? 'Update Lesson'
                        : 'Create Lesson'}
                  </Button>
                  {editingLesson && (
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.categories.title')}</CardTitle>
              <CardDescription>{t('admin.categories.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <img src="/assets/generated/category-icon-transparent.dim_64x64.png" alt="" className="h-6 w-6" />
                    {t('admin.categories.allCategories')}
                  </h3>
                  {categories && categories.length > 0 ? (
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{category.nameEn}</p>
                            <p className="text-sm text-muted-foreground">{category.nameDe}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditCategory(category)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}
                              disabled={deleteCategory.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      {t('admin.categories.noCategories')}
                    </p>
                  )}

                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-base">
                        {editingCategory ? t('admin.categories.editCategory') : t('admin.categories.createCategory')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCategorySubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="categoryNameEn">{t('admin.categories.nameEn')} *</Label>
                          <Input
                            id="categoryNameEn"
                            placeholder="e.g., Technique"
                            value={categoryFormData.nameEn}
                            onChange={(e) => setCategoryFormData({ ...categoryFormData, nameEn: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="categoryNameDe">{t('admin.categories.nameDe')} *</Label>
                          <Input
                            id="categoryNameDe"
                            placeholder="z.B. Technik"
                            value={categoryFormData.nameDe}
                            onChange={(e) => setCategoryFormData({ ...categoryFormData, nameDe: e.target.value })}
                            required
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button type="submit" disabled={addCategory.isPending || updateCategory.isPending}>
                            {addCategory.isPending || updateCategory.isPending
                              ? editingCategory ? t('admin.categories.updating') : t('admin.categories.creating')
                              : editingCategory ? t('admin.categories.update') : t('admin.categories.create')}
                          </Button>
                          {editingCategory && (
                            <Button type="button" variant="outline" onClick={handleCancelCategory}>
                              {t('admin.categories.cancel')}
                            </Button>
                          )}
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <img src="/assets/generated/level-icon-transparent.dim_64x64.png" alt="" className="h-6 w-6" />
                    {t('admin.categories.allLevels')}
                  </h3>
                  {levels && levels.length > 0 ? (
                    <div className="space-y-2">
                      {levels.map((level) => (
                        <div key={level.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{level.nameEn}</p>
                            <p className="text-sm text-muted-foreground">{level.nameDe}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditLevel(level)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteLevel(level.id)}
                              disabled={deleteLevel.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      {t('admin.categories.noLevels')}
                    </p>
                  )}

                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-base">
                        {editingLevel ? t('admin.categories.editLevel') : t('admin.categories.createLevel')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleLevelSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="levelNameEn">{t('admin.categories.nameEn')} *</Label>
                          <Input
                            id="levelNameEn"
                            placeholder="e.g., Beginner"
                            value={levelFormData.nameEn}
                            onChange={(e) => setLevelFormData({ ...levelFormData, nameEn: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="levelNameDe">{t('admin.categories.nameDe')} *</Label>
                          <Input
                            id="levelNameDe"
                            placeholder="z.B. Anfänger"
                            value={levelFormData.nameDe}
                            onChange={(e) => setLevelFormData({ ...levelFormData, nameDe: e.target.value })}
                            required
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button type="submit" disabled={addLevel.isPending || updateLevel.isPending}>
                            {addLevel.isPending || updateLevel.isPending
                              ? editingLevel ? t('admin.categories.updating') : t('admin.categories.creating')
                              : editingLevel ? t('admin.categories.update') : t('admin.categories.create')}
                          </Button>
                          {editingLevel && (
                            <Button type="button" variant="outline" onClick={handleCancelLevel}>
                              {t('admin.categories.cancel')}
                            </Button>
                          )}
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.users.title')}</CardTitle>
              <CardDescription>{t('admin.users.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              {allUsers && allUsers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.users.name')}</TableHead>
                      <TableHead>{t('admin.users.email')}</TableHead>
                      <TableHead>{t('admin.users.role')}</TableHead>
                      <TableHead>{t('admin.users.membership')}</TableHead>
                      <TableHead>{t('admin.users.status')}</TableHead>
                      <TableHead>{t('admin.users.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map(([principal, profile]) => {
                      const principalStr = principal.toString();
                      const currentRole = userRoleMap.get(principalStr) || UserRole.user;
                      
                      return (
                        <TableRow key={principalStr}>
                          <TableCell className="font-medium">{profile.name}</TableCell>
                          <TableCell>{profile.email}</TableCell>
                          <TableCell>
                            <Select
                              value={currentRole}
                              onValueChange={(value) => handleRoleChange(principal, value as UserRole)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={UserRole.user}>User</SelectItem>
                                <SelectItem value={UserRole.admin}>Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{profile.membership}</Badge>
                          </TableCell>
                          <TableCell>
                            {profile.isSuspended ? (
                              <Badge variant="destructive">{t('admin.users.suspended')}</Badge>
                            ) : (
                              <Badge variant="default">{t('admin.users.active')}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {profile.isSuspended ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReactivate(principal)}
                                disabled={reactivateUser.isPending}
                              >
                                {t('admin.users.reactivate')}
                              </Button>
                            ) : (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleSuspend(principal)}
                                disabled={suspendUser.isPending}
                              >
                                {t('admin.users.suspend')}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('admin.users.noUsers')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.feedback.title')}</CardTitle>
              <CardDescription>{t('admin.feedback.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              {feedbackSubmissions && feedbackSubmissions.length > 0 ? (
                <div className="space-y-4">
                  {feedbackSubmissions.map((submission) => {
                    const lesson = lessons?.find((l) => l.id === submission.lessonId);
                    const user = allUsers?.find(([p]) => p.toString() === submission.user.toString())?.[1];

                    return (
                      <div key={submission.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{user?.name || 'Unknown User'}</h3>
                              {getStatusBadge(submission.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              <strong>{t('admin.feedback.lesson')}:</strong> {lesson?.title || submission.lessonId}
                            </p>
                            <p className="text-sm">
                              <strong>{t('admin.feedback.comment')}:</strong> {submission.comment}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{t('admin.feedback.submittedAt')}: {new Date(Number(submission.submittedAt) / 1000000).toLocaleDateString()}</span>
                              {submission.videoFile && <span>📹 {t('admin.feedback.video')}</span>}
                              {submission.youtubeLink && (
                                <a href={submission.youtubeLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                                  <Youtube className="h-3 w-3" />
                                  {t('admin.feedback.youtubeLink')}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {submission.status !== FeedbackStatus.responded && (
                          <Dialog open={respondingTo === submission.id} onOpenChange={(open) => !open && setRespondingTo(null)}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setRespondingTo(submission.id)}>
                                {t('admin.feedback.respond')}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{t('admin.feedback.respond')}</DialogTitle>
                                <DialogDescription>
                                  Provide feedback to {user?.name || 'the student'}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="responseText">{t('admin.feedback.textResponse')}</Label>
                                  <Textarea
                                    id="responseText"
                                    placeholder={t('admin.feedback.textResponsePlaceholder')}
                                    value={responseText}
                                    onChange={(e) => setResponseText(e.target.value)}
                                    rows={4}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="responseVideo">{t('admin.feedback.videoResponse')}</Label>
                                  <Input
                                    id="responseVideo"
                                    type="file"
                                    accept="video/mp4,video/quicktime"
                                    onChange={handleResponseVideoChange}
                                    className="cursor-pointer"
                                  />
                                  <p className="text-xs text-muted-foreground">{t('admin.feedback.videoResponseDescription')}</p>
                                  {responseVideoFile && <p className="text-xs text-primary">✓ {responseVideoFile.name}</p>}
                                  {responseUploadProgress > 0 && responseUploadProgress < 100 && (
                                    <p className="text-xs text-muted-foreground">Uploading: {responseUploadProgress}%</p>
                                  )}
                                </div>

                                <Button
                                  onClick={() => handleSubmitResponse(submission.id)}
                                  disabled={addResponse.isPending}
                                  className="w-full"
                                >
                                  {addResponse.isPending ? t('admin.feedback.submittingResponse') : t('admin.feedback.submitResponse')}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('admin.feedback.noSubmissions')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stripe">
          <Card>
            <CardHeader>
              <CardTitle>Stripe Payment Configuration</CardTitle>
              <CardDescription>
                {isStripeConfigured
                  ? 'Stripe is configured. You can update your settings below.'
                  : 'Configure Stripe to enable membership purchases.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isStripeConfigured && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    ✓ Stripe is currently configured and active
                  </p>
                </div>
              )}
              <form onSubmit={handleStripeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="secretKey">Stripe Secret Key *</Label>
                  <Input
                    id="secretKey"
                    type="password"
                    placeholder="sk_test_... or sk_live_..."
                    value={stripeData.secretKey}
                    onChange={(e) => setStripeData({ ...stripeData, secretKey: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Your Stripe secret key (starts with sk_test_ or sk_live_)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="countries">Allowed Countries (comma-separated) *</Label>
                  <Input
                    id="countries"
                    placeholder="US,CA,GB,DE,AT,CH"
                    value={stripeData.countries}
                    onChange={(e) => setStripeData({ ...stripeData, countries: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    ISO country codes for allowed payment countries (e.g., US, CA, GB, DE, AT, CH)
                  </p>
                </div>
                <Button type="submit" disabled={setStripeConfig.isPending}>
                  {setStripeConfig.isPending 
                    ? 'Configuring...' 
                    : isStripeConfigured 
                      ? 'Update Configuration' 
                      : 'Configure Stripe'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="homepage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.homepage.title')}</CardTitle>
              <CardDescription>{t('admin.homepage.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              {!homepageContent && (
                <Alert className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t('admin.homepage.noContent')}
                  </AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleHomepageSubmit} className="space-y-6">
                {/* Header Logo */}
                <div className="space-y-2">
                  <Label htmlFor="headerLogo">{t('admin.homepage.headerLogo')}</Label>
                  <Input
                    id="headerLogo"
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(e) => handleHomepageImageChange(e, 'headerLogo')}
                    className="cursor-pointer"
                  />
                  {headerLogoFile && <p className="text-xs text-primary">✓ {headerLogoFile.name}</p>}
                  {homepageContent?.headerLogo && !headerLogoFile && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-2">{t('admin.homepage.currentImage')}:</p>
                      <img src={homepageContent.headerLogo.getDirectURL()} alt="Header Logo" className="h-16 object-contain" />
                    </div>
                  )}
                  {homepageUploadProgress.headerLogo > 0 && homepageUploadProgress.headerLogo < 100 && (
                    <p className="text-xs text-muted-foreground">Uploading: {homepageUploadProgress.headerLogo}%</p>
                  )}
                </div>

                {/* Hero Image */}
                <div className="space-y-2">
                  <Label htmlFor="heroImage">{t('admin.homepage.heroImage')}</Label>
                  <Input
                    id="heroImage"
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(e) => handleHomepageImageChange(e, 'heroImage')}
                    className="cursor-pointer"
                  />
                  {heroImageFile && <p className="text-xs text-primary">✓ {heroImageFile.name}</p>}
                  {homepageContent?.heroImage && !heroImageFile && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-2">{t('admin.homepage.currentImage')}:</p>
                      <img src={homepageContent.heroImage.getDirectURL()} alt="Hero" className="h-32 object-cover rounded" />
                    </div>
                  )}
                  {homepageUploadProgress.heroImage > 0 && homepageUploadProgress.heroImage < 100 && (
                    <p className="text-xs text-muted-foreground">Uploading: {homepageUploadProgress.heroImage}%</p>
                  )}
                </div>

                {/* Hero Text */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="heroTextEn">{t('admin.homepage.heroTextEn')} *</Label>
                    <Textarea
                      id="heroTextEn"
                      placeholder="Master Guitar with AI-Ready Online Academy"
                      value={homepageFormData.heroTextEn}
                      onChange={(e) => setHomepageFormData({ ...homepageFormData, heroTextEn: e.target.value })}
                      rows={3}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heroTextDe">{t('admin.homepage.heroTextDe')} *</Label>
                    <Textarea
                      id="heroTextDe"
                      placeholder="Gitarre meistern mit KI-gestützter Online-Akademie"
                      value={homepageFormData.heroTextDe}
                      onChange={(e) => setHomepageFormData({ ...homepageFormData, heroTextDe: e.target.value })}
                      rows={3}
                      required
                    />
                  </div>
                </div>

                {/* Why Choose Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">{t('admin.homepage.whyChooseTitle')}</h3>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="whyChooseTitleEn">{t('admin.homepage.whyChooseTitleEn')} *</Label>
                      <Input
                        id="whyChooseTitleEn"
                        placeholder="Why Choose Everblack Music?"
                        value={homepageFormData.whyChooseTitleEn}
                        onChange={(e) => setHomepageFormData({ ...homepageFormData, whyChooseTitleEn: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whyChooseTitleDe">{t('admin.homepage.whyChooseTitleDe')} *</Label>
                      <Input
                        id="whyChooseTitleDe"
                        placeholder="Warum Everblack Music?"
                        value={homepageFormData.whyChooseTitleDe}
                        onChange={(e) => setHomepageFormData({ ...homepageFormData, whyChooseTitleDe: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="whyChooseDescEn">{t('admin.homepage.whyChooseDescEn')}</Label>
                      <Textarea
                        id="whyChooseDescEn"
                        placeholder="Everything you need..."
                        value={homepageFormData.whyChooseDescEn}
                        onChange={(e) => setHomepageFormData({ ...homepageFormData, whyChooseDescEn: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whyChooseDescDe">{t('admin.homepage.whyChooseDescDe')}</Label>
                      <Textarea
                        id="whyChooseDescDe"
                        placeholder="Alles, was Sie brauchen..."
                        value={homepageFormData.whyChooseDescDe}
                        onChange={(e) => setHomepageFormData({ ...homepageFormData, whyChooseDescDe: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Feature Cards */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>{t('admin.homepage.featureCards')}</Label>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddFeatureCard}>
                        {t('admin.homepage.addFeatureCard')}
                      </Button>
                    </div>
                    {homepageFormData.featureCards.map((card, index) => (
                      <Card key={card.id} className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Feature Card {index + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFeatureCard(card.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <Label>{t('admin.homepage.featureIcon')}</Label>
                            <Input
                              type="file"
                              accept="image/png,image/jpeg"
                              onChange={(e) => handleFeatureIconChange(e, card.id)}
                              className="cursor-pointer"
                            />
                            {featureIconFiles.get(card.id) && (
                              <p className="text-xs text-primary">✓ {featureIconFiles.get(card.id)?.name}</p>
                            )}
                            {card.icon && !featureIconFiles.get(card.id) && (
                              <img src={card.icon.getDirectURL()} alt="Icon" className="h-12 w-12 object-contain" />
                            )}
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>{t('admin.homepage.featureTitleEn')} *</Label>
                              <Input
                                placeholder="Structured Lessons"
                                value={card.titleEn}
                                onChange={(e) => handleUpdateFeatureCard(card.id, 'titleEn', e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t('admin.homepage.featureTitleDe')} *</Label>
                              <Input
                                placeholder="Strukturierte Lektionen"
                                value={card.titleDe}
                                onChange={(e) => handleUpdateFeatureCard(card.id, 'titleDe', e.target.value)}
                                required
                              />
                            </div>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>{t('admin.homepage.featureDescEn')} *</Label>
                              <Textarea
                                placeholder="Learn guitar with professionally crafted lessons..."
                                value={card.descriptionEn}
                                onChange={(e) => handleUpdateFeatureCard(card.id, 'descriptionEn', e.target.value)}
                                rows={2}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t('admin.homepage.featureDescDe')} *</Label>
                              <Textarea
                                placeholder="Gitarre lernen mit professionell gestalteten Lektionen..."
                                value={card.descriptionDe}
                                onChange={(e) => handleUpdateFeatureCard(card.id, 'descriptionDe', e.target.value)}
                                rows={2}
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">{t('admin.homepage.pricingTitle')}</h3>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="pricingTitleEn">{t('admin.homepage.pricingTitleEn')} *</Label>
                      <Input
                        id="pricingTitleEn"
                        placeholder="Choose Your Path"
                        value={homepageFormData.pricingTitleEn}
                        onChange={(e) => setHomepageFormData({ ...homepageFormData, pricingTitleEn: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pricingTitleDe">{t('admin.homepage.pricingTitleDe')} *</Label>
                      <Input
                        id="pricingTitleDe"
                        placeholder="Wählen Sie Ihren Weg"
                        value={homepageFormData.pricingTitleDe}
                        onChange={(e) => setHomepageFormData({ ...homepageFormData, pricingTitleDe: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="pricingDescEn">{t('admin.homepage.pricingDescEn')}</Label>
                      <Textarea
                        id="pricingDescEn"
                        placeholder="Select the membership tier..."
                        value={homepageFormData.pricingDescEn}
                        onChange={(e) => setHomepageFormData({ ...homepageFormData, pricingDescEn: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pricingDescDe">{t('admin.homepage.pricingDescDe')}</Label>
                      <Textarea
                        id="pricingDescDe"
                        placeholder="Wählen Sie die Mitgliedschaftsstufe..."
                        value={homepageFormData.pricingDescDe}
                        onChange={(e) => setHomepageFormData({ ...homepageFormData, pricingDescDe: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Pricing Options */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>{t('admin.homepage.pricingOptions')}</Label>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddPricingOption}>
                        {t('admin.homepage.addPricingOption')}
                      </Button>
                    </div>
                    {homepageFormData.pricingOptions.map((option, index) => (
                      <Card key={option.id} className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Pricing Option {index + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemovePricingOption(option.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>{t('admin.homepage.pricingNameEn')} *</Label>
                              <Input
                                placeholder="Starter"
                                value={option.nameEn}
                                onChange={(e) => handleUpdatePricingOption(option.id, 'nameEn', e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t('admin.homepage.pricingNameDe')} *</Label>
                              <Input
                                placeholder="Starter"
                                value={option.nameDe}
                                onChange={(e) => handleUpdatePricingOption(option.id, 'nameDe', e.target.value)}
                                required
                              />
                            </div>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>{t('admin.homepage.pricingDescriptionEn')} *</Label>
                              <Textarea
                                placeholder="Perfect for beginners"
                                value={option.descriptionEn}
                                onChange={(e) => handleUpdatePricingOption(option.id, 'descriptionEn', e.target.value)}
                                rows={2}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t('admin.homepage.pricingDescriptionDe')} *</Label>
                              <Textarea
                                placeholder="Perfekt für Anfänger"
                                value={option.descriptionDe}
                                onChange={(e) => handleUpdatePricingOption(option.id, 'descriptionDe', e.target.value)}
                                rows={2}
                                required
                              />
                            </div>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>{t('admin.homepage.priceEur')} *</Label>
                              <Input
                                type="number"
                                min="0"
                                placeholder="19"
                                value={Number(option.priceEur)}
                                onChange={(e) => handleUpdatePricingOption(option.id, 'priceEur', BigInt(e.target.value || 0))}
                                required
                              />
                              <p className="text-xs text-muted-foreground">Price in Euros (€)</p>
                            </div>
                            <div className="space-y-2">
                              <Label>{t('admin.homepage.membershipTier')} *</Label>
                              <Select
                                value={option.membershipTier}
                                onValueChange={(value) => handleUpdatePricingOption(option.id, 'membershipTier', value as MembershipTier)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={MembershipTier.free}>Free</SelectItem>
                                  <SelectItem value={MembershipTier.starter}>Starter</SelectItem>
                                  <SelectItem value={MembershipTier.pro}>Pro</SelectItem>
                                  <SelectItem value={MembershipTier.coaching}>Coaching</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Tier Features Management */}
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold mb-4">Membership Tier Features</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Manage the feature lists displayed for each membership tier. Features will be shown with checkmarks on the homepage.
                    </p>
                    
                    <div className="space-y-6">
                      {membershipTiers.map((tierInfo) => {
                        const tierFeatureList = getTierFeatureList(tierInfo.tier);
                        
                        return (
                          <Card key={tierInfo.tier} className="p-4">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-lg">{tierInfo.name} Tier Features</h4>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAddTierFeature(tierInfo.tier)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Feature
                                </Button>
                              </div>

                              {tierFeatureList.features.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  No features yet. Click "Add Feature" to create one.
                                </p>
                              ) : (
                                <div className="space-y-3">
                                  {tierFeatureList.features
                                    .sort((a, b) => Number(a.position) - Number(b.position))
                                    .map((feature, index) => (
                                      <div key={feature.id} className="border rounded-lg p-3 space-y-3">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <div className="flex flex-col gap-1">
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => handleMoveTierFeature(tierInfo.tier, feature.id, 'up')}
                                                disabled={index === 0}
                                              >
                                                ▲
                                              </Button>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => handleMoveTierFeature(tierInfo.tier, feature.id, 'down')}
                                                disabled={index === tierFeatureList.features.length - 1}
                                              >
                                                ▼
                                              </Button>
                                            </div>
                                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">Feature {index + 1}</span>
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveTierFeature(tierInfo.tier, feature.id)}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-3">
                                          <div className="space-y-2">
                                            <Label className="text-xs">Feature Text (English) *</Label>
                                            <Input
                                              placeholder="e.g., Access to free lessons"
                                              value={feature.featureEn}
                                              onChange={(e) =>
                                                handleUpdateTierFeature(tierInfo.tier, feature.id, 'featureEn', e.target.value)
                                              }
                                              required
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label className="text-xs">Feature Text (German) *</Label>
                                            <Input
                                              placeholder="z.B. Zugang zu kostenlosen Lektionen"
                                              value={feature.featureDe}
                                              onChange={(e) =>
                                                handleUpdateTierFeature(tierInfo.tier, feature.id, 'featureDe', e.target.value)
                                              }
                                              required
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>

                    <div className="mt-6">
                      <Button
                        type="button"
                        onClick={handleSaveTierFeatures}
                        disabled={updateTierFeaturesMutation.isPending}
                        variant="secondary"
                        className="w-full"
                      >
                        {updateTierFeaturesMutation.isPending ? 'Saving Tier Features...' : 'Save Tier Features'}
                      </Button>
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={updateHomepageContentMutation.isPending} className="w-full">
                  {updateHomepageContentMutation.isPending ? t('admin.homepage.saving') : t('admin.homepage.saveChanges')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <img src="/assets/generated/export-icon-transparent.dim_64x64.png" alt="" className="h-6 w-6" />
                  {t('admin.data.exportTitle')}
                </CardTitle>
                <CardDescription>{t('admin.data.exportDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {exportProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Export Progress</span>
                      <span className="font-medium">{exportProgress}%</span>
                    </div>
                    <Progress value={exportProgress} className="h-2" />
                  </div>
                )}
                <Button
                  onClick={handleExportData}
                  disabled={isProcessing}
                  className="w-full md:w-auto"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('admin.data.exporting')}
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      {t('admin.data.exportButton')}
                    </>
                  )}
                </Button>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Export includes:</strong> All lessons, users, categories, levels, feedback, homepage content, and media references. The backup file will be in JSON format and can be imported into another instance.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <img src="/assets/generated/import-icon-transparent.dim_64x64.png" alt="" className="h-6 w-6" />
                  {t('admin.data.importTitle')}
                </CardTitle>
                <CardDescription>{t('admin.data.importDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="importFile">{t('admin.data.selectBackupFile')}</Label>
                  <Input
                    id="importFile"
                    type="file"
                    accept=".json"
                    onChange={handleImportFileChange}
                    className="cursor-pointer"
                    disabled={isProcessing}
                  />
                  {importFile && (
                    <p className="text-xs text-primary">✓ {importFile.name}</p>
                  )}
                </div>

                {importProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Import Progress</span>
                      <span className="font-medium">{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} className="h-2" />
                  </div>
                )}

                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium mb-2">
                    ⚠️ {t('admin.data.importWarningTitle')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('admin.data.importWarningMessage')}
                  </p>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Compatibility:</strong> Only import backup files created with the same version (v1.0.0). The import process validates the file structure and will show detailed error messages if issues are detected.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleImportData}
                  disabled={!importFile || isProcessing}
                  variant="destructive"
                  className="w-full md:w-auto"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('admin.data.importing')}
                    </>
                  ) : (
                    <>
                      <FileUp className="h-4 w-4 mr-2" />
                      {t('admin.data.importButton')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
