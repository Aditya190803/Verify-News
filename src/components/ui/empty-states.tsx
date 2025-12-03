import { 
  Search, 
  FileText, 
  History, 
  BookmarkX, 
  InboxIcon, 
  ShieldCheck,
  TrendingUp,
  Plus,
  Upload,
} from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      {icon && (
        <div className="mb-4 rounded-full bg-muted p-4">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">{description}</p>
      {action && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={action.onClick} variant="default">
            {action.icon}
            {action.label}
          </Button>
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant="outline">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

interface NoResultsEmptyStateProps {
  searchQuery?: string;
  onReset?: () => void;
  onNewSearch?: () => void;
}

export const NoResultsEmptyState = ({ 
  searchQuery, 
  onReset, 
  onNewSearch 
}: NoResultsEmptyStateProps) => {
  return (
    <EmptyState
      icon={<Search className="h-8 w-8 text-muted-foreground" />}
      title="No results found"
      description={
        searchQuery
          ? `We couldn't find any results for "${searchQuery}". Try adjusting your search or filters.`
          : "We couldn't find any results. Try adjusting your search or filters."
      }
      action={
        onNewSearch
          ? {
              label: 'New Search',
              onClick: onNewSearch,
              icon: <Search className="mr-2 h-4 w-4" />,
            }
          : undefined
      }
      secondaryAction={
        onReset
          ? {
              label: 'Clear Filters',
              onClick: onReset,
            }
          : undefined
      }
    />
  );
};

interface NoHistoryEmptyStateProps {
  onStartVerification?: () => void;
}

export const NoHistoryEmptyState = ({ onStartVerification }: NoHistoryEmptyStateProps) => {
  return (
    <EmptyState
      icon={<History className="h-8 w-8 text-muted-foreground" />}
      title="No history yet"
      description="Your verification history will appear here. Start verifying news to build your history."
      action={
        onStartVerification
          ? {
              label: 'Verify News',
              onClick: onStartVerification,
              icon: <ShieldCheck className="mr-2 h-4 w-4" />,
            }
          : undefined
      }
    />
  );
};

interface NoBookmarksEmptyStateProps {
  onExplore?: () => void;
}

export const NoBookmarksEmptyState = ({ onExplore }: NoBookmarksEmptyStateProps) => {
  return (
    <EmptyState
      icon={<BookmarkX className="h-8 w-8 text-muted-foreground" />}
      title="No bookmarks yet"
      description="Save important verifications to quickly access them later."
      action={
        onExplore
          ? {
              label: 'Explore Feed',
              onClick: onExplore,
              icon: <TrendingUp className="mr-2 h-4 w-4" />,
            }
          : undefined
      }
    />
  );
};

interface NoContentEmptyStateProps {
  type?: 'articles' | 'verifications' | 'feed' | 'generic';
  onAction?: () => void;
  actionLabel?: string;
}

export const NoContentEmptyState = ({ 
  type = 'generic', 
  onAction, 
  actionLabel 
}: NoContentEmptyStateProps) => {
  const configs = {
    articles: {
      icon: <FileText className="h-8 w-8 text-muted-foreground" />,
      title: 'No articles found',
      description: 'We couldn\'t find any articles matching your criteria.',
    },
    verifications: {
      icon: <ShieldCheck className="h-8 w-8 text-muted-foreground" />,
      title: 'No verifications yet',
      description: 'Start verifying news to see your verifications here.',
    },
    feed: {
      icon: <TrendingUp className="h-8 w-8 text-muted-foreground" />,
      title: 'Nothing to show yet',
      description: 'Check back later for the latest verifications from the community.',
    },
    generic: {
      icon: <InboxIcon className="h-8 w-8 text-muted-foreground" />,
      title: 'Nothing here yet',
      description: 'This space is empty for now. Start exploring to fill it up!',
    },
  };

  const config = configs[type];

  return (
    <EmptyState
      icon={config.icon}
      title={config.title}
      description={config.description}
      action={
        onAction
          ? {
              label: actionLabel || 'Get Started',
              onClick: onAction,
              icon: <Plus className="mr-2 h-4 w-4" />,
            }
          : undefined
      }
    />
  );
};

interface UploadEmptyStateProps {
  onUpload: () => void;
  acceptedFormats?: string;
}

export const UploadEmptyState = ({ 
  onUpload, 
  acceptedFormats = 'Images, PDFs, or text files' 
}: UploadEmptyStateProps) => {
  return (
    <EmptyState
      icon={<Upload className="h-8 w-8 text-muted-foreground" />}
      title="Upload a file"
      description={`Drag and drop your file here, or click to browse. ${acceptedFormats} accepted.`}
      action={{
        label: 'Choose File',
        onClick: onUpload,
        icon: <Upload className="mr-2 h-4 w-4" />,
      }}
    />
  );
};

interface CompactEmptyStateProps {
  message: string;
  icon?: React.ReactNode;
  className?: string;
}

export const CompactEmptyState = ({ 
  message, 
  icon, 
  className 
}: CompactEmptyStateProps) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-6 text-center', className)}>
      {icon && (
        <div className="mb-2 text-muted-foreground">
          {icon}
        </div>
      )}
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};
