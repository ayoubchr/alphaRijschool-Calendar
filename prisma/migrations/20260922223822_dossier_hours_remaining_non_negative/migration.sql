-- Defensive floor: hoursRemaining must never go negative. The application already enforces this
-- via a conditional update (only decrement when there's enough remaining balance), but this
-- constraint is a belt-and-suspenders guard against any code path that might slip through.
ALTER TABLE "Dossier"
  ADD CONSTRAINT "Dossier_hoursRemaining_non_negative"
  CHECK ("hoursRemaining" >= 0);
