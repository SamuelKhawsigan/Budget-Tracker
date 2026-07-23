Phase 8 from the spec: Dashboard \& charts — AND establish the app's visual

design language while doing it. Apply this design system to the dashboard now,

and structure it (tokens, fonts, motion) so the rest of the app adopts it in

Phase 9. Do NOT invent a generic look — follow this brief precisely.



DESIGN LANGUAGE (editorial + warm-terminal):

Warm-toned dark theme, minimal and editorial, generous whitespace, hairline

dividers, uppercase letter-spaced micro-labels for section headers. Flat — no

glassmorphism, no heavy shadows, no neumorphism. Data should feel designed

(thin bars, segmented meters), not like default chart output.



PALETTE (starting tokens — refine for harmony, keep it restrained):

\- bg           #17150F  (warm near-black, NOT cold blue-black)

\- surface      #201E16  with a 1px border rgba(237,233,221,0.08)

\- text         #EDE9DD  / muted #9C9686

\- sage         #9BB07A  = primary / healthy / under-budget

\- terracotta   #CE6A4C  = warning / over-budget / negative amounts

\- amber        #D8A657  = near-cap

Use exactly one neutral base + these accents. No rainbow category colors — if

categories need distinct colors, derive a small muted, harmonious set from this

palette, never saturated defaults.



TYPOGRAPHY (max 5 fonts — use these 3, each with ONE job; load via Fontsource):

\- Space Grotesk  → headings, titles, section micro-labels (display text)

\- JetBrains Mono → ALL numbers: hero balances, amounts, dates, table figures,

&#x20;                  axes, tooltips. Enable tabular figures so decimals align.

\- Inter          → body copy, form controls, longer UI text

Money is always mono + tabular. Headline numbers are large and confident.



MOTION (Framer Motion — purposeful, not gimmicky):

\- Hero/summary numbers count up on load.

\- Cards fade + rise \~8px on mount, subtly staggered.

\- Month navigation and route/tab changes cross-fade (\~150–200ms, ease-out).

\- Charts draw in on mount (bars grow, line draws).

\- Interactive cards lift / border-brighten on hover.

\- 150–250ms, ease-out, no spring bounce. Respect prefers-reduced-motion.



ANTI-SLOP RULES (hard constraints):

\- NO emojis anywhere. Icons only, via Lucide, consistent stroke weight, used

&#x20; sparingly — never an emoji as an icon or label.

\- No default Recharts rainbow; restyle every chart to the palette with thin

&#x20; strokes/bars, hairline or no gridlines, no drop shadows, custom tooltips that

&#x20; match the card style.

\- No "AI-default" blurple (#6366F1 / #3B82F6) primary.

\- Don't center-align everything; use real hierarchy and left-aligned editorial

&#x20; layout. Consistent spacing scale, one radius, one elevation style.

\- No stock illustrations, blobs, or gradient meshes.



DASHBOARD CONTENT (reuse existing logic — do NOT recompute):

1\. Make the dashboard the app's home view.

2\. This-month hero + summary: income, spending, available cash, projected

&#x20;  savings (reuse month cash-summary and projected-savings functions).

3\. Budget health at a glance: each budgeted category's spent-vs-cap with its

&#x20;  sage/amber/terracotta state.

4\. Spending by category chart for the selected month — expenses only, transfers

&#x20;  excluded.

5\. Income-vs-spending (and/or savings) trend across recent months.

6\. One month navigator that moves the whole dashboard together.



Stop after Phase 8 so I can test. Don't commit until I confirm — then commit and

push with message "Phase 8: dashboard \& design system".

