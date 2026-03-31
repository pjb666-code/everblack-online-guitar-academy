import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { UserProfile, UserRole, Lesson, LearningPath, Progress, StripeConfiguration, ShoppingItem, ThemePreference, LanguagePreference, FeedbackSubmission, FeedbackResponse, Category, Level, ExportData, HomepageContent, TierFeatureList } from '../backend';
import { Principal } from '@icp-sdk/core/principal';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Theme Preference Queries
export function useGetCallerThemePreference() {
  const { actor, isFetching } = useActor();

  return useQuery<ThemePreference>({
    queryKey: ['currentUserTheme'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerThemePreference();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetCallerThemePreference() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (theme: ThemePreference) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setCallerThemePreference(theme);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserTheme'] });
    },
  });
}

// Language Preference Queries
export function useGetCallerLanguagePreference() {
  const { actor, isFetching } = useActor();

  return useQuery<LanguagePreference>({
    queryKey: ['currentUserLanguage'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerLanguagePreference();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetCallerLanguagePreference() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (language: LanguagePreference) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setCallerLanguagePreference(language);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserLanguage'] });
    },
  });
}

// User Role Queries
export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ['currentUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// User Management Queries
export function useGetAllUserProfiles() {
  const { actor, isFetching } = useActor();

  return useQuery<[Principal, UserProfile][]>({
    queryKey: ['allUserProfiles'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllUserProfiles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAssignUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignCallerUserRole(user, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUserProfiles'] });
    },
  });
}

export function useSuspendUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.suspendUser(user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUserProfiles'] });
    },
  });
}

export function useReactivateUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.reactivateUser(user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUserProfiles'] });
    },
  });
}

// Lesson Queries
export function useGetLessons() {
  const { actor, isFetching } = useActor();

  return useQuery<Lesson[]>({
    queryKey: ['lessons'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLessons();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddLesson() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lesson: Lesson) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addLesson(lesson);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
    },
  });
}

export function useUpdateLesson() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lesson: Lesson) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateLesson(lesson);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
    },
  });
}

export function useDeleteLesson() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lessonId: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteLesson(lessonId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
    },
  });
}

// Recommended Lessons Query
export function useGetRecommendedLessons(lessonId: string) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Lesson[]>({
    queryKey: ['recommendedLessons', lessonId],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getRecommendedLessons(lessonId, identity.getPrincipal());
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

// Category Queries
export function useGetCategories() {
  const { actor, isFetching } = useActor();

  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCategories();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddCategory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: Category) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addCategory(category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: Category) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateCategory(category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteCategory(categoryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// Level Queries
export function useGetLevels() {
  const { actor, isFetching } = useActor();

  return useQuery<Level[]>({
    queryKey: ['levels'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLevels();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddLevel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (level: Level) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addLevel(level);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levels'] });
    },
  });
}

export function useUpdateLevel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (level: Level) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateLevel(level);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levels'] });
    },
  });
}

export function useDeleteLevel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (levelId: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteLevel(levelId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levels'] });
    },
  });
}

// Learning Path Queries
export function useGetLearningPaths() {
  const { actor, isFetching } = useActor();

  return useQuery<LearningPath[]>({
    queryKey: ['learningPaths'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLearningPaths();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddLearningPath() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (path: LearningPath) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addLearningPath(path);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learningPaths'] });
    },
  });
}

// Progress Queries
export function useGetCallerProgress() {
  const { actor, isFetching } = useActor();

  return useQuery<Progress[] | null>({
    queryKey: ['currentUserProgress'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerProgress();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateCallerProgress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (progress: Progress[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateCallerProgress(progress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProgress'] });
      queryClient.invalidateQueries({ queryKey: ['recommendedLessons'] });
    },
  });
}

// Feedback Queries
export function useGetCallerFeedbackSubmissions() {
  const { actor, isFetching } = useActor();

  return useQuery<FeedbackSubmission[]>({
    queryKey: ['callerFeedbackSubmissions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCallerFeedbackSubmissions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllFeedbackSubmissions() {
  const { actor, isFetching } = useActor();

  return useQuery<FeedbackSubmission[]>({
    queryKey: ['allFeedbackSubmissions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFeedbackSubmissions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitFeedback() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submission: FeedbackSubmission) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitFeedback(submission);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerFeedbackSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['allFeedbackSubmissions'] });
    },
  });
}

export function useGetFeedbackResponsesForSubmission() {
  const { actor, isFetching } = useActor();

  return useMutation({
    mutationFn: async (submissionId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getFeedbackResponsesForSubmission(submissionId);
    },
  });
}

export function useAddFeedbackResponse() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (response: FeedbackResponse) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addFeedbackResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allFeedbackSubmissions'] });
    },
  });
}

// Stripe Queries
export function useIsStripeConfigured() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isStripeConfigured'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetStripeConfiguration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: StripeConfiguration) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setStripeConfiguration(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isStripeConfigured'] });
    },
  });
}

export function useCreateCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: { items: ShoppingItem[]; successUrl: string; cancelUrl: string }) => {
      if (!actor) throw new Error('Actor not available');
      
      try {
        const result = await actor.createCheckoutSession(params.items, params.successUrl, params.cancelUrl);
        
        if (!result || typeof result !== 'string') {
          throw new Error('Invalid response from backend');
        }
        
        const session = JSON.parse(result) as { id: string; url: string };
        
        if (!session.id || !session.url) {
          throw new Error('Invalid checkout session data');
        }
        
        return session;
      } catch (error: any) {
        console.error('Checkout session error:', error);
        throw new Error(error.message || 'Failed to create checkout session');
      }
    },
  });
}

// Homepage Content Queries
export function useGetHomepageContent() {
  const { actor, isFetching } = useActor();

  return useQuery<HomepageContent | null>({
    queryKey: ['homepageContent'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getHomepageContent();
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

export function useUpdateHomepageContent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: HomepageContent) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateHomepageContent(content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepageContent'] });
      queryClient.refetchQueries({ queryKey: ['homepageContent'] });
    },
    onError: (error) => {
      console.error('Failed to update homepage content:', error);
      throw error;
    },
  });
}

// Tier Features Queries
export function useUpdateTierFeatures() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tierFeatures: TierFeatureList[]) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateTierFeatures(tierFeatures);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepageContent'] });
      queryClient.refetchQueries({ queryKey: ['homepageContent'] });
    },
    onError: (error) => {
      console.error('Failed to update tier features:', error);
      throw error;
    },
  });
}

// Data Export/Import Queries
export function useExportData() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (): Promise<ExportData> => {
      if (!actor) throw new Error('Actor not available');
      return actor.exportData();
    },
  });
}

export function useImportData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ExportData) => {
      if (!actor) throw new Error('Actor not available');
      return actor.importData(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
