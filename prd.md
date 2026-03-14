LocalTalk — Product Requirements Document
v1.0 | March 2026 | Status: Draft

1. Product Overview
LocalTalk is a zero-friction, browser-based chat application designed exclusively for users sharing the same local network (LAN/Wi-Fi). Users simply open the hosted web page, enter a display name, and immediately begin chatting with others on the same network. There is no account creation, no login, no persistent storage, and no data retained after a user leaves or the page is refreshed.
Product NameLocalTalkTypeLocal Network Web ApplicationPrimary Use CaseReal-time messaging between users on the same LAN/Wi-FiAuthenticationNone — display name onlyData PersistenceNone — all data is ephemeral and session-scopedDeploymentSelf-hosted on a local machine within the networkProposed StackNode.js + Express + Socket.IO (backend), HTML/CSS/JS (frontend)

2. Problem Statement
Teams, households, classrooms, or office groups who need quick local communication currently rely on cloud-based tools (Slack, WhatsApp, Teams) that require accounts, internet access, and store data on external servers. These tools are overkill for temporary, local, or privacy-sensitive communication.
LocalTalk solves this by providing:

Instant access — no sign-up or login barriers
Full privacy — data never leaves the local network
Zero setup for end users — just open a URL
Ephemeral by design — messages disappear when users leave


3. Goals & Non-Goals
Goals

Allow any user on the same LAN to join a shared chat room instantly
Require only a display name to start chatting — no passwords, no email
Ensure all message data is wiped when a user disconnects or navigates away
Allow any user to clear the entire chat history at any time
Provide real-time messaging with minimal latency
Be accessible from any modern browser without installing anything
Show who is currently online in the chat room

Non-Goals

No user accounts, authentication, or identity verification
No message persistence or chat history across sessions
No file sharing, voice, or video features in v1.0
No internet access required or supported — LAN only
No end-to-end encryption
No push notifications
No multiple rooms or channels in v1.0


4. Target Users
Primary users: office teams, classroom participants, home network users, developers/hobbyists running local-network projects.
PersonaContextKey NeedThe TeacherClassroom where students share Wi-Fi. Wants to broadcast questions without students needing accounts.Zero setup, works on school devicesThe Office AdminSmall office without a corporate chat tool. Needs a quick internal channel.Private, no cloud, easy accessThe DeveloperTesting a LAN app, needs low-friction comms between team members in the room.Self-hosted, simple, extensibleThe Home UserWants to message family at home without SMS or external apps.Simple, private, no external data sharing

5. Feature Requirements
FeatureDescriptionPriorityName Entry ScreenLanding screen prompting user to enter a display name before joining. No password required.Must HaveReal-Time MessagingMessages broadcast instantly to all connected users via WebSockets.Must HaveOnline Users ListPanel showing names of all currently connected users in real time.Must HaveJoin/Leave NotificationsSystem messages shown when a user joins or leaves (e.g. "Alice joined the chat").Must HaveClear Chat (Global)A button that removes all messages for all users currently in the room.Must HaveSession Cleanup on ExitOn tab close/refresh/navigate away, user is removed from the active list and server data is cleared.Must HaveMessage TimestampsEach message shows a local HH:MM timestamp next to the sender's name.Should HaveUsername ColorsEach user is assigned a unique color for their name to make conversations easier to scan.Should HaveMobile Responsive UIChat interface adapts gracefully to mobile screen sizes.Should HaveDuplicate Name HandlingIf a name is already in use, the new user is prompted to choose a different one.Should HaveTyping IndicatorShows "User is typing..." to other participants when someone is composing a message.Nice to HaveMessage Character LimitMax character limit (e.g. 500 chars) per message to prevent spam.Nice to HaveDark Mode ToggleUsers can switch between light and dark UI themes.Nice to Have

6. User Stories
IDUser StoryAcceptance CriteriaUS-01As a new visitor, I want to enter just my name and start chatting immediately, so that I don't need an account.Name input is the only requirement; chat room opens on submit; no password field exists.US-02As a user, I want to see all messages from everyone in real time, so that I can follow the conversation.Messages appear within 500ms; sender name and timestamp are shown.US-03As a user, I want to see who is currently online, so that I know who is in the room.Online list updates in real time after every join/leave event.US-04As a user, I want to be notified when someone joins or leaves, so that I know when the group changes.System messages like "Bob joined" appear in chat on connect/disconnect.US-05As a user, I want to clear the chat for everyone, so that we can start fresh.A "Clear Chat" button is visible; clicking it removes all messages for all active users.US-06As a user, I want my data removed automatically when I leave the page, so that I don't leave a trace.On tab close/refresh, user is removed from the online list; no data remains on the server.US-07As a mobile user, I want the chat to work on my phone browser, so that I don't need a laptop.Fully functional on iOS Safari and Android Chrome.US-08As a user, I don't want someone else to use my name, so that messages are clearly attributed.Duplicate name triggers an error prompt asking the user to choose another.

7. Data & Privacy Model
Privacy is a core design principle. No data is written to disk. No database is used. All state lives in server memory only for the duration of active connections.
Data lifecycle:
DataBehaviourDisplay NameStored in server memory only while connected. Deleted on disconnect.MessagesHeld in a server-side in-memory array. Cleared on "Clear Chat" or server restart.Session/CookieNo cookies or localStorage used. Session is tied to the WebSocket connection only.IP AddressUsed only to scope LAN access. Not logged or stored.User IDA temporary socket ID used internally; never exposed to other users.
Data is deleted when:

A user closes or refreshes their browser tab
A user navigates away from the page (beforeunload event)
Any user clicks the "Clear Chat" button
The server process is restarted


8. Technical Requirements
Architecture

Backend: Node.js + Express serving the static frontend and managing WebSocket connections via Socket.IO
Frontend: Single HTML file with embedded CSS and JavaScript — no framework required
Communication: WebSocket (Socket.IO) for real-time bi-directional messaging
State: All state is in-memory on the server — no database, no filesystem writes
Hosting: Server runs on a LAN machine accessible at e.g. 192.168.x.x:3000

Non-Functional Requirements
RequirementTargetMessage DeliveryUnder 500ms to all clients under normal LAN conditionsConcurrent UsersAt least 50 simultaneous users without degradationBrowser SupportChrome, Firefox, Safari, Edge — latest 2 versions eachMobile SupportiOS Safari 15+ and Android Chrome 100+AccessibilityWCAG 2.1 AA basics: contrast, keyboard navigation, screen reader labels
Socket Events
EventDescriptionuser:joinClient sends display name; server adds user, broadcasts join notificationuser:leaveEmitted on disconnect; server removes user, broadcasts leave notificationmessage:sendClient sends message text; server broadcasts {name, text, timestamp} to allmessage:clearClient requests clear; server broadcasts clear command to all clientsusers:updateServer pushes updated online user list after any join/leave eventerror:duplicate_nameServer emits if joining user's name is already taken

9. UI/UX Requirements
Screens

Landing / Name Entry: Full-screen centered card with app name, a text input for display name, and a "Join Chat" button.
Chat Room: Header with app name and user count, scrollable message area, online users sidebar (collapsible on mobile), message input bar at the bottom, and a "Clear Chat" button.

Design Principles

Minimal and distraction-free — the interface should feel lightweight and fast
Immediate feedback — typing, sending, and joining should feel instant
Clear visual hierarchy — distinguish system messages from user messages

Message Display Format
TypeFormatUser Message[Username in color]  [message text]  [HH:MM]System MessageCentered, italicised, muted — e.g. "Alice joined the chat"Own MessagesRight-aligned or highlighted to distinguish from othersAfter ClearEmpty area with subtle "Chat was cleared" system notice

10. Milestones & Roadmap
PhaseMilestoneDeliverablesTargetPhase 1Core MVPName entry, real-time messaging, join/leave notifications, online users listWeek 1–2Phase 2Data CleanupSession cleanup on exit, global clear chat, duplicate name handlingWeek 2–3Phase 3PolishTimestamps, user colors, responsive UI, mobile testingWeek 3–4Phase 4Extras (v1.1)Typing indicators, dark mode, character limitsWeek 5+

11. Success Metrics

A new user can go from opening the URL to sending a message in under 15 seconds
Messages are delivered to all connected clients within 500ms
Zero messages, names, or session data persist after all users disconnect
The "Clear Chat" function removes all messages for all clients within 1 second
No user can join with a name already in active use
The application works on both desktop and mobile browsers without modification


12. Open Questions

Should the host machine auto-display its LAN IP on the landing screen to make sharing the URL easier?
Should there be an admin/host role with exclusive ability to clear the chat or kick users?
Should users who join mid-session see previous messages, or only messages from their join time onwards?
Should there be a maximum concurrent user limit to prevent abuse on open office networks?
Should the application support multiple named rooms in v1.1?