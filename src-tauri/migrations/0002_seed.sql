-- Seed data so the app is usable from first run.
-- Explicit ids are used (rather than autoincrement) so leaf categories can
-- reference their group's parent_id deterministically in the same script.

INSERT INTO accounts (id, name, type, currency, opening_balance, sort_order)
VALUES (1, 'Main Account', 'checking', 'MYR', 0, 0);

-- Category groups (parent_id NULL)
INSERT INTO categories (id, name, parent_id, kind, sort_order) VALUES
  (1, 'Income',    NULL, 'income',  0),
  (2, 'Food',      NULL, 'expense', 1),
  (3, 'Transport', NULL, 'expense', 2),
  (4, 'Housing',   NULL, 'expense', 3),
  (5, 'Other',     NULL, 'expense', 4);

-- Leaf categories
INSERT INTO categories (id, name, parent_id, kind, sort_order) VALUES
  (6,  'Salary',         1, 'income',  0),
  (7,  'Other Income',   1, 'income',  1),
  (8,  'Groceries',      2, 'expense', 0),
  (9,  'Dining Out',     2, 'expense', 1),
  (10, 'Fuel',           3, 'expense', 0),
  (11, 'Public Transit', 3, 'expense', 1),
  (12, 'Rent',           4, 'expense', 0),
  (13, 'Utilities',      4, 'expense', 1),
  (14, 'Miscellaneous',  5, 'expense', 0);

INSERT INTO settings (key, value) VALUES
  ('budgeting_mode', 'available'),
  ('sweep_rule', 'net');
