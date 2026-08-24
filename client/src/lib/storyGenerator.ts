// Port of the client-side deterministic story generator from the home-page mockup.
// In the real app this becomes an LLM call (Module B) — here it synthesizes a
// plausible draft from the input so the frontend demo stays dependency-free.

export interface StoryDraft {
  title: string;
  story: string;
  acceptance: string[];
  reasoning: string;
}

type Domain = 'finance' | 'hr' | 'ops' | 'product';

const BASE_VERBS = [
  'flag', 'review', 'create', 'build', 'add', 'show', 'provide', 'generate',
  'implement', 'manage', 'track', 'alert', 'notify', 'assign', 'route', 'schedule',
  'auto', 'monitor', 'calculate', 'display', 'allow', 'support', 'execute', 'record',
  'log', 'send', 'automate', 'capture', 'produce', 'publish', 'filter', 'export', 'import',
];

function detectDomain(text: string): Domain {
  const t = text.toLowerCase();
  if (/(invoice|spend|vendor|payment|finance|budget|revenue|expense)/.test(t)) return 'finance';
  if (/(hiring|onboard|employee|access|badge|laptop|hr|provision)/.test(t)) return 'hr';
  if (/(deploy|freeze|release|environment|calendar|schedule|change|ops|oper)/.test(t)) return 'ops';
  return 'product';
}

function describe(text: string, domain: Domain): string {
  let cleaned = text
    .replace(/^as (the|an|a)?\s*[\w ]+team[^,]*,\s*/i, '')
    .replace(/^i\s+(want|would like|need)\s+to\s+/i, '')
    .replace(/^we\s+(want|would like|need|should)\s+(to\s+)?/i, '')
    .replace(/^a way to\s+/i, '')
    .replace(/^the (ability|feature|capability|system|ability) to\s+/i, '')
    .replace(/^[^.\n]{3,160}?(currently|today|right now|keeps|getting|takes|is|are|too|slowly)[^.\n]{0,120}?\.\s+(build|create|add|develop|make|provide|give|let|automate|set up|design|implement|introduce)\s+/i, '')
    .replace(/^[^—\n]{5,140}?(currently|today|right now|keeps)[^—\n]{0,80}?(—|–|-)\s*/i, '')
    .replace(/^[^—\n]{5,140}?(—|–|-)\s*(we|I|the|they)?\s*(want|need|should|would)\s+(to\s+)?/i, '')
    .replace(/^\.+\s*/, '');
  const parts = cleaned.split(/so(| that)|\.\s|\.$/i);
  let base = (parts[0] || cleaned).trim().replace(/^(we|i)\s+(want|need|should|would)\s+(to\s+)?/i, '');
  base = base.charAt(0).toLowerCase() + base.slice(1);
  if (base.length > 110) base = base.slice(0, 110).trim() + '…';
  return base;
}

function buildCriteria(domain: Domain, title: string): string[] {
  const common = [
    `Given the feature has been implemented, I can clearly see the ${domain === 'finance' ? 'flagged invoice' : domain === 'hr' ? 'provisioned access' : 'new detail'} in the UI.`,
    'Given all fields are valid, the action is completed successfully and I receive a confirmation.',
  ];
  const perDomain: Record<Domain, string[]> = {
    finance: [
      'Given an invoice exceeds the approved spend threshold, the system flags it as a warning before any approval step.',
      'When I review a flagged invoice, I can see the reason and the amount over threshold.',
    ],
    hr: [
      'Given a new hire is created, the required systems and badges are provisioned automatically.',
      'When provisioning fails for an individual, I can retry it without re-entering the full request.',
    ],
    ops: [
      'Given a change freeze window, the calendar shows its start and end clearly.',
      'When I attempt to schedule a deployment inside a freeze, I am warned and must confirm.',
    ],
    product: [
      'When I submit the form, my inputs are validated and I see clear error messages.',
      'When an error occurs, I can recover and resubmit without losing my data.',
    ],
  };
  return [...perDomain[domain], ...common];
}

export function generateStory(text: string): StoryDraft {
  const domain = detectDomain(text);
  const trimmed = text.trim().replace(/[.\s]+$/, '');
  let actor = 'a user';
  let role = 'team member';
  let benefit = 'avoid risk and stay aligned with our process';

  if (domain === 'finance') {
    actor = 'a finance analyst';
    role = 'finance team';
    benefit = 'prevent costly overpayments and keep spend within approved thresholds';
  } else if (domain === 'hr') {
    actor = 'an HR administrator';
    role = 'people operations team';
    benefit = 'cut onboarding time and remove manual provisioning steps';
  } else if (domain === 'ops') {
    actor = 'an operations lead';
    role = 'operations team';
    benefit = 'prevent deployment conflicts and stay inside change windows';
  }

  const title = trimmed.length > 70 ? `${trimmed.slice(0, 70).trim()}…` : trimmed;

  const wantPhrase = describe(text, domain);
  const firstWord = (wantPhrase.split(/\s+/)[0] || '').toLowerCase();
  const isBaseVerb = BASE_VERBS.some(
    (v) => firstWord === v || (firstWord.startsWith(v) && firstWord.length <= v.length + 3)
  );
  const storyWant = isBaseVerb ? `to ${wantPhrase}` : wantPhrase;

  const story = `As ${actor}, I want ${storyWant} so that I can ${benefit}.`;
  const acceptance = buildCriteria(domain, title);

  return {
    title,
    story,
    acceptance,
    reasoning: `Draft generated from your description (domain: ${domain}). Estimated effort: ${domain === 'finance' ? 'Medium' : domain === 'ops' ? 'Large' : 'Small'}. Suggest assigning to the ${role}; review the acceptance criteria before accepting.`,
  };
}

export const EXAMPLE_PROMPTS = [
  { label: 'Invoice flagging', text: 'As the finance team, we need a way to flag vendor invoices that fall outside our approved spend thresholds so we can stop overpayments before they are approved.' },
  { label: 'Onboarding automation', text: 'New hires currently get access too slowly — we want to automate the provisioning of laptop, email, and badges so onboarding can happen in a day.' },
  { label: 'Change freeze calendar', text: 'Operations keeps losing track of deployment windows. Build a calendar that shows when each app\u2019s change freeze begins and ends.' },
];
