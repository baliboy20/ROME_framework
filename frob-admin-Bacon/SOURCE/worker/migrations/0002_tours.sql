-- Increment 1 (TDR-WEB-01): tour catalogue becomes a first-class D1 table,
-- superseding the phantom R2 tours/catalogue.json. Realizes PRE01/PRE02/WEB01.

CREATE TABLE IF NOT EXISTS tours (
  id               TEXT PRIMARY KEY,               -- slug
  name             TEXT NOT NULL,
  tagline          TEXT NOT NULL,
  description      TEXT,
  duration_min     INTEGER NOT NULL,
  max_riders       INTEGER NOT NULL DEFAULT 10,
  difficulty       TEXT NOT NULL,                  -- Easy | Moderate | Challenging
  price_pence      INTEGER NOT NULL,
  badge            TEXT,                           -- Most Popular | First Timers | Summer Only | null
  route_highlights TEXT NOT NULL DEFAULT '[]',     -- JSON array of strings
  hero_image       TEXT,
  status           TEXT NOT NULL CHECK (status IN ('published','draft','archived')),
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tours_status ON tours(status);

INSERT OR IGNORE INTO tours
  (id, name, tagline, description, duration_min, max_riders, difficulty, price_pence, badge, route_highlights, hero_image, status, sort_order, created_at)
VALUES
  ('hidden-city', 'The Hidden City',
   'Discover secret corners and hidden alleyways of London that most visitors never see.',
   'A relaxed ride through the City''s quiet courts, gardens and lanes — the London most visitors walk straight past.',
   90, 10, 'Easy', 4500, 'Most Popular',
   '["Postman''s Park","Bleeding Heart Yard","Cloth Fair","Charterhouse Square"]',
   '/img/tours/hidden-city.png', 'published', 1, '2026-07-22T00:00:00Z'),
  ('icons-insights', 'Icons & Insights',
   'London''s greatest landmarks connected by bike — the ultimate first-timer tour.',
   'The big hitters, joined up on two wheels with the stories behind them — the perfect first ride.',
   120, 10, 'Moderate', 4500, 'First Timers',
   '["Tower of London","St Paul''s Cathedral","Westminster","Buckingham Palace"]',
   '/img/tours/icons-insights.png', 'published', 2, '2026-07-22T00:00:00Z'),
  ('golden-hour', 'Golden Hour City',
   'London at its most magical — a summer evening ride along the Thames as the sun sets.',
   'A golden-hour glide along the river as the city lights come up — our summer-evening signature.',
   150, 10, 'Moderate', 5500, 'Summer Only',
   '["Thames Embankment","St Paul''s at dusk","Millennium Bridge","South Bank at sunset"]',
   '/img/tours/golden-hour.png', 'published', 3, '2026-07-22T00:00:00Z');

-- Departure reconciliation: real departures under the new tour ids so the
-- booking flow works against the published catalogue.
INSERT OR IGNORE INTO departures (id, tour_id, date, time, capacity, held_count, confirmed_count, grace_period_minutes, guide_id, status) VALUES
  ('dep-hc-1','hidden-city','2026-07-25','09:30',10,0,0,15,'g-sam','scheduled'),
  ('dep-hc-2','hidden-city','2026-07-27','09:30',10,0,0,15,'g-priya','scheduled'),
  ('dep-hc-3','hidden-city','2026-08-01','09:30',10,0,0,15,'g-sam','scheduled'),
  ('dep-ii-1','icons-insights','2026-07-26','10:00',10,0,0,15,'g-priya','scheduled'),
  ('dep-ii-2','icons-insights','2026-07-29','10:00',10,0,0,15,'g-sam','scheduled'),
  ('dep-ii-3','icons-insights','2026-08-02','10:00',10,0,0,15,'g-priya','scheduled'),
  ('dep-gh-1','golden-hour','2026-07-28','18:30',10,0,0,15,'g-sam','scheduled'),
  ('dep-gh-2','golden-hour','2026-08-03','18:30',10,0,0,15,'g-priya','scheduled'),
  ('dep-gh-4','golden-hour','2026-08-09','18:30',10,0,0,15,'g-sam','scheduled');
