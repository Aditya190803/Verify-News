import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import VerificationResult from '@/components/VerificationResult';
import { useNews } from '@/context/NewsContext';
import { getVerificationBySlug, VerificationDocument } from '@/services/appwriteService';
import { VerificationResult as VerificationResultType } from '@/types/news';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { PrivacyToggle } from '@/components/ui/privacy-controls';
import { ShareButtons } from '@/components/ui/share-buttons';
import { SEO } from '@/components/SEO';
import { SkeletonResultPage } from '@/components/ui/skeleton-loaders';

const Results = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { result: contextResult, status: contextStatus, setResult, setStatus, resetState, setSearchQuery, setNewsContent } = useNews();
  const { currentUser } = useAuth();
  const { slug } = useParams();
  
  // Prefer slug from /result/:slug, fallback to search param
  const urlSlug = slug || searchParams.get('slug');
  
  // Initialize loading to true if we have a slug to fetch
  const [loading, setLoading] = useState(!!urlSlug);
  const [fetchedResult, setFetchedResult] = useState<VerificationResultType | null>(null);
  const [fetchedQuery, setFetchedQuery] = useState('');
  const [verificationData, setVerificationData] = useState<VerificationDocument | null>(null);

  const query = searchParams.get('q') || fetchedQuery;

  // Fetch result by slug if present
  useEffect(() => {
    if (urlSlug) {
      setLoading(true);
      getVerificationBySlug(urlSlug)
        .then((data) => {
          if (data && data.result) {
            // result is stored as a JSON string in Appwrite; parse if necessary
            let parsedResult: VerificationResultType | null = null;
            try {
              parsedResult = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
            } catch (e) {
              console.warn('Failed to parse verification result JSON:', e);
            }

            setFetchedResult(parsedResult);
            setFetchedQuery(data.query || '');
            setVerificationData(data); // Store full verification data

            if (parsedResult) {
              setResult(parsedResult);
              setStatus('verified');
            } else {
              setStatus('error');
            }

            // Set the original query/content in context for VerificationResult component
            setSearchQuery(data.query || '');
            setNewsContent(data.content || data.query || '');
          } else {
            setFetchedResult(null);
            setStatus('error');
          }
        })
        .catch((error) => {
          console.error('Error fetching by slug:', error);
          setFetchedResult(null);
          setStatus('error');
        })
        .finally(() => setLoading(false));
    }
  }, [urlSlug, setResult, setStatus]);

  const result = urlSlug ? fetchedResult : contextResult;
  const status = urlSlug ? (loading ? 'verifying' : (fetchedResult ? 'verified' : 'error')) : contextStatus;

  useEffect(() => {
    // If no query or result, redirect to home
    if (!urlSlug && (!query || (!result && status !== 'verifying'))) {
      navigate('/', { replace: true });
    }
  }, [urlSlug, query, result, status, navigate]);

  const handleBack = () => {
    resetState();
    navigate('/', { replace: true });
  };

  if (!urlSlug && !query) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {urlSlug && verificationData && verificationData.isPublic !== false && (
              <ShareButtons
                url={`/result/${urlSlug}`}
                title={verificationData.title || verificationData.query || 'Verification Result'}
                description={verificationData.result ? 
                  JSON.parse(verificationData.result).explanation?.substring(0, 200) : 
                  'Check out this fact-checked verification on VerifyNews'}
              />
            )}
            
            {currentUser && verificationData && verificationData.userId === currentUser.uid && urlSlug && (
              <PrivacyToggle
                slug={urlSlug}
                userId={currentUser.uid}
                currentIsPublic={verificationData.isPublic ?? true}
                onPrivacyChange={(isPublic) => {
                  setVerificationData((prev: VerificationDocument | null) => prev ? { ...prev, isPublic } : prev);
                }}
              />
            )}
          </div>
        </div>
        
        {/* SEO Meta Tags */}
        {urlSlug && verificationData && (
          <SEO
            title={verificationData.title || verificationData.query || 'Verification Result'}
            description={verificationData.result ? 
              JSON.parse(verificationData.result).explanation?.substring(0, 160) || 'Fact-checked verification result' :
              'Fact-checked verification result'}
            url={`/result/${urlSlug}`}
            type="article"
            article={{
              publishedTime: verificationData.timestamp,
              tags: verificationData.veracity ? [verificationData.veracity] : undefined,
            }}
          />
        )}
        
        {/* Result Content */}
        <div className="space-y-6">
          {status === 'verifying' && (
            <SkeletonResultPage />
          )}
          
          {status === 'verified' && result && <VerificationResult />}
          
          {status === 'error' && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Result not found or unavailable.</p>
              <Button onClick={handleBack}>
                Go back home
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Results;
