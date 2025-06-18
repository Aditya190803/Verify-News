
import React from 'react';
import Header from '@/components/Header';
import { 
  FileText, Image, Mic, Video, 
  Search, Brain, CheckCircle, ShieldCheck, 
  ArrowRight, HelpCircle 
} from 'lucide-react';

const HowItWorks = () => {
  return (    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-4 sm:py-8">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="mb-6 sm:mb-8 text-center">
              <div className="inline-flex items-center justify-center mb-3 sm:mb-4">
                <div className="rounded-full bg-primary/10 p-2 sm:p-3">
                  <HelpCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight animate-slide-down">How VerifyNews Works</h1>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg text-foreground/60 leading-relaxed animate-slide-down px-2 sm:px-0" style={{ animationDelay: '50ms' }}>
                Our powerful AI-driven system verifies news content in seconds using trusted sources and advanced algorithms.
              </p>
            </div>            <div className="space-y-12 sm:space-y-16 mt-8 sm:mt-12">
              <section>
                <h2 className="text-xl sm:text-2xl font-medium mb-6 sm:mb-8 text-center sm:text-left">The Verification Process</h2>
                
                <div className="space-y-8 sm:space-y-12">
                  {[
                    {
                      step: 1,
                      title: "Submit Content",
                      description: "Paste a news article, upload an image of social media content, or share audio/video clips.",
                      icon: <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />,
                      icons: [
                        <FileText key="text" className="h-4 w-4 sm:h-5 sm:w-5" />,
                        <Image key="image" className="h-4 w-4 sm:h-5 sm:w-5" />,
                        <Mic key="audio" className="h-4 w-4 sm:h-5 sm:w-5" />,
                        <Video key="video" className="h-4 w-4 sm:h-5 sm:w-5" />
                      ]
                    },
                    {
                      step: 2,
                      title: "AI Analysis",
                      description: "Our AI engine extracts key claims and searches across trusted sources and fact-checking websites.",
                      icon: <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />,
                      detail: "We use advanced natural language processing to understand context and nuance."
                    },
                    {
                      step: 3,
                      title: "Source Verification",
                      description: "Content is cross-referenced against multiple reputable sources and fact-checking organizations.",
                      icon: <Search className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />,
                      detail: "We maintain partnerships with leading fact-checking services worldwide."
                    },
                    {
                      step: 4,
                      title: "Results",
                      description: "Within seconds, you'll receive verification results with confidence scores and supporting evidence.",
                      icon: <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />,
                      detail: "Results are designed to be easy to understand and share."
                    }
                  ].map((step, index) => (
                    <div key={index} className="relative">
                      {index < 3 && (
                        <div className="absolute left-5 sm:left-7 top-16 sm:top-20 h-20 sm:h-28 w-px bg-foreground/10"></div>
                      )}
                      <div className="flex gap-4 sm:gap-6">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-full glass-card">
                            {step.icon}
                          </div>
                        </div>
                        <div className="glass-card p-4 sm:p-6 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <div className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-medium w-fit">
                              Step {step.step}
                            </div>
                            <h3 className="text-lg sm:text-xl font-medium">{step.title}</h3>
                          </div>
                          <p className="text-foreground/70 mb-4 text-sm sm:text-base">{step.description}</p>
                          
                          {step.icons && (
                            <div className="flex gap-3 sm:gap-4 mt-4">
                              {step.icons.map((icon, i) => (
                                <div key={i} className="p-2 sm:p-3 rounded-lg bg-foreground/5 flex items-center justify-center">
                                  {icon}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {step.detail && (
                            <p className="text-xs sm:text-sm text-foreground/50 mt-3 italic">
                              {step.detail}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>              <section className="glass-card p-4 sm:p-6 lg:p-8">
                <h2 className="text-xl sm:text-2xl font-medium mb-4 sm:mb-6">Technology Behind VerifyNews</h2>
                <p className="text-foreground/80 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">
                  VerifyNews combines several advanced technologies to provide accurate verification:
                </p>
                <ul className="space-y-3 sm:space-y-4 text-foreground/80">
                  <li className="flex items-start gap-3">
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base">Natural Language Processing (NLP) to understand the meaning and context of text</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base">Computer vision for analyzing images and extracting text from visual content</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base">Speech-to-text conversion for analyzing audio and video content</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base">Machine learning algorithms that continually improve verification accuracy</span>
                  </li>
                </ul>
              </section>

              <div className="text-center">
                <a href="/" className="glass-button inline-flex items-center justify-center gap-2 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3">
                  Try VerifyNews Now
                  <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="py-4 sm:py-6 border-t border-foreground/5">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs sm:text-sm text-foreground/40">
          VerifyNews &copy; {new Date().getFullYear()} — A tool for truth in the digital age
        </div>
      </footer>
    </div>
  );
};

export default HowItWorks;
