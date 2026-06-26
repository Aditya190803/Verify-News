import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval('ingest feed rss then exa', { minutes: 15 }, internal.feedPoll.ingestFeed);

export default crons;