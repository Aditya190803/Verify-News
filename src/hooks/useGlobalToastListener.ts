import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export function useGlobalToastListener() {
  useEffect(() => {
    function handleShowToast(e: CustomEvent) {
      if (e.detail && (e.detail.title || e.detail.description)) {
        toast({
          title: e.detail.title,
          description: e.detail.description,
          duration: 3000,
        });
      }
    }
    window.addEventListener('show-toast', handleShowToast as EventListener);
    return () => {
      window.removeEventListener('show-toast', handleShowToast as EventListener);
    };
  }, []);
}
