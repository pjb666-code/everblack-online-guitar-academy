import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface ExportData {
    files: Array<FileReference>;
    categories: Array<Category>;
    userProgress: Array<[Principal, Array<Progress>]>;
    homepageContent?: HomepageContent;
    feedbackResponses: Array<FeedbackResponse>;
    feedbackSubmissions: Array<FeedbackSubmission>;
    learningPaths: Array<LearningPath>;
    lessons: Array<Lesson>;
    userProfiles: Array<[Principal, UserProfile]>;
    levels: Array<Level>;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface TierFeature {
    id: string;
    featureDe: string;
    featureEn: string;
    position: bigint;
}
export interface WhyChooseSection {
    descriptionDe: string;
    descriptionEn: string;
    featureCards: Array<FeatureCard>;
    titleDe: string;
    titleEn: string;
}
export interface Lesson {
    id: string;
    categoryId: string;
    title: string;
    pdfFile?: ExternalBlob;
    thumbnail?: ExternalBlob;
    levelId: string;
    createdAt: Time;
    tags: Array<string>;
    description: string;
    recommendedNextLessonId?: string;
    requiredMembership: MembershipTier;
    videoUrl: string;
    gpFile?: ExternalBlob;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface PricingOption {
    id: string;
    nameDe: string;
    nameEn: string;
    descriptionDe: string;
    descriptionEn: string;
    priceEur: bigint;
    membershipTier: MembershipTier;
}
export interface HomepageContent {
    lastUpdated: Time;
    heroImage?: ExternalBlob;
    headerLogo?: ExternalBlob;
    whyChooseSection: WhyChooseSection;
    chooseYourPathSection: ChooseYourPathSection;
    heroTextDe: string;
    heroTextEn: string;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface FileReference {
    id: string;
    blob: ExternalBlob;
    name: string;
    uploadedAt: Time;
}
export interface TierFeatureList {
    features: Array<TierFeature>;
    tier: MembershipTier;
}
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface FeedbackResponse {
    id: string;
    admin: Principal;
    videoResponse?: ExternalBlob;
    createdAt: Time;
    submissionId: string;
    textResponse?: string;
}
export interface ChooseYourPathSection {
    descriptionDe: string;
    descriptionEn: string;
    pricingOptions: Array<PricingOption>;
    tierFeatures: Array<TierFeatureList>;
    titleDe: string;
    titleEn: string;
}
export interface Category {
    id: string;
    nameDe: string;
    nameEn: string;
    createdAt: Time;
}
export interface LearningPath {
    id: string;
    title: string;
    createdAt: Time;
    description: string;
    lessonIds: Array<string>;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface FeedbackSubmission {
    id: string;
    lessonId: string;
    status: FeedbackStatus;
    youtubeLink?: string;
    user: Principal;
    submittedAt: Time;
    videoFile?: ExternalBlob;
    comment: string;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface HttpResponse {
    body: Uint8Array;
    headers: Array<{
        value: string;
        name: string;
    }>;
    streaming_strategy?: {
        __kind__: "Callback";
        Callback: {
            token: Uint8Array;
        };
    };
    status_code: number;
}
export interface Progress {
    lessonId: string;
    lastAccessed: Time;
    completed: boolean;
}
export interface FeatureCard {
    id: string;
    descriptionDe: string;
    descriptionEn: string;
    icon?: ExternalBlob;
    titleDe: string;
    titleEn: string;
}
export interface Level {
    id: string;
    nameDe: string;
    nameEn: string;
    createdAt: Time;
}
export interface UserProfile {
    theme: ThemePreference;
    name: string;
    createdAt: Time;
    email: string;
    language: LanguagePreference;
    isSuspended: boolean;
    membership: MembershipTier;
}
export enum FeedbackStatus {
    responded = "responded",
    pending = "pending",
    reviewed = "reviewed"
}
export enum LanguagePreference {
    german = "german",
    english = "english"
}
export enum MembershipTier {
    pro = "pro",
    coaching = "coaching",
    starter = "starter",
    free = "free",
    visitor = "visitor"
}
export enum ThemePreference {
    dark = "dark",
    light = "light"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCategory(category: Category): Promise<void>;
    addFeedbackResponse(response: FeedbackResponse): Promise<void>;
    addFileReference(file: FileReference): Promise<void>;
    addLearningPath(path: LearningPath): Promise<void>;
    addLesson(lesson: Lesson): Promise<void>;
    addLevel(level: Level): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    deleteCategory(categoryId: string): Promise<void>;
    deleteLearningPath(pathId: string): Promise<void>;
    deleteLesson(lessonId: string): Promise<void>;
    deleteLevel(levelId: string): Promise<void>;
    downloadPdfFile(fileId: string): Promise<HttpResponse>;
    exportData(): Promise<ExportData>;
    getAllUserProfiles(): Promise<Array<[Principal, UserProfile]>>;
    getCallerFeedbackSubmissions(): Promise<Array<FeedbackSubmission>>;
    getCallerLanguagePreference(): Promise<LanguagePreference>;
    getCallerProgress(): Promise<Array<Progress> | null>;
    getCallerThemePreference(): Promise<ThemePreference>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCategories(): Promise<Array<Category>>;
    getFeedbackResponses(): Promise<Array<FeedbackResponse>>;
    getFeedbackResponsesForSubmission(submissionId: string): Promise<Array<FeedbackResponse>>;
    getFeedbackSubmissions(): Promise<Array<FeedbackSubmission>>;
    getFileReferences(): Promise<Array<FileReference>>;
    getHomepageContent(): Promise<HomepageContent | null>;
    getLearningPaths(): Promise<Array<LearningPath>>;
    getLessonById(lessonId: string): Promise<Lesson | null>;
    getLessonCompletionStatus(user: Principal, lessonId: string): Promise<boolean>;
    getLessons(): Promise<Array<Lesson>>;
    getLessonsByCategory(categoryId: string): Promise<Array<Lesson>>;
    getLessonsByLevel(levelId: string): Promise<Array<Lesson>>;
    getLessonsByTag(tag: string): Promise<Array<Lesson>>;
    getLevels(): Promise<Array<Level>>;
    getRecommendedLessons(lessonId: string, user: Principal): Promise<Array<Lesson>>;
    getStripeConfiguration(): Promise<StripeConfiguration | null>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    importData(data: ExportData): Promise<void>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    reactivateUser(user: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    servePdfFile(fileId: string): Promise<HttpResponse>;
    setCallerLanguagePreference(language: LanguagePreference): Promise<void>;
    setCallerThemePreference(theme: ThemePreference): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    submitFeedback(submission: FeedbackSubmission): Promise<void>;
    suspendUser(user: Principal): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateCallerProgress(progress: Array<Progress>): Promise<void>;
    updateCategory(category: Category): Promise<void>;
    updateHomepageContent(content: HomepageContent): Promise<void>;
    updateLearningPath(path: LearningPath): Promise<void>;
    updateLesson(lesson: Lesson): Promise<void>;
    updateLevel(level: Level): Promise<void>;
    updateTierFeatures(tierFeatures: Array<TierFeatureList>): Promise<void>;
}
