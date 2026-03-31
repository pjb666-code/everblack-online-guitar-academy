import AccessControl "authorization/access-control";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Principal "mo:base/Principal";
import OrderedMap "mo:base/OrderedMap";
import Iter "mo:base/Iter";
import Debug "mo:base/Debug";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Array "mo:base/Array";
import Blob "mo:base/Blob";

persistent actor EverblackMusic {
  // Access control
  let accessControlState = AccessControl.initState();

  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  // User profile
  public type UserProfile = {
    name : Text;
    email : Text;
    membership : MembershipTier;
    createdAt : Time.Time;
    theme : ThemePreference;
    language : LanguagePreference;
    isSuspended : Bool;
  };

  public type MembershipTier = {
    #visitor;
    #free;
    #starter;
    #pro;
    #coaching;
  };

  public type ThemePreference = {
    #light;
    #dark;
  };

  public type LanguagePreference = {
    #english;
    #german;
  };

  transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);
  var userProfiles = principalMap.empty<UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    principalMap.get(userProfiles, caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view your own profile");
    };
    principalMap.get(userProfiles, user);
  };

  public query ({ caller }) func getAllUserProfiles() : async [(Principal, UserProfile)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view all user profiles");
    };
    Iter.toArray(principalMap.entries(userProfiles));
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles := principalMap.put(userProfiles, caller, profile);
  };

  public shared ({ caller }) func setCallerThemePreference(theme : ThemePreference) : async () {
    switch (principalMap.get(userProfiles, caller)) {
      case null {
        Debug.trap("User profile not found");
      };
      case (?profile) {
        let updatedProfile = { profile with theme };
        userProfiles := principalMap.put(userProfiles, caller, updatedProfile);
      };
    };
  };

  public query ({ caller }) func getCallerThemePreference() : async ThemePreference {
    switch (principalMap.get(userProfiles, caller)) {
      case null {
        #light;
      };
      case (?profile) {
        profile.theme;
      };
    };
  };

  public shared ({ caller }) func setCallerLanguagePreference(language : LanguagePreference) : async () {
    switch (principalMap.get(userProfiles, caller)) {
      case null {
        Debug.trap("User profile not found");
      };
      case (?profile) {
        let updatedProfile = { profile with language };
        userProfiles := principalMap.put(userProfiles, caller, updatedProfile);
      };
    };
  };

  public query ({ caller }) func getCallerLanguagePreference() : async LanguagePreference {
    switch (principalMap.get(userProfiles, caller)) {
      case null {
        #english;
      };
      case (?profile) {
        profile.language;
      };
    };
  };

  public shared ({ caller }) func suspendUser(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can suspend users");
    };
    switch (principalMap.get(userProfiles, user)) {
      case null {
        Debug.trap("User profile not found");
      };
      case (?profile) {
        let updatedProfile = { profile with isSuspended = true };
        userProfiles := principalMap.put(userProfiles, user, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func reactivateUser(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can reactivate users");
    };
    switch (principalMap.get(userProfiles, user)) {
      case null {
        Debug.trap("User profile not found");
      };
      case (?profile) {
        let updatedProfile = { profile with isSuspended = false };
        userProfiles := principalMap.put(userProfiles, user, updatedProfile);
      };
    };
  };

  // Helper function to check membership tier access
  func hasAccessToLesson(caller : Principal, lesson : Lesson) : Bool {
    // Admin always has access
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };

    // Check user's membership tier
    switch (principalMap.get(userProfiles, caller)) {
      case null {
        // No profile means visitor/guest - only access to visitor content
        switch (lesson.requiredMembership) {
          case (#visitor) { true };
          case _ { false };
        };
      };
      case (?profile) {
        // Check if user is suspended
        if (profile.isSuspended) {
          return false;
        };

        // Check membership tier hierarchy
        let userTier = profile.membership;
        let requiredTier = lesson.requiredMembership;

        switch (userTier, requiredTier) {
          case (#coaching, _) { true }; // Coaching has access to everything
          case (#pro, #visitor) { true };
          case (#pro, #free) { true };
          case (#pro, #starter) { true };
          case (#pro, #pro) { true };
          case (#starter, #visitor) { true };
          case (#starter, #free) { true };
          case (#starter, #starter) { true };
          case (#free, #visitor) { true };
          case (#free, #free) { true };
          case (#visitor, #visitor) { true };
          case _ { false };
        };
      };
    };
  };

  // Lesson management
  public type Lesson = {
    id : Text;
    title : Text;
    description : Text;
    videoUrl : Text;
    gpFile : ?Storage.ExternalBlob;
    pdfFile : ?Storage.ExternalBlob;
    requiredMembership : MembershipTier;
    createdAt : Time.Time;
    categoryId : Text;
    levelId : Text;
    thumbnail : ?Storage.ExternalBlob;
    tags : [Text];
    recommendedNextLessonId : ?Text;
  };

  transient let textMap = OrderedMap.Make<Text>(Text.compare);
  var lessons = textMap.empty<Lesson>();

  public query ({ caller }) func getLessons() : async [Lesson] {
    let allLessons = Iter.toArray(textMap.vals(lessons));
    // Filter lessons based on user's membership tier
    Array.filter<Lesson>(allLessons, func(lesson) { hasAccessToLesson(caller, lesson) });
  };

  public shared ({ caller }) func addLesson(lesson : Lesson) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can add lessons");
    };
    lessons := textMap.put(lessons, lesson.id, lesson);
  };

  public shared ({ caller }) func updateLesson(lesson : Lesson) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update lessons");
    };
    lessons := textMap.put(lessons, lesson.id, lesson);
  };

  public shared ({ caller }) func deleteLesson(lessonId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete lessons");
    };
    lessons := textMap.delete(lessons, lessonId);
  };

  public query ({ caller }) func getLessonById(lessonId : Text) : async ?Lesson {
    switch (textMap.get(lessons, lessonId)) {
      case null { null };
      case (?lesson) {
        if (hasAccessToLesson(caller, lesson)) {
          ?lesson;
        } else {
          Debug.trap("Unauthorized: Insufficient membership tier to access this lesson");
        };
      };
    };
  };

  public query ({ caller }) func getLessonsByCategory(categoryId : Text) : async [Lesson] {
    let allLessons = Iter.toArray(textMap.vals(lessons));
    let categoryLessons = Array.filter<Lesson>(allLessons, func(lesson) { lesson.categoryId == categoryId });
    // Filter by membership tier
    Array.filter<Lesson>(categoryLessons, func(lesson) { hasAccessToLesson(caller, lesson) });
  };

  public query ({ caller }) func getLessonsByLevel(levelId : Text) : async [Lesson] {
    let allLessons = Iter.toArray(textMap.vals(lessons));
    let levelLessons = Array.filter<Lesson>(allLessons, func(lesson) { lesson.levelId == levelId });
    // Filter by membership tier
    Array.filter<Lesson>(levelLessons, func(lesson) { hasAccessToLesson(caller, lesson) });
  };

  public query ({ caller }) func getLessonsByTag(tag : Text) : async [Lesson] {
    let allLessons = Iter.toArray(textMap.vals(lessons));
    let taggedLessons = Array.filter<Lesson>(
      allLessons,
      func(lesson) {
        Array.find<Text>(lesson.tags, func(t) { t == tag }) != null;
      },
    );
    // Filter by membership tier
    Array.filter<Lesson>(taggedLessons, func(lesson) { hasAccessToLesson(caller, lesson) });
  };

  public query ({ caller }) func getRecommendedLessons(lessonId : Text, user : Principal) : async [Lesson] {
    // Only allow users to get their own recommendations or admins to get any user's recommendations
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only get your own recommendations");
    };

    switch (textMap.get(lessons, lessonId)) {
      case null {
        [];
      };
      case (?currentLesson) {
        let userProgressData = principalMap.get(userProgress, user);
        let completedLessons = switch (userProgressData) {
          case null { [] };
          case (?progress) {
            Array.mapFilter<Progress, Text>(
              progress,
              func(p) {
                if (p.completed) { ?p.lessonId } else { null };
              },
            );
          };
        };

        let allLessons = Iter.toArray(textMap.vals(lessons));
        let filteredLessons = Array.filter<Lesson>(
          allLessons,
          func(lesson) {
            let isNotCompleted = Array.find<Text>(completedLessons, func(id) { id == lesson.id }) == null;
            let hasSharedTags = Array.find<Text>(
              lesson.tags,
              func(tag) {
                Array.find<Text>(currentLesson.tags, func(t) { t == tag }) != null;
              },
            ) != null;
            let isSameOrNextLevel = lesson.levelId == currentLesson.levelId;
            let hasAccess = hasAccessToLesson(caller, lesson);
            isNotCompleted and hasSharedTags and isSameOrNextLevel and hasAccess;
          },
        );

        let recommendedLessons = Array.take<Lesson>(filteredLessons, 3);

        switch (currentLesson.recommendedNextLessonId) {
          case null {
            recommendedLessons;
          };
          case (?nextLessonId) {
            switch (textMap.get(lessons, nextLessonId)) {
              case null {
                recommendedLessons;
              };
              case (?nextLesson) {
                if (hasAccessToLesson(caller, nextLesson)) {
                  Array.append<Lesson>([nextLesson], recommendedLessons);
                } else {
                  recommendedLessons;
                };
              };
            };
          };
        };
      };
    };
  };

  // Learning paths
  public type LearningPath = {
    id : Text;
    title : Text;
    description : Text;
    lessonIds : [Text];
    createdAt : Time.Time;
  };

  var learningPaths = textMap.empty<LearningPath>();

  public query func getLearningPaths() : async [LearningPath] {
    Iter.toArray(textMap.vals(learningPaths));
  };

  public shared ({ caller }) func addLearningPath(path : LearningPath) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can add learning paths");
    };
    learningPaths := textMap.put(learningPaths, path.id, path);
  };

  public shared ({ caller }) func updateLearningPath(path : LearningPath) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update learning paths");
    };
    learningPaths := textMap.put(learningPaths, path.id, path);
  };

  public shared ({ caller }) func deleteLearningPath(pathId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete learning paths");
    };
    learningPaths := textMap.delete(learningPaths, pathId);
  };

  // Progress tracking
  public type Progress = {
    lessonId : Text;
    completed : Bool;
    lastAccessed : Time.Time;
  };

  public type UserProgress = {
    user : Principal;
    progress : [Progress];
  };

  var userProgress = principalMap.empty<[Progress]>();

  public query ({ caller }) func getCallerProgress() : async ?[Progress] {
    principalMap.get(userProgress, caller);
  };

  public shared ({ caller }) func updateCallerProgress(progress : [Progress]) : async () {
    userProgress := principalMap.put(userProgress, caller, progress);
  };

  public query ({ caller }) func getLessonCompletionStatus(user : Principal, lessonId : Text) : async Bool {
    // Only allow users to check their own completion status or admins to check any user's status
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only check your own completion status");
    };

    switch (principalMap.get(userProgress, user)) {
      case null {
        false;
      };
      case (?progress) {
        switch (Array.find<Progress>(progress, func(p) { p.lessonId == lessonId })) {
          case null {
            false;
          };
          case (?lessonProgress) {
            lessonProgress.completed;
          };
        };
      };
    };
  };

  // Stripe integration
  var stripeConfig : ?Stripe.StripeConfiguration = null;

  public query func isStripeConfigured() : async Bool {
    stripeConfig != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can perform this action");
    };
    stripeConfig := ?config;
  };

  public query func getStripeConfiguration() : async ?Stripe.StripeConfiguration {
    stripeConfig;
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    switch (stripeConfig) {
      case null {
        #failed { error = "Stripe is not configured" };
      };
      case (?config) {
        await Stripe.getSessionStatus(config, sessionId, transform);
      };
    };
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    switch (stripeConfig) {
      case null {
        Debug.trap("Stripe is not configured");
      };
      case (?config) {
        await Stripe.createCheckoutSession(config, caller, items, successUrl, cancelUrl, transform);
      };
    };
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // File storage
  let storage = Storage.new();
  include MixinStorage(storage);

  public type FileReference = {
    id : Text;
    blob : Storage.ExternalBlob;
    name : Text;
    uploadedAt : Time.Time;
  };

  var files = textMap.empty<FileReference>();

  public shared ({ caller }) func addFileReference(file : FileReference) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can add files");
    };
    files := textMap.put(files, file.id, file);
  };

  public query func getFileReferences() : async [FileReference] {
    Iter.toArray(textMap.vals(files));
  };

  // Helper function to get lesson by file ID
  func getLessonByFileId(fileId : Text) : ?Lesson {
    let allLessons = Iter.toArray(textMap.vals(lessons));
    Array.find<Lesson>(
      allLessons,
      func(lesson) {
        switch (lesson.pdfFile) {
          case null { false };
          case (?pdfBlob) {
            // Compare file reference - assuming fileId matches the blob data or we need to check files map
            switch (textMap.get(files, fileId)) {
              case null { false };
              case (?fileRef) {
                fileRef.blob == pdfBlob;
              };
            };
          };
        };
      },
    );
  };

  // Feedback system
  public type FeedbackSubmission = {
    id : Text;
    user : Principal;
    lessonId : Text;
    videoFile : ?Storage.ExternalBlob;
    youtubeLink : ?Text;
    comment : Text;
    submittedAt : Time.Time;
    status : FeedbackStatus;
  };

  public type FeedbackStatus = {
    #pending;
    #reviewed;
    #responded;
  };

  public type FeedbackResponse = {
    id : Text;
    submissionId : Text;
    admin : Principal;
    textResponse : ?Text;
    videoResponse : ?Storage.ExternalBlob;
    createdAt : Time.Time;
  };

  var feedbackSubmissions = textMap.empty<FeedbackSubmission>();
  var feedbackResponses = textMap.empty<FeedbackResponse>();

  public shared ({ caller }) func submitFeedback(submission : FeedbackSubmission) : async () {
    feedbackSubmissions := textMap.put(feedbackSubmissions, submission.id, submission);
  };

  public query ({ caller }) func getFeedbackSubmissions() : async [FeedbackSubmission] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view all feedback submissions");
    };
    Iter.toArray(textMap.vals(feedbackSubmissions));
  };

  public query ({ caller }) func getCallerFeedbackSubmissions() : async [FeedbackSubmission] {
    let userSubmissions = Iter.toArray(textMap.vals(feedbackSubmissions));
    Array.filter<FeedbackSubmission>(userSubmissions, func(submission) { submission.user == caller });
  };

  public shared ({ caller }) func addFeedbackResponse(response : FeedbackResponse) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can add feedback responses");
    };
    feedbackResponses := textMap.put(feedbackResponses, response.id, response);

    // Update submission status to responded
    switch (textMap.get(feedbackSubmissions, response.submissionId)) {
      case null {};
      case (?submission) {
        let updatedSubmission = { submission with status = #responded };
        feedbackSubmissions := textMap.put(feedbackSubmissions, response.submissionId, updatedSubmission);
      };
    };
  };

  public query ({ caller }) func getFeedbackResponses() : async [FeedbackResponse] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view all feedback responses");
    };
    Iter.toArray(textMap.vals(feedbackResponses));
  };

  public query ({ caller }) func getFeedbackResponsesForSubmission(submissionId : Text) : async [FeedbackResponse] {
    // Check if caller owns the submission or is admin
    switch (textMap.get(feedbackSubmissions, submissionId)) {
      case null {
        Debug.trap("Feedback submission not found");
      };
      case (?submission) {
        if (caller != submission.user and not AccessControl.isAdmin(accessControlState, caller)) {
          Debug.trap("Unauthorized: Can only view responses for your own submissions");
        };
        let allResponses = Iter.toArray(textMap.vals(feedbackResponses));
        Array.filter<FeedbackResponse>(allResponses, func(response) { response.submissionId == submissionId });
      };
    };
  };

  // Category and Level Management
  public type Category = {
    id : Text;
    nameEn : Text;
    nameDe : Text;
    createdAt : Time.Time;
  };

  public type Level = {
    id : Text;
    nameEn : Text;
    nameDe : Text;
    createdAt : Time.Time;
  };

  var categories = textMap.empty<Category>();
  var levels = textMap.empty<Level>();

  public query func getCategories() : async [Category] {
    Iter.toArray(textMap.vals(categories));
  };

  public query func getLevels() : async [Level] {
    Iter.toArray(textMap.vals(levels));
  };

  public shared ({ caller }) func addCategory(category : Category) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can add categories");
    };
    categories := textMap.put(categories, category.id, category);
  };

  public shared ({ caller }) func updateCategory(category : Category) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update categories");
    };
    categories := textMap.put(categories, category.id, category);
  };

  public shared ({ caller }) func deleteCategory(categoryId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete categories");
    };
    categories := textMap.delete(categories, categoryId);
  };

  public shared ({ caller }) func addLevel(level : Level) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can add levels");
    };
    levels := textMap.put(levels, level.id, level);
  };

  public shared ({ caller }) func updateLevel(level : Level) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update levels");
    };
    levels := textMap.put(levels, level.id, level);
  };

  public shared ({ caller }) func deleteLevel(levelId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete levels");
    };
    levels := textMap.delete(levels, levelId);
  };

  // Homepage Content Management
  public type HomepageContent = {
    headerLogo : ?Storage.ExternalBlob;
    heroImage : ?Storage.ExternalBlob;
    heroTextEn : Text;
    heroTextDe : Text;
    whyChooseSection : WhyChooseSection;
    chooseYourPathSection : ChooseYourPathSection;
    lastUpdated : Time.Time;
  };

  public type WhyChooseSection = {
    titleEn : Text;
    titleDe : Text;
    descriptionEn : Text;
    descriptionDe : Text;
    featureCards : [FeatureCard];
  };

  public type FeatureCard = {
    id : Text;
    icon : ?Storage.ExternalBlob;
    titleEn : Text;
    titleDe : Text;
    descriptionEn : Text;
    descriptionDe : Text;
  };

  public type ChooseYourPathSection = {
    titleEn : Text;
    titleDe : Text;
    descriptionEn : Text;
    descriptionDe : Text;
    pricingOptions : [PricingOption];
    tierFeatures : [TierFeatureList];
  };

  public type PricingOption = {
    id : Text;
    nameEn : Text;
    nameDe : Text;
    descriptionEn : Text;
    descriptionDe : Text;
    priceEur : Nat;
    membershipTier : MembershipTier;
  };

  public type TierFeatureList = {
    tier : MembershipTier;
    features : [TierFeature];
  };

  public type TierFeature = {
    id : Text;
    featureEn : Text;
    featureDe : Text;
    position : Nat;
  };

  var homepageContent : ?HomepageContent = null;

  public query func getHomepageContent() : async ?HomepageContent {
    homepageContent;
  };

  public shared ({ caller }) func updateHomepageContent(content : HomepageContent) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update homepage content");
    };

    let updatedContent = {
      content with
      lastUpdated = Time.now();
    };

    homepageContent := ?updatedContent;
  };

  public shared ({ caller }) func updateTierFeatures(tierFeatures : [TierFeatureList]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update tier features");
    };

    switch (homepageContent) {
      case null {
        Debug.trap("Homepage content not found");
      };
      case (?content) {
        let updatedChooseYourPathSection = {
          content.chooseYourPathSection with
          tierFeatures
        };

        let updatedContent = {
          content with
          chooseYourPathSection = updatedChooseYourPathSection;
          lastUpdated = Time.now();
        };

        homepageContent := ?updatedContent;
      };
    };
  };

  // Data Export/Import
  public type ExportData = {
    userProfiles : [(Principal, UserProfile)];
    lessons : [Lesson];
    learningPaths : [LearningPath];
    userProgress : [(Principal, [Progress])];
    files : [FileReference];
    feedbackSubmissions : [FeedbackSubmission];
    feedbackResponses : [FeedbackResponse];
    categories : [Category];
    levels : [Level];
    homepageContent : ?HomepageContent;
  };

  public shared ({ caller }) func exportData() : async ExportData {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can export data");
    };

    {
      userProfiles = Iter.toArray(principalMap.entries(userProfiles));
      lessons = Iter.toArray(textMap.vals(lessons));
      learningPaths = Iter.toArray(textMap.vals(learningPaths));
      userProgress = Iter.toArray(principalMap.entries(userProgress));
      files = Iter.toArray(textMap.vals(files));
      feedbackSubmissions = Iter.toArray(textMap.vals(feedbackSubmissions));
      feedbackResponses = Iter.toArray(textMap.vals(feedbackResponses));
      categories = Iter.toArray(textMap.vals(categories));
      levels = Iter.toArray(textMap.vals(levels));
      homepageContent;
    };
  };

  public shared ({ caller }) func importData(data : ExportData) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can import data");
    };

    // Import user profiles
    userProfiles := principalMap.empty<UserProfile>();
    for ((principal, profile) in data.userProfiles.vals()) {
      userProfiles := principalMap.put(userProfiles, principal, profile);
    };

    // Import lessons
    lessons := textMap.empty<Lesson>();
    for (lesson in data.lessons.vals()) {
      lessons := textMap.put(lessons, lesson.id, lesson);
    };

    // Import learning paths
    learningPaths := textMap.empty<LearningPath>();
    for (path in data.learningPaths.vals()) {
      learningPaths := textMap.put(learningPaths, path.id, path);
    };

    // Import user progress
    userProgress := principalMap.empty<[Progress]>();
    for ((principal, progress) in data.userProgress.vals()) {
      userProgress := principalMap.put(userProgress, principal, progress);
    };

    // Import files
    files := textMap.empty<FileReference>();
    for (file in data.files.vals()) {
      files := textMap.put(files, file.id, file);
    };

    // Import feedback submissions
    feedbackSubmissions := textMap.empty<FeedbackSubmission>();
    for (submission in data.feedbackSubmissions.vals()) {
      feedbackSubmissions := textMap.put(feedbackSubmissions, submission.id, submission);
    };

    // Import feedback responses
    feedbackResponses := textMap.empty<FeedbackResponse>();
    for (response in data.feedbackResponses.vals()) {
      feedbackResponses := textMap.put(feedbackResponses, response.id, response);
    };

    // Import categories
    categories := textMap.empty<Category>();
    for (category in data.categories.vals()) {
      categories := textMap.put(categories, category.id, category);
    };

    // Import levels
    levels := textMap.empty<Level>();
    for (level in data.levels.vals()) {
      levels := textMap.put(levels, level.id, level);
    };

    // Import homepage content
    homepageContent := data.homepageContent;
  };

  // Serve PDF files with correct headers
  public type HttpResponse = {
    status_code : Nat16;
    headers : [{ name : Text; value : Text }];
    body : Blob;
    streaming_strategy : ?{ #Callback : { token : Blob } };
  };

  public query ({ caller }) func servePdfFile(fileId : Text) : async HttpResponse {
    // Check authorization - find the lesson that contains this PDF
    let lessonOpt = getLessonByFileId(fileId);
    
    switch (lessonOpt) {
      case null {
        // File not associated with any lesson or file not found
        switch (textMap.get(files, fileId)) {
          case null {
            {
              status_code = 404;
              headers = [
                { name = "Content-Type"; value = "text/plain" },
                { name = "Access-Control-Allow-Origin"; value = "*" },
              ];
              body = Text.encodeUtf8("File not found");
              streaming_strategy = null;
            };
          };
          case (?fileRef) {
            // File exists but not associated with a lesson - admin only
            if (not AccessControl.isAdmin(accessControlState, caller)) {
              {
                status_code = 403;
                headers = [
                  { name = "Content-Type"; value = "text/plain" },
                  { name = "Access-Control-Allow-Origin"; value = "*" },
                ];
                body = Text.encodeUtf8("Unauthorized: Insufficient permissions");
                streaming_strategy = null;
              };
            } else {
              {
                status_code = 200;
                headers = [
                  { name = "Content-Type"; value = "application/pdf" },
                  { name = "Access-Control-Allow-Origin"; value = "*" },
                  { name = "Content-Disposition"; value = "inline; filename=\"" # fileRef.name # "\"" },
                ];
                body = fileRef.blob;
                streaming_strategy = null;
              };
            };
          };
        };
      };
      case (?lesson) {
        // Check if user has access to this lesson
        if (not hasAccessToLesson(caller, lesson)) {
          {
            status_code = 403;
            headers = [
              { name = "Content-Type"; value = "text/plain" },
              { name = "Access-Control-Allow-Origin"; value = "*" },
            ];
            body = Text.encodeUtf8("Unauthorized: Insufficient membership tier");
            streaming_strategy = null;
          };
        } else {
          switch (textMap.get(files, fileId)) {
            case null {
              {
                status_code = 404;
                headers = [
                  { name = "Content-Type"; value = "text/plain" },
                  { name = "Access-Control-Allow-Origin"; value = "*" },
                ];
                body = Text.encodeUtf8("File not found");
                streaming_strategy = null;
              };
            };
            case (?fileRef) {
              {
                status_code = 200;
                headers = [
                  { name = "Content-Type"; value = "application/pdf" },
                  { name = "Access-Control-Allow-Origin"; value = "*" },
                  { name = "Content-Disposition"; value = "inline; filename=\"" # fileRef.name # "\"" },
                ];
                body = fileRef.blob;
                streaming_strategy = null;
              };
            };
          };
        };
      };
    };
  };

  // Serve PDF files for download with correct headers
  public query ({ caller }) func downloadPdfFile(fileId : Text) : async HttpResponse {
    // Check authorization - find the lesson that contains this PDF
    let lessonOpt = getLessonByFileId(fileId);
    
    switch (lessonOpt) {
      case null {
        // File not associated with any lesson or file not found
        switch (textMap.get(files, fileId)) {
          case null {
            {
              status_code = 404;
              headers = [
                { name = "Content-Type"; value = "text/plain" },
                { name = "Access-Control-Allow-Origin"; value = "*" },
              ];
              body = Text.encodeUtf8("File not found");
              streaming_strategy = null;
            };
          };
          case (?fileRef) {
            // File exists but not associated with a lesson - admin only
            if (not AccessControl.isAdmin(accessControlState, caller)) {
              {
                status_code = 403;
                headers = [
                  { name = "Content-Type"; value = "text/plain" },
                  { name = "Access-Control-Allow-Origin"; value = "*" },
                ];
                body = Text.encodeUtf8("Unauthorized: Insufficient permissions");
                streaming_strategy = null;
              };
            } else {
              {
                status_code = 200;
                headers = [
                  { name = "Content-Type"; value = "application/pdf" },
                  { name = "Access-Control-Allow-Origin"; value = "*" },
                  { name = "Content-Disposition"; value = "attachment; filename=\"" # fileRef.name # "\"" },
                ];
                body = fileRef.blob;
                streaming_strategy = null;
              };
            };
          };
        };
      };
      case (?lesson) {
        // Check if user has access to this lesson
        if (not hasAccessToLesson(caller, lesson)) {
          {
            status_code = 403;
            headers = [
              { name = "Content-Type"; value = "text/plain" },
              { name = "Access-Control-Allow-Origin"; value = "*" },
            ];
            body = Text.encodeUtf8("Unauthorized: Insufficient membership tier");
            streaming_strategy = null;
          };
        } else {
          switch (textMap.get(files, fileId)) {
            case null {
              {
                status_code = 404;
                headers = [
                  { name = "Content-Type"; value = "text/plain" },
                  { name = "Access-Control-Allow-Origin"; value = "*" },
                ];
                body = Text.encodeUtf8("File not found");
                streaming_strategy = null;
              };
            };
            case (?fileRef) {
              {
                status_code = 200;
                headers = [
                  { name = "Content-Type"; value = "application/pdf" },
                  { name = "Access-Control-Allow-Origin"; value = "*" },
                  { name = "Content-Disposition"; value = "attachment; filename=\"" # fileRef.name # "\"" },
                ];
                body = fileRef.blob;
                streaming_strategy = null;
              };
            };
          };
        };
      };
    };
  };
};
