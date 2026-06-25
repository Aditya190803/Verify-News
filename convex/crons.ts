import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval('poll rss feeds', { minutes: 15 }, internal.rss.pollAll);

export default crons;