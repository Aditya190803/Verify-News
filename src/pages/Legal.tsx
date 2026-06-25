import { Link } from 'react-router-dom';
import Header from '@/components/Header';

const Legal = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="container max-w-2xl py-8 prose prose-neutral dark:prose-invert text-sm">
      <h1>Legal</h1>
      <h2>Privacy</h2>
      <p>
        We store account data via Stack Auth and optional verification history in Appwrite or Postgres
        when using the aggregation API. RSS ingestion stores headlines, summaries, and links only. Payments on hosted Verify News use Razorpay (INR). AI verify
        may send content to third-party models (OpenRouter, Google) when configured on the server.
      </p>
      <h2>Terms</h2>
      <p>
        Bias labels describe editorial leaning of outlets, not truth. AI verification is informational, not
        professional fact-checking. You are responsible for compliance when self-hosting.
      </p>
      <h2>Outlet ratings</h2>
      <p>
        Disputes: open a GitHub issue with outlet id and sources. See{' '}
        <Link to="/methodology">methodology</Link>.
      </p>
      <p>
        <Link to="/pricing">← Pricing</Link>
      </p>
    </main>
  </div>
);

export default Legal;