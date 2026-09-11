/* ============================================================
   NOW-or-NEVER — BORDER COSMETICS
   ------------------------------------------------------------
   Run this in Supabase SQL Editor once.
   Borders use the dedicated user_cosmetics slot: border.
   Existing items are preserved by ON CONFLICT DO NOTHING.
   ============================================================ */

INSERT INTO public.shop_catalog
  (item_id, category, item_name, description, price, kind, preview)
VALUES
  ('border_starter',
   'borders',
   'Starter Border',
   'A clean frame for your student identity.',
   0,
   'border',
   '▣'),

  ('border_violet_pulse',
   'borders',
   'Violet Pulse',
   'A soft violet border with a living glow.',
   150,
   'border',
   '✦'),

  ('border_neon_grid',
   'borders',
   'Neon Grid',
   'A sharp cyber-study frame.',
   300,
   'border',
   '▦'),

  ('border_scholar_frame',
   'borders',
   'Scholar Frame',
   'A refined academic frame.',
   450,
   'border',
   '◇'),

  ('border_flame',
   'borders',
   'Flame Border',
   'A hot animated frame for serious grinders.',
   650,
   'border',
   '🔥'),

  ('border_galaxy',
   'borders',
   'Galaxy Border',
   'A deep-space frame with a premium glow.',
   900,
   'border',
   '✧'),

  ('border_storm',
   'borders',
   'Legendary Storm Border',
   'The ultimate electric frame for the Storm Wyrm.',
   1500,
   'border',
   '⚡')
ON CONFLICT (item_id) DO NOTHING;

/* ============================================================
   QUICK VERIFICATION
   ============================================================ */
SELECT item_id, item_name, category, kind, price
FROM public.shop_catalog
WHERE category = 'borders'
ORDER BY price;
