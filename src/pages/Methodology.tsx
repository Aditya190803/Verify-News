import { Link } from 'react-router-dom';
import Header from '@/components/Header';

const Methodology = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="container max-w-2xl py-8 prose prose-neutral dark:prose-invert">
      <h1>Bias &amp; coverage methodology</h1>
      <p>
        Verify News shows <strong>how different outlets cover the same story</strong>, not whether a
        story is true. Fact-checking is a separate step (AI verify).
      </p>
      <h2>Outlet labels</h2>
      <p>
        Each publisher in our seed list has a <code>bias_label</code> (left, center-left, center,
        center-right, right) and optional <code>factuality</code> tier. Labels come from manual curation
        aligned with public rating organizations (e.g. AllSides, Media Bias/Fact Check) and are
        versioned in <code>apps/api/data/outlets.seed.json</code>.
      </p>
      <h2>Coverage bar</h2>
      <p>
        For each story cluster, we count how many linked articles belong to each bias bucket and show
        that distribution as a bar. More sources on one side means heavier coverage from that
        perspective—not a verdict on accuracy.
      </p>
      <h2>Story matching</h2>
      <p>
        New RSS items are grouped when headlines are similar (token overlap) and published within the
        same day. This is a simple heuristic; false splits and false merges can occur.
      </p>
      <h2>Corrections</h2>
      <p>
        Outlet owners or readers can request label updates via the project issue tracker. We do not
        claim infallible bias scores.
      </p>
      <p>
        <Link to="/feed">← Story feed</Link>
      </p>
    </main>
  </div>
);

export default Methodology;