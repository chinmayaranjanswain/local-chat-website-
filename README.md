# ApniBaat — Private LAN Chat

<div align="center">
  <img src="public/favicon.ico" alt="ApniBaat Logo" width="80" height="80">
  <p><strong>A zero-friction, browser-based chat application designed exclusively for users sharing the same local network (LAN/Wi-Fi).</strong></p>
</div>

## 🌟 Overview

ApniBaat (formerly LocalTalk) is an instant messaging web application that works entirely on your local network. Users simply open the hosted web page, enter a display name, and immediately begin chatting with others on the same Wi-Fi or LAN. 

**Zero Setup • No Accounts • Ephemeral Data • Mobile-First**

Perfect for:
- Office teams needing quick, private communication
- Classrooms or study groups
- Home network users
- Local development teams

## ✨ Key Features

- **Instant Access**: No sign-up, no login, no passwords. Just enter a display name.
- **Privacy First**: Data never leaves your local network. No external servers or cloud storage.
- **Ephemeral Messaging**: All messages and session data reside in the server's memory. When the server stops or users leave, the data vanishes. No persistent database.
- **Premium Dark Theme**: A sleek, modern, dark-only interface with glassmorphic elements and animated background orbs.
- **Fully Responsive**: Works beautifully across all devices.
  - Large desktops
  - Tablets (landscape & portrait)
  - Mobile phones (with a custom slide-over hamburger menu for online users)
- **Smart Mobile Keyboard Handling**: The UI adapts to mobile virtual keyboards without breaking the layout.
- **Real-Time Indicators**: See who is online and when users are typing (*"User is typing..."*).
- **Easy Sharing**: One-click copy for the room link to easily share with others on the network.

## 🚀 How to Run Locally

### Requirements
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- A computer connected to a local network (Wi-Fi or LAN)

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/chinmayaranjanswain/local-chat-website-.git
   cd local-chat-website-
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   # Or for development with auto-restart:
   npm run dev
   ```

4. **Access the Application**
   - On the host machine: Open `http://localhost:3000` in your browser.
   - On other devices sharing the same Wi-Fi/LAN: Find the host's Local IP address (e.g., `192.168.1.34`), and open `http://<HOST_IP>:3000` on their browsers. The host's app UI will also display a "Share this link with your team" section which you can copy and send to others.

## 💻 Tech Stack

- **Backend**: Node.js, Express.js
- **Real-Time Communication**: Socket.IO
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (No frameworks)
- **Design System**: Custom CSS variables, Grid/Flexbox, CSS Animations, Mobile-First Media Queries

## 🛡️ Data & Privacy Model

- **No Database**: There is no MongoDB, PostgreSQL, or SQLite.
- **In-Memory Storage**: Messages and online user lists are kept in RAM (`server.js` memory).
- **Auto-Cleanup**: When a user closes their tab, they are automatically removed from the active list.
- **Local Network Only**: If you don't expose port `3000` to the internet through your router, only devices connected to your physical router can access the chat.

## 📝 License

This project is open-source and available under the MIT License.
