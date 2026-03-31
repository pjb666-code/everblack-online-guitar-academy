# Everblack Music   AI Ready Online Guitar Academy

## Overview
An online guitar academy platform with user authentication, membership tiers, lesson management, progress tracking capabilities, student feedback system, comprehensive homepage content management, and persistent content storage system.

## Authentication & User Roles
- Internet Identity integration for user registration and login
- User roles: Visitor, Free, Student, Admin
- Role-based access control throughout the application
- First authenticated user is automatically assigned admin role through access control initialization
- Reliable admin panel access for users with admin role

## Membership System
- Stripe integration for payment processing with reliable checkout process
- Membership tiers: Free, Starter, Pro, and Coaching Add-on
- Access gating based on user role and membership level
- "Get Started" buttons on HomePage must reliably initiate Stripe payment process for selected membership tier (not navigation to lessons page)
- Payment flows must work consistently for all membership tiers
- All prices displayed in Euro (€) currency format

## Homepage Content Management
- Fully editable header logo with image upload functionality
- Header logo displays correctly with proper sizing, aspect ratio preservation, and optimal placement in the header
- Logo adapts responsively to uploaded image dimensions while maintaining visual consistency
- Fully editable hero section including:
  - Hero background image upload with live preview
  - Hero text content (title and description) with bilingual support
- Fully editable "Why Choose Everblack Music?" section including:
  - Section title and description with bilingual support
  - Individual feature cards with editable titles, descriptions, and icons
  - Add, edit, and delete functionality for feature cards
- Fully editable "Choose your path" membership section including:
  - Section title and description with bilingual support
  - Individual membership tier cards with editable names, prices, features, and descriptions
  - Price editing with automatic Euro (€) currency formatting and validation
  - All membership content editable with bilingual support
  - Complete feature list management for each membership tier (Free, Starter, Pro, Coaching) with add, remove, and reorder functionality
  - Feature list editing with bilingual support for each individual feature
  - Dynamic feature management allowing unlimited features per tier
  - Feature reordering capability to customize the display order within each tier
- Real-time homepage content synchronization ensuring all changes made in admin panel are immediately reflected on the live homepage without manual reload
- Automatic homepage content refresh after admin edits through proper state management and query invalidation
- Robust error handling and user feedback for homepage content updates preventing silent failures
- Clear success and error notifications for all homepage content editing operations
- Full bilingual support (English/German) for all editable homepage content
- Homepage content management accessible through admin panel with user-friendly interface
- All admin panel fields for homepage content must be visible, accessible, and properly validated
- Robust form validation preventing empty or invalid values for all homepage content fields including membership tier features
- Clear error messages and success feedback for all homepage content editing actions
- Intuitive admin interface with clear labels and helpful guidance for content editing

## Navigation & Translation System
- Navigation header displays properly translated menu labels in the selected language
- All navigation elements show correct translations instead of raw translation keys
- Menu items display as "Lessons", "Dashboard", "Feedback", "Admin", "Logout" in English
- Menu items display as "Lektionen", "Dashboard", "Feedback", "Admin", "Abmelden" in German
- Translation system properly integrated throughout the application interface
- No untranslated keys or placeholder text visible in the user interface
- Consistent language display across all navigation and homepage elements

## Persistent Content Storage System
- Version-agnostic content storage module for all lesson content and associated media
- Persistent storage independent of draft/live versioning system ensuring content preservation across app updates and deployments
- Stable content collections that maintain lesson data, videos, PDFs, and thumbnails regardless of app version changes
- Content persistence layer that survives app redeployments and version updates
- Robust content migration system ensuring seamless content availability during app transitions
- Content integrity verification system to ensure all media files remain accessible after updates
- Version-independent content referencing system preventing broken links during app updates

## Lesson Management
- Lesson pages displaying video content with YouTube video embedding
- Downloadable GP (Guitar Pro) and PDF files attached to lessons
- React-PDF based PDF viewer for inline PDF display in lesson detail view
- PDF viewer loads PDF files via fetch API using `fetch(fileUrl).then(res => res.arrayBuffer())` and passes resulting `Uint8Array` to react-pdf's `<Document file={{ data: pdfData }}>` component
- PDF viewer maintains internal loading state with user feedback displaying "PDF wird geladen..." during loading and "PDF konnte nicht geladen werden" on error
- PDF viewer fetches directly from backend endpoints `/pdf/{id}` with proper CORS-safe headers
- React-PDF integration with interactive controls including zoom in/out, next/previous page navigation, and optional fullscreen toggle
- PDF viewer provides full document interaction capabilities including scrolling, zooming, page navigation, and all standard PDF viewing features
- PDF viewer includes comprehensive error handling displaying clear bilingual error messages when PDF cannot be loaded
- Separate "In neuem Tab öffnen" and "Herunterladen" buttons that use correct Content-Disposition backend routes for explicit file access
- PDF viewer completely removes iframe, object, or blob URL implementations that caused forced downloads or SPA fallbacks
- PDF viewer maintains full bilingual support (German/English) and responsive behavior on mobile devices
- Clicking on lessons in the lessons overview navigates to lesson detail view without automatically downloading any files or triggering any file-related actions
- Lesson navigation completely separated from file download functionality with proper event handling
- Explicit download buttons for PDF and GP files that trigger downloads only when explicitly clicked by the user in the lesson detail view
- Download functionality completely isolated from lesson viewing and navigation with proper event handlers
- Reliable file handling with proper error feedback for PDF preview and download operations
- Correct MIME type configuration for all file types (PDF, GP files) ensuring proper browser handling
- Backend file serving with appropriate Content-Type headers for PDF preview and download functionality
- File URL handling that supports both PDF preview and explicit download actions with proper HTTP headers
- Lesson thumbnail image upload functionality (PNG/JPG) in admin panel
- Thumbnail images displayed on lessons overview page with placeholder fallback
- Content access restricted by user role and membership tier
- Learning paths to organize lessons in structured sequences
- File upload functionality for lesson materials and thumbnails in admin interface with persistent storage
- Each lesson must have an assigned category and level
- Category and level assignment during lesson creation and editing
- Tags field for each lesson, editable in admin panel for content organization
- All lesson content and media stored in persistent, version-agnostic storage system
- Lesson content preservation across app updates and redeployments
- Robust media file handling ensuring videos, PDFs, and thumbnails remain accessible after version changes

## Lesson Display & Filtering
- Lessons page with visual grouping by category and level
- Lesson thumbnails displayed in lessons overview with completion status indicators
- Visual completion status indicators (checkmarks or progress indicators) for completed lessons in main lessons list
- Clicking on lesson cards navigates to lesson detail view without triggering any file downloads or automatic file actions
- Proper event handling ensuring lesson navigation does not interfere with file download functionality
- Filter functionality allowing students to filter lessons by category and/or level
- Clear, user-friendly filter labels with full bilingual support:
  - English: "Filter by category" and "Filter by level"
  - German: "Nach Kategorie filtern" and "Nach Level filtern"
- Sort functionality for organizing lessons by different criteria
- Clear visual organization showing lessons grouped under their respective categories and levels
- Filter controls accessible and intuitive for students to navigate lesson content

## Lesson Recommendations
- Next lesson suggestions in lesson detail view showing up to 3 recommended lessons
- Recommendation algorithm prioritizing lessons that share tags, are at same or next level, and not yet completed
- "Recommended next lesson" field takes priority when set for a lesson
- Suggested lessons help students navigate their learning path effectively

## Lesson Structure Management
- Category and level management system for organizing lessons
- Categories (e.g., Technik, Theorie) and levels (Beginner, Intermediate, Advanced, Pro) as separate entities
- Admin interface for creating, editing, and deleting categories and levels
- Full bilingual support for categories and levels (German and English)
- Category and level management integrated into existing admin panel

## Student Features
- Progress tracking dashboard showing completion status and learning metrics
- Practice task system for structured learning activities
- Personal learning journey visualization
- Lesson completion tracking with visual indicators in lessons overview

## Feedback/Video Upload System
- Student feedback page where users can select a lesson from their accessible lessons
- Video upload functionality supporting MP4 and MOV file formats
- YouTube link submission option as alternative to file upload
- Comment field for students to provide context with their submissions
- Feedback submissions linked to specific lessons and user accounts
- Admin feedback response system with text and video reply options
- Feedback history and conversation tracking per lesson and student

## Admin Panel
- Comprehensive admin panel accessible only to users with admin role with reliable access
- Admin panel remains accessible even when Stripe is not configured
- Tabbed interface with sections for:
  - Homepage Content Management: fully editable header logo, hero section, feature cards, and membership pricing with complete bilingual support and robust validation
  - Membership Tier Management: comprehensive feature list editing for each tier (Free, Starter, Pro, Coaching) with add, remove, reorder functionality and bilingual support
  - Lesson Management: view, create, edit, and delete lessons with file upload capabilities, thumbnail upload, tags management, category/level assignment, and persistent storage integration
  - Category & Level Management: create, edit, and delete lesson categories and levels with bilingual support
  - User Management: comprehensive user list with role management, user suspension/reactivation controls
  - Feedback Management: view student video submissions, provide text or video responses
  - Stripe Configuration: payment settings and configuration management
  - Data Management: export and import functionality for backup and migration with robust error handling, compatibility validation, version-independent content handling, and BigInt serialization support
- Admin interface for creating and managing lessons with material uploads, thumbnail images, and persistent storage
- Lesson creation and edit forms include selectable category and level fields, tags input field, thumbnail upload, and persistent content storage integration
- Lesson list displays assigned category, level, and tags for each lesson
- Lesson detail views show assigned category, level, tags, and thumbnail information
- Learning path creation and organization tools
- Content upload and organization features for PDF, GP files, and thumbnail images with persistent storage
- Homepage content management interface with clear, user-friendly forms for all editable content
- All homepage content editing fields must be visible, properly labeled, and validated
- Error handling and success feedback for all homepage content management operations
- Membership tier feature management interface with intuitive controls for adding, removing, and reordering features
- Feature list editor with drag-and-drop reordering capability for each membership tier
- Bilingual feature editing with separate fields for English and German versions of each feature
- Persistent content management interface ensuring all uploaded content is preserved across app updates

## Admin Panel Form Validation
- All select components (category, level, recommended lesson) must have valid, non-empty value props
- Clear placeholder text displayed when no selection is made
- Robust error handling prevents form submission with missing required selections
- User-friendly validation messages displayed for incomplete or invalid form data
- No empty strings saved as values for any select fields
- Form validation ensures data integrity for lessons, categories, levels, and all admin-managed entities
- Select field reliability prevents rendering errors and improves admin user experience
- Homepage content form validation prevents empty or invalid values for all editable fields
- Price validation ensures proper Euro (€) formatting and numeric values
- Bilingual content validation ensures both language versions are properly maintained
- Membership tier feature validation prevents empty or invalid feature entries
- Feature list validation ensures at least one feature exists per tier and all features have valid bilingual content

## Data Export & Import System
- Robust export functionality to create comprehensive backup of all application data including persistent content
- Export includes lessons, categories, levels, user data, files, thumbnails, tags, feedback, homepage content, membership tier features, and all associated content from persistent storage
- BigInt serialization support ensuring all data types including timestamps and IDs can be exported without serialization errors
- Custom serialization handling for BigInt values converting them to string format during export and back to BigInt during import
- Version-independent export format ensuring content can be imported across different app versions
- Reliable import functionality to restore or migrate data from exported backups with comprehensive validation and persistent storage integration
- Data compatibility checks during import to ensure data integrity and prevent corruption across app versions
- Import validation for large datasets with progress tracking and detailed error reporting
- Automatic data format verification and version compatibility checking for persistent content
- Clear error messages and recovery options for failed import operations including BigInt conversion errors
- Import preview functionality allowing admins to review data before final import
- Rollback capability for failed imports to restore previous state
- Comprehensive logging of import/export operations for troubleshooting
- File size and format validation for import files with clear size limits and supported formats
- Media file handling during import/export ensuring all images, videos, and documents are properly transferred to persistent storage
- Data integrity verification after import completion with checksum validation
- Import conflict resolution for duplicate data with user-selectable merge strategies
- Progress indicators and status updates during long-running import/export operations
- Data export/import accessible through admin panel in dedicated Data Management section
- Backup creation and restoration tools for content migration and disaster recovery
- Cross-environment compatibility ensuring data can be reliably transferred between draft and live applications
- Persistent content migration tools ensuring lesson content remains available after app updates
- Error-free serialization of all data types including BigInt fields for timestamps, IDs, and other numeric values
- Robust data type handling preventing "Do not know how to serialize a BigInt" errors during export operations

## Enhanced User Management
- Complete user list display in admin panel showing all registered users
- Role modification capabilities allowing admins to change user roles between Student and Admin
- User account suspension and reactivation functionality
- User status tracking and management controls

## Stripe Setup Modal
- Modal can be dismissed or skipped by users
- Users can access the application without completing Stripe setup
- Stripe configuration can be completed later through the admin panel
- Modal does not block access to application functionality

## Theme System
- Light/dark mode toggle functionality
- Theme switch accessible from the application header
- User theme preference persistent across sessions
- Theme setting stored per user for consistent experience

## Language Support
- Application content available in English and German
- Language switcher accessible from the application header displaying "EN" for English and "DE" for Deutsch
- User can toggle between English and German at any time
- All UI text consistently displayed in the selected language
- No mixed-language sections in the interface
- Language selection and localization throughout the interface
- Full bilingual support for all features including homepage content management, thumbnails, completion status, tags, and recommendation features
- Categories and levels fully localized in both German and English
- Homepage content management with complete bilingual support for all editable sections
- Proper translation system integration ensuring all navigation and interface elements display translated text instead of translation keys
- Filter labels properly translated and displayed in user-friendly format
- PDF viewer interface and download buttons fully bilingual with appropriate translations for all interactive elements
- PDF error messages fully bilingual with clear, user-friendly text in both English and German

## Backend Data Storage
The backend must persist:
- User profiles with roles and membership information
- User theme preferences (light/dark mode)
- User language preferences (English/German)
- User account status (active/suspended)
- Homepage content data including:
  - Header logo image reference
  - Hero section content (image and text) with bilingual support
  - "Why Choose Everblack Music?" section content with bilingual support
  - Feature cards data with bilingual titles, descriptions, and icons
  - "Choose your path" section content with bilingual support
  - Membership tier data with bilingual names, prices, features, and descriptions
  - Complete feature lists for each membership tier (Free, Starter, Pro, Coaching) with bilingual support and ordering information
- Persistent lesson content storage including:
  - Lesson content metadata and file references in version-agnostic collections
  - Lesson thumbnail images with secure file storage in persistent storage system
  - Lesson tags for content organization and recommendations
  - Lesson categories with bilingual names (German and English)
  - Lesson levels with bilingual names (German and English)
  - Category and level assignments for each lesson
  - Recommended next lesson assignments for each lesson
  - Uploaded lesson materials (PDF, GP files, and thumbnails) with secure persistent file storage
  - Version-independent content references ensuring media accessibility across app updates
- Learning paths and lesson sequences
- Student progress data and completion tracking with lesson-specific completion status
- Practice tasks and completion status
- Student feedback submissions with video files and comments
- Admin feedback responses (text and video)
- Feedback conversation history linked to lessons and users
- Purchase history and membership records
- Stripe configuration settings
- Access control initialization status
- Import/export operation logs and metadata for tracking data transfer operations
- Persistent content migration logs and version compatibility tracking

## Backend Operations
- User authentication and role management with reliable admin access
- User role modification and account status management
- Access control initialization for first user
- Theme preference storage and retrieval
- Language preference storage and retrieval
- Homepage content management operations (create, read, update) with bilingual support and real-time synchronization
- Real-time homepage content update notifications and cache invalidation for immediate frontend synchronization
- Robust error handling and transaction management for homepage content updates
- Header logo upload, storage, and retrieval operations
- Hero section content management with image upload and bilingual text storage
- Feature cards management (create, read, update, delete) with bilingual support
- Membership tier content management with price formatting and bilingual support
- Membership tier feature list management operations (create, read, update, delete, reorder) with bilingual support
- Feature ordering and position management for each membership tier
- Category management operations (create, read, update, delete)
- Level management operations (create, read, update, delete)
- Bilingual content management for categories and levels
- Lesson category and level assignment operations
- Lesson tags management and storage operations
- Persistent lesson content management operations including:
  - Lesson thumbnail upload, storage, and retrieval operations in version-agnostic storage
  - Lesson completion status tracking and updates
  - Lesson recommendation algorithm based on tags, levels, and completion status
  - Lesson data model updates to include category, level, tags, thumbnails, and recommended next lesson references in persistent storage
  - Version-independent lesson content storage and retrieval operations
  - Content migration operations ensuring lesson availability across app updates
  - Persistent media file management with integrity verification
- API endpoints for retrieving available categories and levels for lesson forms
- API endpoints for lesson filtering and sorting by category and level
- API endpoints for lesson recommendations based on tags and completion status
- Membership validation and access control
- Progress tracking updates with lesson-specific completion indicators
- Content delivery based on permissions with persistent storage integration
- File upload and storage for lesson materials, thumbnails, homepage images, and student feedback videos in persistent storage system
- Secure file serving for downloadable content, thumbnails, homepage images, and feedback videos from persistent storage with proper MIME type configuration
- Backend PDF file serving via `/pdf/{id}` endpoints with proper Content-Type: application/pdf headers and CORS headers for fetch API compatibility
- PDF serving endpoints optimized for fetch API access with arrayBuffer response support
- Separate PDF download endpoints with Content-Disposition: attachment headers for explicit download functionality
- PDF file serving endpoints that support both inline viewing via fetch API and explicit download with proper header differentiation
- Enhanced PDF file serving with CORS-safe headers ensuring compatibility with frontend fetch requests
- PDF URL endpoints accessible for fetch API calls returning proper arrayBuffer data for react-pdf integration
- Admin content management operations including homepage content, thumbnails, tags, membership tier feature management, and persistent content storage
- Feedback submission processing and storage
- Admin feedback response management
- Comprehensive data export operations with integrity validation, media file packaging, persistent content inclusion, and BigInt serialization support
- Custom BigInt serialization handling converting BigInt values to strings during export to prevent serialization errors
- Robust data import operations with validation, compatibility checking, error recovery, persistent storage integration, and BigInt deserialization support
- BigInt deserialization handling converting string values back to BigInt during import for proper data restoration
- Import data validation including format verification, size limits, content integrity checks, version compatibility, and BigInt conversion validation
- Import conflict resolution and merge strategy implementation for persistent content
- Import progress tracking and detailed error reporting with recovery options including BigInt conversion error handling
- Import preview and rollback functionality for safe data restoration
- Cross-environment data transfer validation ensuring compatibility between draft and live applications with persistent content preservation
- Media file transfer operations during import/export with integrity verification and persistent storage integration
- Import/export operation logging and audit trail maintenance
- Data integrity verification and checksum validation for imported content in persistent storage
- Large dataset handling with chunked processing and memory optimization
- Persistent content migration operations ensuring seamless content availability during app version transitions
- Version-independent content referencing and retrieval system
- Content integrity monitoring and verification across app updates
- Reliable payment processing integration with Stripe for all membership tiers with Euro currency formatting
- Stripe configuration management
- YouTube link validation and embedding support
- Error-free data serialization for all supported data types including BigInt timestamps and IDs
- Robust serialization error handling preventing export failures due to unsupported data types

## Application Structure
- Frontend organized by feature modules: authentication, lessons, dashboard, admin, feedback, homepage management, persistent content management
- Backend organized by data domains for scalability and maintainability with persistent content storage layer
- Multi-language content support for English and German with consistent language display
- Feedback module integration with existing lesson and user management systems
- Category and level management module integrated with admin panel
- Homepage content management module integrated with admin panel with complete bilingual support and real-time synchronization
- Membership tier feature management module with dynamic feature list editing capabilities
- Real-time state management and query invalidation system for immediate homepage content updates
- Enhanced lesson management forms with category, level, tags, thumbnail selection capabilities, and persistent storage integration
- Lesson filtering, sorting, and recommendation components integrated with lesson display
- React-PDF based PDF viewer component for embedded document display in lesson detail views with full interactive functionality
- PDF viewer component using fetch API to load PDF data as Uint8Array and pass to react-pdf Document component
- PDF viewer with internal loading state management displaying "PDF wird geladen..." and "PDF konnte nicht geladen werden" messages
- React-PDF integration with interactive controls for zoom, page navigation, and optional fullscreen toggle
- PDF viewer that fetches directly from `/pdf/{id}` backend endpoints with proper CORS handling
- PDF viewer component completely removes iframe, object, or blob URL implementations
- Enhanced PDF viewer with separate "In neuem Tab öffnen" and "Herunterladen" buttons using proper Content-Disposition routes
- PDF viewer maintains full bilingual support and responsive mobile behavior
- Lesson navigation system that opens detail views without triggering any file downloads or automatic file actions
- Proper event handling separation between lesson navigation and file download functionality
- Explicit download functionality completely separated from lesson viewing and navigation with proper event handlers
- Download buttons for PDF and GP files with proper error handling and user feedback
- File handling system with correct MIME type support and backend URL integration
- Completion status tracking and visual indicators integrated throughout lesson interface
- Robust data management module for export/import functionality with comprehensive validation, error handling, persistent content support, and BigInt serialization handling
- Import/export UI components with progress tracking, error display, recovery options, persistent content management, and BigInt conversion error handling
- Data validation and integrity checking components for import operations with version compatibility and BigInt validation
- Cross-environment compatibility validation for reliable data transfer between applications with persistent content preservation
- Reliable admin panel access and navigation for content management
- Robust form validation and error handling throughout admin interface
- User-friendly homepage content management interface with clear validation and feedback
- Comprehensive error handling and user feedback system for homepage content synchronization
- Translation system properly integrated with navigation components to display correct translated labels
- Filter label translation system with clear, user-friendly text in both English and German
- Header logo component with responsive sizing and aspect ratio preservation for uploaded images
- Dynamic membership tier feature management interface with drag-and-drop reordering and bilingual editing capabilities
- Enhanced data management interface with import preview, validation feedback, recovery tools, persistent content management, and BigInt serialization error prevention
- Persistent content storage module with version-agnostic architecture ensuring content preservation across app lifecycle
- Content migration interface for seamless app updates with persistent content integrity
- Version-independent content management system integrated throughout lesson creation and editing workflows
- Custom serialization utilities for handling BigInt and other complex data types during export/import operations
- Error-free data export functionality preventing serialization failures for all supported data types
- Bilingual PDF viewer interface with translated controls, download buttons, and error messages for both English and German users
- File URL handling components that support both PDF preview and explicit download actions with proper HTTP headers and MIME type configuration
- Event handling system that prevents automatic file downloads when navigating to lesson detail views
- React-PDF based PDF rendering system that works consistently across all browsers and file types with proper backend integration
- PDF viewer initialization logic using fetch API to validate file accessibility and load PDF data before rendering react-pdf components
- Enhanced PDF viewer error handling system displaying clear, actionable error messages when PDF loading fails with bilingual support and fallback download options
- PDF viewer with fetch-based loading that validates file accessibility and handles CORS-safe PDF data retrieval
- Comprehensive PDF viewer error handling with clear bilingual error messages and download fallback options when PDF cannot be loaded via fetch API
