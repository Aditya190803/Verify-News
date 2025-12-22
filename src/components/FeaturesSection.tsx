

export const FeaturesSection = () => {
  return (
    <div className="w-full bg-muted/40 border-t border-border/50 mt-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-12">
          How it works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <span className="text-2xl font-bold text-primary">1</span>
            </div>
            <h3 className="text-lg font-semibold mb-3">Share content</h3>
            <p className="text-muted-foreground leading-relaxed">
              Paste a link, article text, or any claim you want to verify
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <span className="text-2xl font-bold text-primary">2</span>
            </div>
            <h3 className="text-lg font-semibold mb-3">We analyze</h3>
            <p className="text-muted-foreground leading-relaxed">
              Our AI cross-references with trusted news sources and fact-checkers
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <span className="text-2xl font-bold text-primary">3</span>
            </div>
            <h3 className="text-lg font-semibold mb-3">Get the truth</h3>
            <p className="text-muted-foreground leading-relaxed">
              See a clear verdict with sources you can check yourself
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;
