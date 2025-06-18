# Verify News

## Overview
Fake News Verifier is a React-based web application that checks the authenticity of news articles or headlines using web search and AI-powered analysis. The app integrates DuckDuckGo for web searches and Gemini LLM for AI-based fact-checking.

## Features
- Accepts **text** input for verification.
- Uses **DuckDuckGo API** to find reliable sources.
- Leverages **Gemini LLM** to determine authenticity.
- Provides **corrected information** if news is fake.
- Allows users to **share results** via social media.
- Stores past verifications in a **Firebase database**.
- Supports **user authentication** for history tracking.

## Installation
### Prerequisites
- Node.js & npm

### Steps
1. Clone the repository:
   ```sh
   git clone https://github.com/Aditya190803/Verify-News.git
   cd Verify-News
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. **Configure Environment Variables:**
   
   Copy the `.env.example` file to `.env` (if not already present):
   ```sh
   cp .env.example .env
   ```
   
   Update the `.env` file with your API keys:

   #### Firebase Configuration
   1. Visit [Firebase Console](https://console.firebase.google.com/)
   2. Create a new project or select existing one
   3. Go to Project Settings > General > Your apps
   4. Copy the configuration values and update:
   ```env
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

   #### Google Gemini AI Configuration
   1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   2. Create an API key
   3. Update the environment variable:
   ```env
   VITE_GEMINI_API_KEY=your-gemini-api-key
   ```

   #### Firebase Setup (Required for full functionality)
   1. **Enable Authentication:**
      - Go to Authentication > Sign-in method
      - Enable Email/Password and Google (optional)
   
   2. **Create Firestore Database:**
      - Go to Firestore Database
      - Create database in test mode
      - Set up security rules as needed

4. Start the development server:
   ```sh
   npm run dev
   ```

   The app will be available at `http://localhost:8080`

## Environment Variables

This project requires the following environment variables to be set in your `.env` file:

| Variable | Description | Required | Where to Get |
|----------|-------------|----------|--------------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | Yes* | [Firebase Console](https://console.firebase.google.com/) |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes* | Firebase Console |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Yes* | Firebase Console |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes* | Firebase Console |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes* | Firebase Console |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | Yes* | Firebase Console |
| `VITE_GEMINI_API_KEY` | Google Gemini AI API key | Yes | [Google AI Studio](https://makersuite.google.com/app/apikey) |

\* Required for authentication and data persistence. The app will work in demo mode without these.

### Example .env file:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...

# Gemini AI Configuration
VITE_GEMINI_API_KEY=AIza...
```

## Usage
- Enter a news headline or paste an article.
- Click **Verify News** to check authenticity.
- View results and **share verified information**.

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

## Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── auth/           # Authentication components
├── pages/              # Page components
├── context/            # React Context providers
├── hooks/              # Custom React hooks
├── services/           # API services
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── config/             # Configuration files
```

## Troubleshooting

### Blank White Screen
- Ensure all environment variables are properly set in `.env`
- Check browser console for errors
- Verify Firebase configuration is correct
- Make sure the development server is running

### Firebase Errors
- Double-check your Firebase project configuration
- Ensure Firestore database is created and accessible
- Verify authentication methods are enabled in Firebase Console

### API Key Issues
- Ensure Gemini API key is valid and has proper permissions
- Check API quotas and billing settings in Google Cloud Console

### Development Server Issues
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
npx vite --force

# Restart development server
npm run dev
```

## Future Enhancements
- Real-time misinformation alerts
- Browser extension for instant verification
- AI-powered sentiment analysis
-Multi-Modal Support
