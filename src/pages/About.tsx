

import Header from '@/components/Header';
import { Link } from 'react-router-dom';
import { Shield, Globe, Zap, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-muted/30 border-b border-border/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              Fighting misinformation,<br />one fact at a time
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              VerifyNews was built to give everyone the power to verify information before believing or sharing it.
            </p>
          </div>
        </div>

        {/* Story Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold mb-6">Our story</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              In today's world of viral content and instant sharing, it's harder than ever to know what's true. 
              We built VerifyNews because we believe everyone deserves access to accurate information—without 
              spending hours fact-checking on their own.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our platform combines AI technology with trusted sources to help you verify news articles, 
              social media posts, and claims quickly and reliably. No expertise required.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="bg-muted/30 border-y border-border/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
            <h2 className="text-2xl font-semibold text-center mb-12">What makes us different</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  icon: <Shield className="h-5 w-5" />,
                  title: "Trustworthy verification",
                  description: "We check against multiple reliable sources, not just one."
                },
                {
                  icon: <Zap className="h-5 w-5" />,
                  title: "Fast results",
                  description: "Get answers in seconds, not hours of research."
                },
                {
                  icon: <Globe className="h-5 w-5" />,
                  title: "Global coverage",
                  description: "We verify news from sources around the world."
                },
                {
                  icon: <User className="h-5 w-5" />,
                  title: "Privacy first",
                  description: "Your searches are yours. We don't sell your data."
                },
              ].map((feature, index) => (
                <div key={index} className="bg-card border border-border rounded-xl p-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <span className="text-primary">{feature.icon}</span>
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold mb-4">Ready to try it?</h2>
          <p className="text-muted-foreground mb-8">Start verifying news in seconds.</p>
          <Link to="/">
            <Button size="lg" className="group">
              Start verifying
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </main>
      
      <footer className="py-8 border-t border-border/50 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} VerifyNews
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                How it works
              </Link>
              <Link to="/feed" className="text-muted-foreground hover:text-foreground transition-colors">
                Feed
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
