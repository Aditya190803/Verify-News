import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    logger.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4 sm:px-6 max-w-md mx-auto">
        <div className="inline-flex items-center justify-center mb-6">
          <div className="rounded-full bg-primary/10 p-3 sm:p-4">
            <AlertTriangle className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
          </div>
        </div>
        
        <h1 className="text-6xl sm:text-8xl font-bold mb-4 text-foreground/80">404</h1>
        <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-foreground">Page Not Found</h2>
        <p className="text-sm sm:text-base text-foreground/60 mb-8 leading-relaxed">
          Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>
        
        <Button 
          asChild 
          className="bg-primary text-primary-foreground rounded-lg px-6 py-3 inline-flex items-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all"
        >
          <a href="/">
            <Home className="h-4 w-4" />
            Return to Home
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
