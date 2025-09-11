# TODO: Fix Email Verification Login Issue

## Issue Description
- User registers successfully
- Verification email is sent
- Client attempts auto-login immediately after registration
- Server returns 401 Unauthorized because email is not verified
- Client incorrectly sets "isLoggedIn" to true despite failed login

## Root Cause
The Register.tsx component was setting localStorage "isLoggedIn" to true in both success and failure cases of the auto-login attempt, causing the client to think the user was logged in when they weren't.

## Solution Implemented
- ✅ Updated Register.tsx to only set "isLoggedIn" to true on successful login
- ✅ If login fails (due to unverified email), navigate to verify-email-prompt without setting "isLoggedIn"
- ✅ Improved user messaging to clearly indicate email verification is required

## Changes Made
- Modified `client/src/pages/Register.tsx` onSuccess handler in createAccount mutation
- Split logic: successful login → set isLoggedIn + navigate to app; failed login → navigate to verify-email-prompt

## Testing Steps
- [ ] Register a new account
- [ ] Verify that no 401 error occurs in browser console
- [ ] Verify that user is redirected to verify-email-prompt page
- [ ] Verify that "isLoggedIn" localStorage is not set until email is verified
- [ ] Verify that after email verification, user can successfully log in

## Follow-up
- [ ] Test the complete email verification flow
- [ ] Ensure VerifyEmailPrompt page works correctly
- [ ] Verify that Login page properly handles unverified email attempts
