# Verify News

## Overview
Fake News Verifier is a React-based web application that checks the authenticity of news articlesc or headlines using web search and AI-powered analysis. The app integrates DuckDuckGo for web searches and Gemini LLM for AI-based fact-checking.

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

4. Start the development server:
   ```sh
   npm run dev
   ```

## Usage
- Enter a news headline or paste an article.
- Click **Verify News** to check authenticity.
- View results and **share verified information**.

## Tech Stack
- **Frontend:** React, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** Firebase
- **APIs:** Gemini LLM, Fact-checking sites

## Future Enhancements
- Real-time misinformation alerts
- Browser extension for instant verification
- AI-powered sentiment analysis
-Multi-Modal Support
