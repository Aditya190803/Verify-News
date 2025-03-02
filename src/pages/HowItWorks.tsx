
import React from 'react';
import Header from '@/components/Header';
import { 
  FileText, Image, Mic, Video, 
  Search, Brain, CheckCircle, ShieldCheck, 
  ArrowRight, HelpCircle 
} from 'lucide-react';

const HowItWorks = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center mb-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <HelpCircle className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-semibold tracking-tight animate-slide-down">How VerifyNews Works</h1>
              <p className="mt-4 text-lg text-foreground/60 leading-relaxed animate-slide-down" style={{ animationDelay: '50ms' }}>
                Our powerful AI-driven system verifies news content in seconds using trusted sources and advanced algorithms.
              </p>
            </div>

            <div className="space-y-16 mt-12">
              <section>
                <h2 className="text-2xl font-medium mb-8">The Verification Process</h2>
                
                <div className="space-y-12">
                  {[
                    {
                      step: 1,
                      title: "Submit Content",
                      description: "Paste a news article, upload an image of social media content, or share audio/video clips.",
                      icon: <FileText className="h-8 w-8 text-primary" />,
                      icons: [
                        <FileText key="text" className="h-5 w-5" />,
                        <Image key="image" className="h-5 w-5" />,
                        <Mic key="audio" className="h-5 w-5" />,
                        <Video key="video" className="h-5 w-5" />
                      ]
                    },
                    {
                      step: 2,
                      title: "AI Analysis",
                      description: "Our AI engine extracts key claims and searches across trusted sources and fact-checking websites.",
                      icon: <Brain className="h-8 w-8 text-primary" />,
                      detail: "We use advanced natural language processing to understand context and nuance."
                    },
                    {
                      step: 3,
                      title: "Source Verification",
                      description: "Content is cross-referenced against multiple reputable sources and fact-checking organizations.",
                      icon: <Search className="h-8 w-8 text-primary" />,
                      detail: "We maintain partnerships with leading fact-checking services worldwide."
                    },
                    {
                      step: 4,
                      title: "Results",
                      description: "Within seconds, you'll receive verification results with confidence scores and supporting evidence.",
                      icon: <CheckCircle className="h-8 w-8 text-primary" />,
                      detail: "Results are designed to be easy to understand and share."
                    }
                  ].map((step, index) => (
                    <div key={index} className="relative">
                      {index < 3 && (
                        <div className="absolute left-7 top-20 h-28 w-px bg-foreground/10"></div>
                      )}
                      <div className="flex gap-6">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center w-14 h-14 rounded-full glass-card">
                            {step.icon}
                          </div>
                        </div>
                        <div className="glass-card p-6 flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-medium">
                              Step {step.step}
                            </div>
                            <h3 className="text-xl font-medium">{step.title}</h3>
                          </div>
                          <p className="text-foreground/70 mb-4">{step.description}</p>
                          
                          {step.icons && (
                            <div className="flex gap-4 mt-4">
                              {step.icons.map((icon, i) => (
                                <div key={i} className="p-3 rounded-lg bg-foreground/5 flex items-center justify-center">
                                  {icon}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {step.detail && (
                            <p className="text-sm text-foreground/50 mt-3 italic">
                              {step.detail}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="glass-card p-8">
                <h2 className="text-2xl font-medium mb-6">Technology Behind VerifyNews</h2>
                <p className="text-foreground/80 leading-relaxed mb-6">
                  VerifyNews combines several advanced technologies to provide accurate verification:
                </p>
                <ul className="space-y-4 text-foreground/80">
                  <li className="flex items-start gap-3">
                    <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Natural Language Processing (NLP) to understand the meaning and context of text</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Computer vision for analyzing images and extracting text from visual content</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Speech-to-text conversion for analyzing audio and video content</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Machine learning algorithms that continually improve verification accuracy</span>
                  </li>
                </ul>
              </section>

              <div className="text-center">
                <a href="/" className="glass-button inline-flex items-center justify-center gap-2">
                  Try VerifyNews Now
                  <ShieldCheck className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="py-6 border-t border-foreground/5">
        <div className="container max-w-6xl mx-auto px-4 text-center text-sm text-foreground/40">
          VerifyNews &copy; {new Date().getFullYear()} — A tool for truth in the digital age
        </div>
      </footer>
    </div>
  );
};

export default HowItWorks;
