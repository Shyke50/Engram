# Dately — Product Spec

## The gist

Dately is a **decision engine for going out**, not a discovery app. Everything
else in the category makes it easier to *see options*, which makes it harder to
*decide*. Dately collects everyone's constraints, hands back exactly one
curated plan, and gets the group out the door.

One-liner: **Dately tells you exactly what to do, so you can stop arguing about
it.**

## The three mechanics

1. **One curated plan, no browsing.** A single outing based on budget, vibe,
   location, timing and constraints. No feed, no list, no ten tabs.
2. **One shared reroll.** If the plan misses, the group gets exactly one reroll,
   and it **requires a reason** (too expensive, too far, wrong vibe, bad timing,
   already been) so the second pick is genuinely better. The second plan is
   final.
3. **Journeys** *(post-MVP)* — predefined Philly routes with a photo/video prompt
   at each stop, producing a group recap that then sells that journey to the
   next group. Not built yet; see roadmap.

## Chat-first sharing

The organizer has the app; everyone else gets a link. Submitting constraints,
seeing the plan and accepting all work from a URL with **zero install**. If
participants needed an account or a download, the product collapses into
"someone texts a suggestion" — which is free and already happens. The link
unfurl (the generated OG image) *is* the sharing mechanic, so it's treated as
core, not polish.

## Who it's for, and in what order

Philadelphia only at the start — density beats breadth when the catalog is
hand-curated.

Support **both couples and groups** from day one: it's the same engine with a
party-size question up front, so building both is nearly free. But **curate date
plans deeply first and lead with dates**, because couples go out weekly rather
than monthly, there's no five-person coordination funnel, "just tell us what to
do" is the most common couples failure mode, and it matches the origin of the
idea. Groups run on a thinner catalog while recommendation quality is proven,
then become the featured use case — because groups are what make Journeys
recaps worth watching.

## The core flow

Create an outing → share the link in the chat → each person submits budget,
radius, vibe, hard-nos and must-haves → Dately reconciles everyone (tightest
budget, most restrictive radius, union of hard-nos) → returns one plan of
ordered, timed stops, each with a one-line "why" → accept, or spend the single
reroll with a reason → accepted plans become a clean, shareable card with
add-to-calendar. After the outing, one question: **did you actually go?**

## How the engine works (v1)

No ML. A tagged catalog and a filter with a score on top:

- **Hard filter** on the strict stuff: budget ceiling (most constrained person),
  radius, hard-nos, must-haves, party size, opening hours.
- **Score** what survives on vibe overlap, curator rating, duration fit and
  budget headroom; break ties deterministically.
- **Assemble** plans from ordered templates (e.g. food → drinks; activity →
  food → dessert) and schedule them against opening hours.
- **Reroll** excludes the rejected plan and converts the stated reason into a
  new hard constraint (cheaper ceiling, tighter radius, dampened vibe, …).
- **Human in the loop:** an admin override lets a curator hand-fix any plan
  before it goes out. A slightly slower verified answer beats a fast mediocre
  one, because the entire promise is that the first pick is good.

## The one number that matters

Not signups, not plans generated. **The share of accepted plans where the group
actually went.** If that's high, the mechanic works and Journeys is the obvious
next build. If groups accept and then keep negotiating in the chat, the
forced-first-pick mechanic needs rethinking — and it's far cheaper to learn that
from this web app than from a native product.

## Roadmap

- **MVP (this repo):** create → constraints via link → one plan → one reroll
  with a reason → accept → shareable card → "did you go?".
- **Journeys v1:** predefined Philly routes with stops, photo prompts, a private
  group collage. Private is already valuable — "here's what we did" back in the
  chat makes the outing feel finished.
- **Journeys v1.5:** opt-in public recaps on the journey page/map, with sharing
  tiers (private / friends / public / public-blurred). Content belongs to the
  journey, not scattered across the map.

The loop: **curators design journeys → groups experience them → groups make
recaps → recaps sell the journey to the next group.**

## Business (later, not MVP)

- **Booking + payment** turns a planner into infrastructure worth a cut: hold
  the reservation, split the cost, collect from everyone.
- **Venue-side demand:** venues will pay for guaranteed off-peak groups. The
  hard line: **take venue money for fill, never for ranking** — the moment
  "curated" becomes "sponsored", the trust that makes a forced first pick
  tolerable is gone.

## Explicitly out of scope for the MVP

Native apps, participant accounts, payments/splitting, real reservations,
Journeys, the public map, recap collages, notifications beyond the share link,
any city but Philadelphia, and anything resembling a browse/search surface —
that last one most of all, since a list of alternatives rebuilds the app we're
trying to beat.
