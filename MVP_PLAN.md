# MVP Plan

General:
MVP Features
Making and logging into an account
Post photo
Feed
Reacting / Commenting
Friends (adding, accepting, removing)
Block
Disappearing post
Permanent posts are deferred until after the MVP; the main posting flow should create 24-hour deolys only.

Safety
block people, delete your own posts/account
blocking needs to affect feed, search, comments, and friend requests
account deletion needs to remove or hide a user’s data

Design
make things pretty

Backend
Make the phone app use real data
connecting the phone app to real login
showing the real feed
making sure users only see friends’ posts
handling loading/error states so the app does not feel broken

Add photo uploads
saving photos somewhere, like Firebase Storage or S3
connecting each uploaded photo to a post
making uploads work on slower Wi-Fi/cell data
showing progress or retry options if upload fails
making sure images are private, not public to everyone

Week 1: Login + Start Friends
Build:
Mobile signup screen } 1
Mobile login screen } 1
Connect signup/login to backend } 2
Save logged-in user } 3
Logout button } 3
Stop using fake current user } 4
Start friend search screen } 4
Expected result:
By the end of the week, you can make an account, log in, log out, and start searching for users.

Week 2: Finish Friends + Start Feed
Build:
Send friend request } 1
Accept friend request } 2
Decline friend request } 2
Show friend/request status } 3
Remove friend } 3
Start mobile feed using real backend data } 4-5
Expected result:
Two users can become friends, and the feed starts showing real data instead of fake posts.

Week 3: Real Feed + Post Expiration Backend
Build:
Finish loading real feed 
Make sure to prioritize most recent posts at top
Show your posts
Show friends’ posts
Hide non-friends’ posts
Add loading/error states
Add post expiration time to backend
Make backend hide posts older than 24 hours
Expected result:
The phone app has a real friends-only feed, and old posts can disappear after 24 hours.

Week 4: Photo Post Backend + Storage
Build:
Add photo field to posts
Choose photo storage: Cloudflare R2 for the MVP
Keep photo storage behind a thin backend storage layer so provider-specific code does not affect user-facing posting flows or future engagement A/B tests
Connect backend/app to photo storage
Upload a photo from the phone
Save uploaded photo path/link to a post
Keep photo access private
Expected result:
A photo can be uploaded and connected to a real post.

Week 5: Camera Posting Flow
Build:
Take photo in app
Preview photo
Add optional caption
Show upload/posting progress
Add retry if upload fails
Create post after upload
Return to feed after posting
Expected result:
You can take a photo, post it, and see it in the feed.

Week 6: Reactions + Comments
Build:
Show reaction buttons
Add reaction
Remove reaction
Show reaction counts
Open comments/post detail screen
Show comments
Add comment
Refresh after comment
Expected result:
Users can react and comment on friends’ photo posts.
Activity notifications:
- Notify requester when a friend request is accepted.
- Notify post owner when someone reacts to or comments on their post.
- Notify commenter when someone replies to or reacts to their comment, if replies/comment reactions exist.
- Do not notify for declined requests or removed friends.

Week 7: Basic Safety
Build:
Block user button
Blocked users disappear from feed
Blocked users disappear from search
Blocked users cannot send friend requests
Blocked users cannot comment/react on your posts
Expected result:
The app has basic blocking.

Week 8: Delete Features + Polish + Full Test
Build:
Delete your own post
Delete or deactivate account
Remove/hide deleted user’s posts, comments, reactions, and friendships
Polish UI
Edit profile (GitHub #20): display name, username, optional 160-character bio, and a photo from the phone library
Open the editor from Profile and Settings; Save/Cancel, validation, retry, and unsaved-change protection
Keep avatar storage private; show bio/photo to signed-in users unless either person has blocked the other
Persist profile changes across refresh/relogin and refresh identity across feed, friends, search, and activity
Profile editing implementation and automated checks complete; Expo Go / live R2 acceptance checks remain in PROFILE_EDITING_TEST_PLAN.md
Fix weird bugs
Test with 3 fake users
Check that posts disappear after 24 hours
Check login, friends, feed, posting, reactions, comments, block, delete
Expected result:
You have a working private beta MVP.

Deferred / Before Beta
1. Decide final photo storage provider before Week 4 implementation
Why it matters: upload code depends on the storage service.
When it must be done: before building real photo upload.
Risk if ignored: upload work may need to be rewritten.
2. Confirm private photo access rules before real uploads
Why it matters: photos should not become public by accident.
When it must be done: before saving real user photos.
Risk if ignored: private images or user data could be exposed.
3. Run full auth/session smoke test after reseeding and app reloads
Why it matters: saved login should recover cleanly when backend sessions change.
When it must be done: after auth/session changes and before private beta.
Risk if ignored: users may see broken feed/profile states instead of login.

MVP Checklist
Make an account
Add a friend
Take a photo
Post it
See friends’ posts
React/comment
Have posts disappear after 24 hours
Block someone if needed
Later on:
add text box option to posts**
save your own posts to your account of “deolys” like BeReal memories
prayer wall
music, verse, app integrations
