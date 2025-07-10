
import React from 'react';
import Header from '@/components/Header';
import { Shield, Globe, Newspaper, Scale, Zap, User, Building2 } from 'lucide-react';

const About = () => {
  return (    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-4 sm:py-8">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="mb-6 sm:mb-8 text-center">
              <div className="inline-flex items-center justify-center mb-3 sm:mb-4">
                <div className="rounded-full bg-primary/10 p-2 sm:p-3">
                  <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight animate-slide-down">About VerifyNews</h1>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg text-foreground/60 leading-relaxed animate-slide-down px-2 sm:px-0" style={{ animationDelay: '50ms' }}>
                Our mission is to combat misinformation and help people verify the accuracy of news in the digital age.
              </p>
            </div>            <div className="space-y-8 sm:space-y-12 mt-8 sm:mt-12">
              <section className="glass-card p-4 sm:p-6 lg:p-8">
                <h2 className="text-xl sm:text-2xl font-medium mb-4 sm:mb-6">Our Story</h2>
                <p className="text-foreground/80 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">
                  VerifyNews was founded with a simple but powerful goal to provide everyone with the tools to verify 
                  information before believing or sharing it. In today's information-saturated world, distinguishing 
                  fact from fiction has become increasingly challenging.
                </p>
                <p className="text-foreground/80 leading-relaxed text-sm sm:text-base">
                  We've built a platform that leverages cutting-edge AI technology and trusted sources to help 
                  users verify news articles, social media posts, and other content quickly and accurately.
                </p>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-medium mb-6 sm:mb-8 text-center sm:text-left">What Sets Us Apart</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {[
                    {
                      icon: <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />,
                      title: "Trustworthy Verification",
                      description: "Our verification engine checks against multiple reliable sources for maximum accuracy."
                    },
                    {
                      icon: <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />,
                      title: "Instant Results",
                      description: "Get verification results in seconds, not minutes or hours."                    },
                    {
                      icon: <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />,
                      title: "Global Coverage",
                      description: "We verify news from sources around the world across multiple languages."
                    },
                    {
                      icon: <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />,
                      title: "User Privacy",
                      description: "We respect your privacy and don't store personal data without permission."
                    },
                  ].map((feature, index) => (
                    <div key={index} className="glass-card p-4 sm:p-6 flex flex-col h-full">
                      <div className="rounded-full bg-primary/10 p-2 w-fit mb-3 sm:mb-4">
                        {feature.icon}
                      </div>
                      <h3 className="text-base sm:text-lg font-medium mb-2">{feature.title}</h3>
                      <p className="text-foreground/70 text-sm sm:text-base">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="glass-card p-4 sm:p-6 lg:p-8">
                <h2 className="text-xl sm:text-2xl font-medium mb-4 sm:mb-6">Our Team</h2>
                <p className="text-foreground/80 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">
                  VerifyNews is built by a passionate team of technologists, journalists, and information science experts 
                  who believe in the power of verified information to strengthen democracy and promote truth.
                </p>
                <p className="text-foreground/80 leading-relaxed text-sm sm:text-base">
                  We're constantly working to improve our verification technology and expand our capabilities to 
                  support more types of content and sources.
                </p>
              </section>
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

export default About;
