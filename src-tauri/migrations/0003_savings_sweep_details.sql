-- Captures the rule active and whether the clamp kicked in at the moment a
-- sweep was recorded, so the Savings page's sweep history can show them
-- later — the sweep_rule setting is global and can change over time, so
-- without this a past sweep's rule would be unrecoverable. Existing rows
-- backfill to the app's default rule and "not clamped", the closest honest
-- guess for history that predates this column.
ALTER TABLE savings_sweeps ADD COLUMN rule TEXT NOT NULL DEFAULT 'net';
ALTER TABLE savings_sweeps ADD COLUMN clamped INTEGER NOT NULL DEFAULT 0;
