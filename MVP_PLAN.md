# MVP Plan

General:
MVP Features
Making and logging into an account
Post photo
Feed
Reacting / Commenting
Friends (adding, accepting, removing)
Block / Report
Disappearing post
Permanent posts are deferred until after the MVP; the main posting flow should create 24-hour deolys only.

Safety
block people, report posts, delete your own posts/account
blocking needs to affect feed, search, comments, and friend requests
reports need somewhere to go, even if it is just an admin list
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
Report post button
Save report reason
Simple admin/report list
Expected result:
The app has basic blocking and reporting.

Week 8: Delete Features + Polish + Full Test
Build:
Delete your own post
Delete or deactivate account
Remove/hide deleted user’s posts, comments, reactions, and friendships
Polish UI
Fix weird bugs
Test with 3 fake users
Check that posts disappear after 24 hours
Check login, friends, feed, posting, reactions, comments, block, report, delete
Expected result:
You have a working private beta MVP.

Deferred / Before Beta
Review habit:
At the start of each week, check this section.
At the end of each week, move anything that is now urgent into the active week.
Before Week 8 full test or private beta, no high-risk deferred item should still be unresolved.
Tasks:
Create clean Prisma migration baseline before private beta
Why it matters: database changes become repeatable and safer.
When it must be done: before Week 8 full test or private beta.
Risk if ignored: future database changes may be hard to replay or debug.
Decide final photo storage provider before Week 4 implementation
Why it matters: upload code depends on the storage service.
When it must be done: before building real photo upload.
Risk if ignored: upload work may need to be rewritten.
Confirm private photo access rules before real uploads
Why it matters: photos should not become public by accident.
When it must be done: before saving real user photos.
Risk if ignored: private images or user data could be exposed.
Run full auth/session smoke test after reseeding and app reloads
Why it matters: saved login should recover cleanly when backend sessions change.
When it must be done: after auth/session changes and before private beta.
Risk if ignored: users may see broken feed/profile states instead of login.
Final pass on disappearing deoly/archive behavior
Why it matters: home feed, profile, and archive need clear rules for expired deolys.
When it must be done: before Week 8 full test.
Risk if ignored: old posts may show or hide in confusing places.

Deferred / Later Polish
Tasks:
Friend request accepted micro-interaction
Remembered idea: add a fun burst or tiny thin-lettered “Accepted request!” pop-up after accepting a friend request.
Why it matters: adds delight without changing core friend-request behavior.
When to revisit: after core friend request, feed, posting, and safety flows are stable.
Risk if ignored: low; the app still works, but friend actions may feel less special.
Full deoly archive calendar
Why it matters: expired deolys should eventually be browsable from a real history/calendar instead of only placeholder UI.
When to revisit: after disappearing-post rules and storage are stable.
Risk if ignored: users may expect old deolys to be findable but only see a placeholder.
Richer friend account pages
Why it matters: the first friend profile page is intentionally simple and uses already-loaded feed data.
When to revisit: after MVP feed, profile, and posting behavior are reliable.
Risk if ignored: friend profiles may feel thin, but core feed navigation still works.
Saved or permanent posts
Decision: permanent posting is out of the MVP. Keep the main posting flow focused on 24-hour deolys, and revisit saved/permanent profile posts after the private beta basics work.
When to revisit: after the MVP feed, posting, reactions, comments, and safety flows are reliable.
Risk if ignored: low for MVP; the app can still work with disappearing posts only.

MVP Checklist
Make an account
Add a friend
Take a photo
Post it
See friends’ posts
React/comment
Have posts disappear after 24 hours
Block/report someone if needed
Later on:
add text box option to posts**
save your own posts to your account of “deolys” like BeReal memories
prayer wall
music, verse, app integrations
