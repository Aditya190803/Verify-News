# VerifyNews 📰✅

## Overview
VerifyNews is a modern, AI-powered news verification platform built with React and TypeScript. It helps users fact-check news articles and headlines in real-time using advanced web search capabilities and Google's Gemini AI for intelligent analysis. The application provides instant credibility assessments, source verification, and corrected information when misinformation is detected.

**🌐 Live Demo**: [https://verifynews.adityamer.live/](https://verifynews.adityamer.live/)  
**🤖 Get Gemini API Key**: [Google AI Studio](https://aistudio.google.com/app/apikey)

## ✨ Features
- 🔍 **Smart Text Analysis** - Accepts news headlines, articles, or any text for verification
- 🌐 **Multi-Source Verification** - Uses DuckDuckGo API to find reliable sources across the web
- 🤖 **AI-Powered Fact-Checking** - Leverages Google Gemini AI for intelligent authenticity analysis
- ✅ **Credibility Scoring** - Provides detailed credibility assessments with confidence levels
- 📝 **Corrected Information** - Offers accurate information when misinformation is detected
- 📱 **Social Sharing** - Share verified results across social media platforms
- 💾 **History Tracking** - Stores past verifications in Firebase Firestore
- 🔐 **User Authentication** - Secure login with Firebase Auth (Email/Password + Google)
- 🌙 **Theme Support** - Dark/Light mode toggle for better user experience
- 📊 **Analytics Dashboard** - Track verification history and patterns
- ⚡ **Real-time Updates** - Instant verification results with loading states
- 📱 **Responsive Design** - Optimized for desktop, tablet, and mobile devices

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Firebase account** (free tier available)
- **Google AI Studio account** - Get your free API key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Aditya190803/Verify-News.git
   cd Verify-News
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   
   Copy the example environment file and add your API keys:
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your own API keys:
   ```env
   # Firebase Configuration
   # Get these from: https://console.firebase.google.com/
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   
   # Gemini AI Configuration
   # Get your API key from: https://aistudio.google.com/app/apikey
   VITE_GEMINI_API_KEY=your-gemini-api-key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   🎉 **Your app will be available at:** `http://localhost:5173`

### 📦 Build for Production
```bash
npm run build
npm run preview  # Preview production build locally
```

### Current Services Enabled:
✅ **Authentication** - Email/Password + Google Sign-in  
✅ **Firestore Database** - User data and verification history  
✅ **Hosting** - Static web hosting  
✅ **Analytics** - Google Analytics integration  

## 📱 Usage Guide

### Basic Verification Process
1. **Enter Content**: Paste a news headline, article excerpt, or any text you want to verify
2. **Click Verify**: Hit the "Verify News" button to start the fact-checking process
3. **Review Results**: Get instant credibility assessment with:
   - ✅ **Credibility Score** (0-100%)
   - 📊 **Confidence Level**
   - 🔍 **Source Analysis**
   - 📰 **Related Articles**
   - ✏️ **Corrections** (if misinformation detected)
4. **Share Results**: Use social media buttons to share verified information

### User Account Features
- **Sign Up/Login**: Create an account to save your verification history
- **History Dashboard**: Access all your past verifications
- **Search History**: Find previous verifications quickly
- **Theme Preferences**: Switch between light and dark modes

### Example Verification Types
- 📰 News headlines from any source
- 📄 Article excerpts or full articles
- 📱 Social media claims
- 💬 Statements requiring fact-checking
- 🗳️ Political claims and statements

## Tech Stack
- **Frontend:** React 18, TypeScript, Vite
- **UI Framework:** Tailwind CSS, shadcn/ui components
- **State Management:** React Context API, React Query
- **Authentication:** Firebase Auth
- **Database:** Firebase Firestore
- **AI/ML:** Google Gemini AI for fact-checking
- **Search:** DuckDuckGo API integration
- **Routing:** React Router DOM
- **Form Handling:** React Hook Form with Zod validation
- **Icons:** Lucide React
- **Deployment:** Optimized for modern web deployment

## Future Enhancements
- Real-time misinformation alerts
- Browser extension for instant verification
- AI-powered sentiment analysis
- Multi-Modal Support
