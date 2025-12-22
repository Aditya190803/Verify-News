
import { Link } from 'react-router-dom';
import { APP_METADATA } from '@/lib/constants';

export const Footer = () => {
  return (
    <footer className="py-8 border-t border-border/50 bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {APP_METADATA.NAME}. Built for truth.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
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
  );
};

export default Footer;
