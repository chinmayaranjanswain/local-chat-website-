# ApniBaat — Private LAN Chat

<div align="center">
  <img src="apnibaat%202.0.png" alt="ApniBaat Logo" width="150">
  <p><strong>A zero-friction, browser-based chat application designed exclusively for users sharing the same local network (LAN/Wi-Fi).</strong></p>
</div>

---

## 🌟 Overview

ApniBaat (formerly LocalTalk) is an instant messaging web application that works entirely on your local network. Users simply open the hosted web page, enter a display name, and immediately begin chatting with others on the same Wi-Fi or LAN. 

**Zero Setup • No Accounts • Ephemeral Data • Mobile-First**

Perfect for:
- 🏢 Office teams needing quick, private communication
- 🎓 Classrooms, computer labs, or study groups
- 🏠 Home network users sharing links or texts across devices
- 💻 Local development teams testing real-time connections

## ✨ Key Features & Highlights

- **Instant Access**: No sign-up, no login, no passwords. Just enter a display name and you're in.
- **Privacy First**: Data never leaves your local network. No external servers, no cloud storage, no third-party trackers.
- **Ephemeral Messaging**: All messages and session data reside entirely in the server's RAM. When the server stops or users leave, the data vanishes permanently. No persistent database is used.
- **Premium Dark Theme**: A sleek, modern, dark-only interface featuring glassmorphic elements, smooth CSS animations, and floating background orbs for a premium feel.
- **Fully Responsive & Mobile-Optimized**: 
  - Works beautifully across large desktops, tablets, and mobile phones.
  - **Smart Mobile Keyboard Handling**: The UI intelligently adapts to mobile virtual keyboards to prevent awkward page shifting or hidden inputs.
  - **Intuitive Mobile Navigation**: Custom slide-over hamburger menu for viewing online users seamlessly on smaller screens.
- **Real-Time Indicators**: 
  - Live "Online Users" list.
  - Real-time typing indicators (*"User is typing..."*).
- **Easy Room Sharing**: Features a convenient "Share Room" button that copies the local network URL to your clipboard, allowing you to easily invite others on the same network.

## 📸 Screenshots

<div align="center">
  <img src="Screenshot%202026-03-16%20003302.png" alt="ApniBaat Interface 1" width="48%">
  &nbsp;
  <img src="Screenshot%202026-03-16%20003326.png" alt="ApniBaat Interface 2" width="48%">
</div>

## 🚀 How to Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.x or higher is recommended)
- A computer connected to a local network (Wi-Fi or LAN)

### Installation & Setup

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
   ```
   *For developers wanting auto-restart on file changes:*
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - **On the host machine:** Open `http://localhost:3000` in your web browser.
   - **On other devices (sharing the same Wi-Fi/LAN):** Find the host's IPv4 address (e.g., `192.168.1.34`), and open `http://<HOST_IP>:3000` in their browsers. The host's app UI will also display a shareable network link which you can copy and send to others.

## 📂 Project Structure

```text
├── public/                 # Frontend static assets
│   ├── css/
│   │   └── style.css       # Core styling (Dark theme, glassmorphism)
│   ├── js/
│   │   └── main.js         # Frontend socket and UI logic
│   └── favicon.ico         # Application icon
├── apnibaat 2.0.png        # App logo variant
├── index.html              # Main chat interface
├── server.js               # Node.js Express & Socket.io server
├── package.json            # Project metadata and dependencies
└── README.md               # Documentation
```

## 💻 Tech Stack

- **Backend**: Node.js, Express.js
- **Real-Time Engine**: Socket.IO
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (No heavy frameworks)
- **Design System**: Custom CSS variables, CSS Grid/Flexbox, Mobile-First Media Queries

## 🛡️ Data & Privacy Model

- **No Database**: There is no MongoDB, PostgreSQL, SQLite, or any other persistent storage.
- **In-Memory Storage**: Messages and online user lists are kept strictly in RAM (`server.js` memory).
- **Auto-Cleanup**: When a user closes their tab or disconnects, they are automatically removed from the active list.
- **Local Network Only**: As long as you don't expose port `3000` to the internet via port forwarding on your router, only devices physically connected to your local network can access the chat.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
Feel free to check [issues page](https://github.com/chinmayaranjanswain/local-chat-website-/issues) if you want to contribute.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open-source and available under the MIT License.

## 👨‍💻 Author

**Chinmaya Ranjan Swain**
- GitHub: [@chinmayaranjanswain](https://github.com/chinmayaranjanswain)
