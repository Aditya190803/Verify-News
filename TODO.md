# VerifyNews - TODO & Roadmap

## 🟠 Priority 2: High (Should Do Soon)

### Features to Add
- [ ] **Settings Page** - User preferences (theme, notifications, privacy)
- [ ] **Keyboard Shortcuts** - Power user navigation (Ctrl+K for search, etc.)
- [ ] **Multi-language Support** - i18n for Hindi, Spanish, etc.

### Work to Do
- [ ] **API Rate Limiting UI** - Show rate limit status to users
- [ ] **Better Search Results Ranking** - Improve relevance scoring algorithm
- [ ] **Verification Result Caching** - Cache results to reduce API calls
- [ ] **Progressive Web App (PWA)** - Full PWA support with service worker

### Code Quality Improvements
- [ ] **Add JSDoc comments** - Document all public functions and components
- [ ] **Create component prop types** - Extract interface definitions to separate files
- [ ] **Add accessibility attributes** - ARIA labels, roles, keyboard navigation
- [ ] **Improve error messages** - More descriptive error messages for users

---

## 🟡 Priority 3: Medium (Nice to Have)

### Features to Add
- [ ] **Browser Extension** - Chrome/Firefox extension for quick verification
- [ ] **Real-time Alerts** - WebSocket for trending misinformation alerts
- [ ] **Sentiment Analysis** - Analyze emotional tone of news articles
- [ ] **Fact-check Comparison** - Compare results with other fact-checkers
- [ ] **Community Voting** - Allow users to vote on verification accuracy
- [ ] **News Feed Filters** - Filter by category, source, date range
- [ ] **Bookmark Verifications** - Save interesting verifications for later
- [ ] **Verification Badges** - Show trust badges for reliable sources

### Work to Do
- [ ] **Performance Optimization** - Lazy load images, optimize bundle size
- [ ] **SEO Improvements** - Dynamic meta tags for verification results
- [ ] **Analytics Dashboard Enhancement** - More detailed user stats
- [ ] **Mobile App Preparation** - React Native sharing code structure

### Tech Debt to Solve
- [ ] **Split large components** - Break down Index.tsx, Dashboard.tsx into smaller components
- [ ] **Create custom hooks** - Extract common logic into reusable hooks
- [ ] **Optimize re-renders** - Use React.memo and useCallback appropriately
- [ ] **Database query optimization** - Add indexes, optimize Appwrite queries

### Test Cases to Make
- [ ] **Integration tests** - End-to-end verification flow
- [ ] **API mock tests** - Test with mocked external APIs
- [ ] **Accessibility tests** - Automated a11y testing
- [ ] **Performance tests** - Bundle size and load time benchmarks
- [ ] **LoginForm.test.tsx** - Test login form validation
- [ ] **SignupForm.test.tsx** - Test signup form validation

### Code Quality Improvements
- [ ] **Consistent naming conventions** - Standardize file and variable naming
- [ ] **Create shared utilities** - Common helper functions
- [ ] **Implement design system tokens** - Use design tokens consistently
- [ ] **Add Storybook** - Component documentation and testing

---

## 🟢 Priority 4: Low (Future Considerations)

### Features to Add
- [ ] **AI-powered Suggestions** - Suggest related verifications
- [ ] **Source Credibility Scores** - Rate news sources over time
- [ ] **Collaborative Verification** - Multiple users verify same content
- [ ] **API for Third Parties** - Public API for developers
- [ ] **Telegram/Discord Bot** - Verification via messaging platforms
- [ ] **News Source Database** - Curated database of reliable sources
- [ ] **Verification Widget** - Embed widget for websites

### Work to Do
- [ ] **Microservices Architecture** - Separate verification into microservices
- [ ] **Machine Learning Model** - Train custom model for verification
- [ ] **CDN Integration** - Serve static assets via CDN
- [ ] **Multi-region Deployment** - Deploy to multiple regions

### Tech Debt to Solve
- [ ] **Upgrade all dependencies** - Keep packages up to date
- [ ] **Add code comments** - Document complex business logic
- [ ] **Create architecture documentation** - Document system design

### Known Issues
1. Ad blockers may block Appwrite requests
2. Gemini API rate limits on free tier
3. Some toast notifications may duplicate
4. Media verification for large files may timeout