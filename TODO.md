# Home.tsx Transformation: Static to Dynamic

## Overview
Transform Home.tsx from static to dynamic by replacing hardcoded data with API calls, adding loading/error states, making content interactive, and adding personalization.

## Key Changes
- Replace hardcoded user data with API calls or context/props
- Implement proper loading states for all dynamic content
- Add error handling for failed data fetches
- Use React Query or SWR for efficient data caching and refetching
- Make all buttons functional with proper navigation
- Add click handlers for challenge participation
- Implement activity tracking submissions
- Add likes, comments on community posts
- Real-time updates when challenges are completed
- Dynamic greeting based on time of day
- Personalized challenge recommendations
- Progress-based encouragement
- Real-time notifications for achievements
- Dynamic progress bars based on actual completion data
- Lazy loading for images and components
- Pagination for activity feeds
- Memoization for expensive calculations
- Dependency optimization for re-renders
- Progress calculation caching

## Implementation Steps

### 1. Setup React Query
- [x] Check if React Query is installed in client/package.json (already installed)
- [x] Install @tanstack/react-query if not present (already present)
- [x] Configure QueryClient in client/src/config/queryClient.js (already configured)

### 2. Create Custom Hooks
- [x] Create useRecentActivities hook (combines daily tracking, challenges, community posts)
- [x] Create useCommunityHighlights hook (live community posts, real-time achievements)
- [x] Create useChallengeProgress hook (weekly completion rate, perfect days count, progress bar)
- [x] Create useCO2Savings hook (based on actual user actions, real-time computation)
- [x] Create useLeaderboardData hook (real rankings, live updates) - using existing useLeaderboard
- [ ] Create useUserStats hook (dynamic stats from user activity data)

### 3. Update Home.tsx Component
- [x] Import new hooks and React Query
- [x] Replace hardcoded recent activities with useRecentActivities
- [x] Replace community highlights with useCommunityHighlights
- [x] Replace CO2 savings with useCO2Savings
- [x] Replace challenge progress with useChallengeProgress
- [x] Replace leaderboard data with useLeaderboardData (using existing useLeaderboard)
- [x] Add loading states for all dynamic sections
- [x] Add error handling with fallback UI
- [x] Implement time-based dynamic greeting
- [x] Add refresh functionality (pull-to-refresh or button)
- [ ] Add pagination for activity feeds
- [ ] Memoize expensive calculations (progress percentages, CO2 calculations)

### 4. Add Interactivity
- [x] Make challenge participation buttons functional (EcoChallengeSection handles this)
- [x] Add activity tracking submission handlers (navigate to /track)
- [ ] Implement likes/comments on community posts
- [ ] Add real-time updates for challenge completions
- [ ] Add achievement notifications

### 5. Performance Optimizations
- [ ] Implement lazy loading for images
- [ ] Add pagination for activity feeds
- [x] Memoize progress calculations (handled by hooks)
- [ ] Optimize re-renders with useMemo/useCallback
- [x] Cache challenge completion percentages (handled by React Query)

### 6. Personalization Features
- [x] Dynamic greeting based on time of day
- [ ] Personalized challenge recommendations
- [ ] Progress-based motivational messages
- [ ] Real-time achievement unlocks
- [x] Dynamic progress visualization

### 7. Testing and Validation
- [ ] Test loading states
- [ ] Test error states
- [ ] Test interactivity (buttons, submissions)
- [ ] Test real-time updates
- [ ] Test performance optimizations
- [ ] Validate data accuracy (CO2 savings, progress calculations)

### 8. API Integration
- [x] Ensure APIs for daily-tracking, challenges, community posts, leaderboard, profile are available
- [x] Handle API errors gracefully
- [x] Implement proper data fetching with React Query

## Dependent Files
- client/src/hooks/ (new hooks)
- client/src/pages/Home.tsx (major updates)
- client/package.json (possible React Query addition)
- client/src/config/queryClient.js (configuration)

## Followup Steps
- [x] Install dependencies if needed (already done)
- [ ] Run the application to test changes
- [ ] Monitor performance
- [ ] Add any missing API endpoints if required
