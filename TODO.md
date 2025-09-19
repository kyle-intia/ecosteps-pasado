# Fix Username Display Issue After User Switch

## Problem
- Username on Home and Dashboard pages shows old user ("kyleintia123") even after logging in as new user ("charliekirk12")
- Profile data is cached in React Query with `staleTime: Infinity`
- Login process doesn't invalidate cached profile data

## Tasks
- [x] Edit `client/src/pages/Login.tsx` to invalidate profile and auth queries after successful login
- [x] Edit `client/src/pages/Register.tsx` to invalidate queries after successful auto-login
- [ ] Test login flow to verify profile updates correctly
- [ ] Ensure no other cached data causes similar issues

## Files to Edit
- client/src/pages/Login.tsx
- client/src/pages/Register.tsx
