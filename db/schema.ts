import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
// This table is shared by every game release. Never reset it when publishing.
export const leaderboardScores=sqliteTable('leaderboard_scores',{
  id:text('id').primaryKey(),
  name:text('name').notNull(),
  score:integer('score').notNull(),
  wave:integer('wave').notNull(),
  kills:integer('kills').notNull(),
  duration:integer('duration').notNull(),
  version:text('version').notNull(),
  curseRank:integer('curse_rank').notNull().default(0),
  curseTitle:text('curse_title').notNull().default('Uncursed'),
  createdAt:integer('created_at').notNull(),
},t=>[index('leaderboard_ranking_idx').on(t.score,t.wave,t.kills,t.createdAt)]);
// v214: Dead Tide's own board (spec 12), apart from the mansion's. Shared by every release too.
export const deadTideScores=sqliteTable('dead_tide_scores',{
  id:text('id').primaryKey(),
  mode:text('mode').notNull().default('dead-tide'),
  name:text('name').notNull(),
  kills:integer('kills').notNull(),
  threatLevel:integer('threat_level').notNull(),
  threatRank:text('threat_rank').notNull(),
  duration:integer('duration').notNull(),
  score:integer('score').notNull(),
  headshots:integer('headshots').notNull().default(0),
  version:text('version').notNull(),
  createdAt:integer('created_at').notNull(),
},t=>[index('dead_tide_ranking_idx').on(t.kills,t.threatLevel,t.duration,t.createdAt)]);
