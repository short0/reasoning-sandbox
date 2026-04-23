export type Score = {
  accuracy: number;
  reasoning: number;
  clarity: number;
  completeness: number;
};

export type Preset = {
  id: string;
  title: string;
  tag: string;
  description: string;
  task: string;
  fastAnswer: string;
  reasoningAnswer: string;
  critique: string[];
  fastScore: Score;
  reasoningScore: Score;
  revised: string;
  explanation: string;
  quickActions: string[];
};

export const PRESETS: Preset[] = [
  {
    id: "math",
    title: "Multi-step Math Problem",
    tag: "Math",
    description: "A word problem where skipping a step changes the answer.",
    task: "A train leaves Station A at 9:00 AM traveling at 60 mph. Another train leaves Station B (180 miles away) at 9:30 AM traveling toward Station A at 75 mph. At what time do they meet?",
    fastAnswer:
      "They meet at about 10:20 AM. Combined speed is 135 mph, distance is 180 miles, so 180/135 ≈ 1.33 hours after 9:00 AM.",
    reasoningAnswer:
      "Step 1: From 9:00–9:30, only Train A moves. It covers 60 × 0.5 = 30 miles.\nStep 2: Remaining distance at 9:30 = 180 − 30 = 150 miles.\nStep 3: Combined closing speed = 60 + 75 = 135 mph.\nStep 4: Time to close 150 miles = 150 / 135 ≈ 1.111 hours ≈ 66.7 minutes.\nStep 5: 9:30 AM + 66.7 min ≈ 10:36:40 AM.\nThey meet at approximately 10:37 AM.",
    critique: [
      "Fast answer ignored the 30-minute head start of Train A.",
      "Used full 180 miles instead of 150 miles after 9:30.",
      "Result is off by ~17 minutes — material error for scheduling.",
    ],
    fastScore: { accuracy: 3, reasoning: 4, clarity: 8, completeness: 5 },
    reasoningScore: { accuracy: 10, reasoning: 10, clarity: 9, completeness: 10 },
    revised:
      "The trains meet at approximately 10:37 AM. Train A travels alone for 30 minutes (covering 30 miles), leaving 150 miles to close at a combined 135 mph (~1h 7m).",
    explanation:
      "This is a classic case where reasoning helps: the problem has a hidden timing offset. A fast model pattern-matches 'two trains meeting' and divides distance by combined speed, missing the staggered start.",
    quickActions: [
      "Make Station B 200 miles away",
      "What if Train B leaves at 10:00 AM instead?",
      "Solve algebraically and show variables",
      "Convert all units to km/h",
    ],
  },
  {
    id: "code",
    title: "Buggy Code Review",
    tag: "Code",
    description: "JavaScript with an off-by-one and an async race condition.",
    task: "Review this function and list every bug:\n\nasync function getTopUsers(users, n) {\n  const scores = [];\n  for (let i = 0; i <= users.length; i++) {\n    fetch(`/api/score/${users[i].id}`)\n      .then(r => r.json())\n      .then(s => scores.push(s));\n  }\n  return scores.sort((a, b) => b - a).slice(0, n);\n}",
    fastAnswer:
      "The loop should be `i < users.length` instead of `i <= users.length` to avoid an out-of-bounds access.",
    reasoningAnswer:
      "Three issues:\n\n1. Off-by-one: `i <= users.length` reads `users[users.length]` which is undefined and throws on `.id`.\n2. Async race: `fetch(...)` returns a Promise that is never awaited. `scores` is empty when returned.\n3. Sort assumes `s` is a number, but `r.json()` may return an object — sort comparator will produce NaN.\n\nFix: use `i < users.length`, collect promises with `Promise.all`, and extract a numeric field from each response.",
    critique: [
      "Fast answer caught the loop bound but missed the async race — the bigger production bug.",
      "Did not flag the sort comparator assumption.",
      "Would ship a function that always returns [].",
    ],
    fastScore: { accuracy: 4, reasoning: 3, clarity: 7, completeness: 3 },
    reasoningScore: { accuracy: 10, reasoning: 9, clarity: 9, completeness: 10 },
    revised:
      "async function getTopUsers(users, n) {\n  const scores = await Promise.all(\n    users.map(u => fetch(`/api/score/${u.id}`).then(r => r.json()))\n  );\n  return scores\n    .map(s => s.value)\n    .sort((a, b) => b - a)\n    .slice(0, n);\n}",
    explanation:
      "Code review is a great fit for reasoning models. Concurrency bugs require tracking control flow over time — exactly what a quick scan misses.",
    quickActions: [
      "Rewrite using async/await only",
      "Add error handling for failed fetches",
      "Convert to TypeScript with types",
      "Explain the race condition in plain English",
    ],
  },
  {
    id: "contract",
    title: "Contract Clause Analysis",
    tag: "Legal",
    description: "An ambiguous indemnity clause with edge cases to surface.",
    task: "Analyze this clause and flag risks:\n\n\"The Vendor shall indemnify the Client against any and all losses arising from the Services, except where caused by the Client's gross negligence.\"",
    fastAnswer:
      "The clause makes the Vendor responsible for losses caused by the Services. The only exception is the Client's gross negligence. This is a standard indemnification clause that favors the Client.",
    reasoningAnswer:
      "Several ambiguities and risk areas:\n\n• Scope: 'arising from the Services' is broad — could include losses to third parties, IP infringement, data breaches.\n• Cap: No liability cap. Vendor exposure is unlimited.\n• Carve-outs: Only 'gross negligence' is excluded — ordinary Client negligence shifts losses to the Vendor.\n• 'Any and all losses' likely includes consequential damages and lost profits, which are usually carved out.\n• No notice/defense procedure specified — Vendor may lose control of claims.\n• Mutual indemnity is missing entirely.",
    critique: [
      "Fast answer treated this as 'standard' — it's actually unusually one-sided.",
      "Missed the lack of liability cap and the consequential damages exposure.",
      "Did not flag the absence of a defense/notice procedure.",
    ],
    fastScore: { accuracy: 5, reasoning: 4, clarity: 8, completeness: 3 },
    reasoningScore: { accuracy: 9, reasoning: 10, clarity: 9, completeness: 10 },
    revised:
      "This indemnity clause is heavily skewed toward the Client. Recommend adding: (1) a liability cap tied to fees paid, (2) carve-outs for consequential and indirect damages, (3) a defense/notice procedure, (4) exclusion for Client's ordinary negligence (not just gross), and (5) a mutual indemnity for Client breaches.",
    explanation:
      "Legal text rewards careful, slow analysis. A fast model pattern-matches structure ('this looks like an indemnity clause') without enumerating what's missing — and what's missing often matters most.",
    quickActions: [
      "Suggest a liability cap formula",
      "Draft a mutual indemnity counterpart",
      "Compare against industry standard",
      "Identify deal-breaker risks",
    ],
  },
  {
    id: "judge",
    title: "Judge Two Competing Answers",
    tag: "Eval",
    description: "Pick the better answer with rubric-based justification.",
    task: "Question: 'Why does adding salt to water make it boil at a higher temperature?'\n\nAnswer A: 'Salt makes water heavier, so it takes more energy to boil.'\n\nAnswer B: 'Dissolved salt particles disrupt the equilibrium between liquid and vapor phases. More energy (higher temperature) is needed for water molecules to escape into vapor — this is called boiling point elevation.'\n\nWhich answer is better and why?",
    fastAnswer:
      "Answer B is better because it explains the science correctly. Answer A is wrong — weight isn't the reason.",
    reasoningAnswer:
      "Rubric:\n• Scientific accuracy: A is wrong (mass is irrelevant). B correctly invokes boiling point elevation, a colligative property. → B wins.\n• Mechanism: A offers a folk explanation. B identifies the vapor-pressure mechanism. → B wins.\n• Clarity for a beginner: A is shorter but misleading. B is slightly technical but introduces the correct term. → B wins, with a note that 'colligative property' could be defined.\n• Completeness: B mentions equilibrium but could note that the effect is small (~0.5°C per mole/kg). → B mostly wins.\n\nVerdict: B is materially better on every dimension. A is not just incomplete — it is incorrect.",
    critique: [
      "Fast answer reaches the right verdict but skips the rubric.",
      "Doesn't explain *why* A is wrong (mass vs. solute particles).",
      "A learner reading the fast answer wouldn't gain a transferable framework.",
    ],
    fastScore: { accuracy: 8, reasoning: 5, clarity: 7, completeness: 4 },
    reasoningScore: { accuracy: 10, reasoning: 10, clarity: 9, completeness: 9 },
    revised:
      "Answer B is significantly better. It correctly identifies boiling point elevation (a colligative property) as the mechanism. Answer A's claim about weight is a misconception — it's the number of dissolved particles disrupting vapor pressure equilibrium that matters, not the mass of the water.",
    explanation:
      "Judging answers benefits from explicit rubrics. A reasoning model spells out the criteria, which makes the verdict auditable and teachable — not just a vibe-based pick.",
    quickActions: [
      "Score both answers on a 1–10 scale",
      "Rewrite Answer A to be correct",
      "Add a third candidate answer to compare",
      "Explain colligative properties to a 10-year-old",
    ],
  },
];

export const getPreset = (id: string) => PRESETS.find((p) => p.id === id);
