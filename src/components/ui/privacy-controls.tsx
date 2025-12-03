import { useState } from 'react';
import { Lock, Unlock, Check } from 'lucide-react';
import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { Badge } from './badge';
import { useToast } from '@/hooks/use-toast';
import { updateVerificationPrivacy } from '@/services/appwriteService';
import { cn } from '@/lib/utils';

interface PrivacyToggleProps {
  slug: string;
  userId: string;
  currentIsPublic: boolean;
  onPrivacyChange?: (isPublic: boolean) => void;
  className?: string;
}

export const PrivacyToggle = ({
  slug,
  userId,
  currentIsPublic,
  onPrivacyChange,
  className,
}: PrivacyToggleProps) => {
  const [isPublic, setIsPublic] = useState(currentIsPublic);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleToggle = async () => {
    setLoading(true);
    try {
      const newIsPublic = !isPublic;
      const success = await updateVerificationPrivacy(slug, userId, newIsPublic);
      
      if (success) {
        setIsPublic(newIsPublic);
        onPrivacyChange?.(newIsPublic);
        toast({
          title: 'Privacy Updated',
          description: `Verification is now ${newIsPublic ? 'public' : 'private'}`,
        });
        setOpen(false);
      } else {
        toast({
          title: 'Failed to Update',
          description: 'Could not update privacy settings. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating privacy:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('flex items-center gap-2', className)}
        >
          {isPublic ? (
            <>
              <Unlock className="h-4 w-4" />
              <span className="hidden sm:inline">Public</span>
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Private</span>
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Privacy Settings</DialogTitle>
          <DialogDescription>
            {isPublic
              ? 'Your verification is currently public. Anyone can view it on the feed and share the link.'
              : 'Your verification is currently private. Only you can access it through your history.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-4">
            <div
              className={cn(
                'rounded-lg border p-4 cursor-pointer transition-all',
                isPublic ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              )}
              onClick={() => {}}
            >
              <div className="flex items-start gap-3">
                <Unlock className="h-5 w-5 mt-0.5 text-primary" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">Public</h4>
                    {isPublic && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Appears in public feed, shareable link, searchable by others
                  </p>
                </div>
              </div>
            </div>

            <div
              className={cn(
                'rounded-lg border p-4 cursor-pointer transition-all',
                !isPublic ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              )}
              onClick={() => {}}
            >
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 mt-0.5 text-primary" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">Private</h4>
                    {!isPublic && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Only visible to you, not shown in feed or search results
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleToggle} disabled={loading}>
            {loading ? (
              'Updating...'
            ) : (
              <>
                Make {isPublic ? 'Private' : 'Public'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface PrivacyBadgeProps {
  isPublic: boolean;
  className?: string;
}

export const PrivacyBadge = ({ isPublic, className }: PrivacyBadgeProps) => {
  return (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-1',
        isPublic ? 'border-success/30 bg-success/10 text-success' : 'border-muted bg-muted text-muted-foreground',
        className
      )}
    >
      {isPublic ? (
        <>
          <Unlock className="h-3 w-3" />
          Public
        </>
      ) : (
        <>
          <Lock className="h-3 w-3" />
          Private
        </>
      )}
    </Badge>
  );
};
