// Client-side deterministic engine for the Application Idea Generator.
// Ports the design matrix from `docs/plans/app-idea.md` §6. It maps the 4
// wizard answers to a plausible AppDesign with NO AI — this is the guaranteed
// fallback (and a good smoke test of the design logic). The user-story
// synthesis from the old `storyGenerator.ts` is reused as a sub-step for
// `readyStories`.

import type { AppDesign, AppIdeaAnswers, GeneratorSettings } from '@eidh/shared';

type Domain = 'finance' | 'hr' | 'ops' | 'product';

const BASE_VERBS = [
  'flag', 'review', 'create', 'build', 'add', 'show', 'provide', 'generate',
  'implement', 'manage', 'track', 'alert', 'notify', 'assign', 'route', 'schedule',
  'auto', 'monitor', 'calculate', 'display', 'allow', 'support', 'execute', 'record',
  'log', 'send', 'automate', 'capture', 'produce', 'publish', 'filter', 'export', 'import',
];

// ---- Domain detection (ported from storyGenerator.ts) ----
function detectDomain(text: string): Domain {
  const t = text.toLowerCase();
  if (/(invoice|spend|vendor|payment|finance|budget|revenue|expense)/.test(t)) return 'finance';
  if (/(hiring|onboard|employee|access|badge|laptop|hr|provision)/.test(t)) return 'hr';
  if (/(deploy|freeze|release|environment|calendar|schedule|change|ops|oper)/.test(t)) return 'ops';
  return 'product';
}

// ---- User-story synthesis (reused for readyStories) ----
interface StoryDraft {
  title: string;
  story: string;
  acceptance: string[];
}

function describe(text: string): string {
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

function readyStory(domain: Domain, ideaText: string, benefit: string): StoryDraft {
  const wantPhrase = describe(ideaText);
  const firstWord = (wantPhrase.split(/\s+/)[0] || '').toLowerCase();
  const isBaseVerb = BASE_VERBS.some(
    (v) => firstWord === v || (firstWord.startsWith(v) && firstWord.length <= v.length + 3)
  );
  const storyWant = isBaseVerb ? `to ${wantPhrase}` : wantPhrase;

  const criteria: Record<Domain, string[]> = {
    finance: [
      'Given an invoice exceeds the approved spend threshold, the system flags it as a warning before any approval step.',
      'When I review a flagged invoice, I can see the reason and the amount over threshold.',
      'Given all fields are valid, the action is completed successfully and I receive a confirmation.',
    ],
    hr: [
      'Given a new hire is created, the required systems and badges are provisioned automatically.',
      'When provisioning fails for an individual, I can retry it without re-entering the full request.',
      'Given all fields are valid, the action is completed successfully and I receive a confirmation.',
    ],
    ops: [
      'Given a change freeze window, the calendar shows its start and end clearly.',
      'When I attempt to schedule a deployment inside a freeze, I am warned and must confirm.',
      'Given all fields are valid, the action is completed successfully and I receive a confirmation.',
    ],
    product: [
      'When I submit the form, my inputs are validated and I see clear error messages.',
      'When an error occurs, I can recover and resubmit without losing my data.',
      'Given all fields are valid, the action is completed successfully and I receive a confirmation.',
    ],
  };

  const actorByDomain: Record<Domain, string> = {
    finance: 'a finance analyst',
    hr: 'an HR administrator',
    ops: 'an operations lead',
    product: 'a user',
  };

  const story = `As ${actorByDomain[domain]}, I want ${storyWant} so that I can ${benefit}.`;
  return { title: ideaText.slice(0, 70), story, acceptance: criteria[domain] };
}

// ---- Scale → auth / hosting / scaling (app-idea.md §6.1) ----
function scaleConfig(userClass: AppIdeaAnswers['userClass']) {
  switch (userClass) {
    case 'personal':
      return {
        auth: 'Simple shared account / SSO',
        hosting: 'Single PAAS instance',
        scaling: 'No autoscaling',
        team: ['1 developer'],
      };
    case 'small_team':
      return {
        auth: 'SSO (M365/Entra)',
        hosting: 'App Service + managed DB',
        scaling: 'Basic',
        team: ['1-2 developers'],
      };
    case 'department':
      return {
        auth: 'SSO + RBAC roles',
        hosting: 'App Service + managed DB (+ cache)',
        scaling: 'Autoscale on demand',
        team: ['2-4 developers', '1 product owner'],
      };
    case 'enterprise':
      return {
        auth: 'IdP + MFA, strong session',
        hosting: 'Distributed + CDN + availability zones',
        scaling: 'Elastic autoscale',
        team: ['4-6 developers', '1 architect', '1 PM', '1 QA'],
      };
  }
}

// ---- Size → architecture / effort / team / weeks (app-idea.md §6.2) ----
function sizeConfig(appSize: AppIdeaAnswers['appSize']) {
  switch (appSize) {
    case 'small':
      return {
        architecture: 'Single-page app + single API (monolith)',
        effort: 'S' as const,
        tShirt: 'S',
        weeks: 6,
        team: ['1-2 developers'],
      };
    case 'medium':
      return {
        architecture: 'Modular monolith + API, split modules',
        effort: 'M' as const,
        tShirt: 'M',
        weeks: 12,
        team: ['2-4 developers'],
      };
    case 'large':
      return {
        architecture: 'Service-oriented / microservices, event bus',
        effort: 'XL' as const,
        tShirt: 'L-XL',
        weeks: 24,
        team: ['4-8+ cross-functional devs'],
      };
  }
}

// ---- Audience → security posture (app-idea.md §6.3) ----
function audienceConfig(audience: AppIdeaAnswers['audience']) {
  return audience === 'internal'
    ? {
        authentication: 'M365/Entra SSO (federated)',
        authorization: 'Role-based, per-BU',
        dataProtection: 'Internal policy, least-privilege',
      }
    : {
        authentication: 'External IdP + MFA, self-registration, secure session',
        authorization: 'Scoped per-tenant/customer, consent',
        dataProtection: 'Privacy, DPA, accessibility (WCAG), data residency',
      };
}

// ---- Connectivity → integration architecture (app-idea.md §6.4) ----
function integrationConfig(connectivity: boolean) {
  return connectivity
    ? {
        integrations: [
          { name: 'ERP / Finance system', purpose: 'Sync master data and post transactions' },
          { name: 'Identity provider (Entra)', purpose: 'SSO, provisioning, and access control' },
          { name: 'Notification/email service', purpose: 'Alerts, approvals, and scheduled reports' },
        ],
        dataFlow: 'REST + async queue / event-driven; pull/push with retry and error handling',
      }
    : {
        integrations: [],
        dataFlow: 'Standalone; data lives inside the app',
      };
}

function titleCase(text: string): string {
  return text
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')
    .trim();
}

// ---- Main deterministic engine ----
export function generateDesign(
  ideaText: string,
  answers: AppIdeaAnswers,
  settings?: GeneratorSettings,
): AppDesign {
  const domain = detectDomain(ideaText);
  const trimmed = ideaText.trim();

  const scale = scaleConfig(answers.userClass);
  const size = sizeConfig(answers.appSize);
  const audience = audienceConfig(answers.audience);
  const integrations = integrationConfig(answers.connectivity);

  // Settings-aware stack + auth/database defaults (falls back to hard-coded
  // defaults when no config is supplied, e.g. offline/tests).
  const stackChoices = settings?.techStack?.length ? settings.techStack : [];
  const authLabel =
    settings?.authMode === 'sso'
      ? 'SSO (M365/Entra)'
      : settings?.authMode === 'jwt_sso'
        ? 'JWT + optional SSO'
        : 'JWT (stateless tokens)';
  const dbLabel =
    settings?.defaultDatabase && settings?.productionDatabase
      ? `${settings.defaultDatabase} (dev) → ${settings.productionDatabase} (prod)`
      : 'PostgreSQL / SQLite';
  const stack = stackChoices.length
    ? [
        ...stackChoices.slice(0, 2),
        dbLabel,
        ...stackChoices.slice(2, 3),
        answers.connectivity ? 'Message queue (RabbitMQ / Service Bus)' : 'PWA / container hosting',
      ].filter(Boolean)
    : [
        answers.appSize === 'large' ? 'React (or Angular)' : 'React',
        answers.appSize === 'large' ? '.NET / Node.js microservices' : 'Node.js (Express) API',
        'PostgreSQL / SQLite',
        answers.connectivity ? 'Message queue (RabbitMQ / Service Bus)' : 'PWA / container hosting',
      ];

  const noun = domain === 'finance' ? 'Finance' : domain === 'hr' ? 'People' : domain === 'ops' ? 'Operations' : 'App';
  const name = titleCase(trimmed.split(/\s+/).slice(0, 4).join(' ')) || `${noun} Hub`;
  const headline = `A ${answers.appSize} ${answers.audience} app for ${answers.userClass.replace(/_/g, ' ')} users that ${trimmed}`;
  const summary = `${headline}. Built as a ${size.architecture.toLowerCase()} with ${integrations.integrations.length} integration${integrations.integrations.length === 1 ? '' : 's'}.`;

  const coreEntities =
    domain === 'finance'
      ? ['Invoice', 'Vendor', 'Approval', 'Budget']
      : domain === 'hr'
        ? ['Employee', 'ProvisioningRequest', 'System', 'Role']
        : domain === 'ops'
          ? ['ChangeRequest', 'ChangeWindow', 'Environment', 'Deployment']
          : ['User', 'Record', 'Workflow', 'Report'];

  const benefitByDomain: Record<Domain, string> = {
    finance: 'prevent costly overpayments and keep spend within approved thresholds',
    hr: 'cut onboarding time and remove manual provisioning steps',
    ops: 'prevent deployment conflicts and stay inside change windows',
    product: 'manage the workflow efficiently and avoid manual effort',
  };

  const phases =
    answers.appSize === 'small'
      ? [
          { name: 'Foundation', weeks: 2, focus: 'Scaffold, schema, auth' },
          { name: 'Core feature', weeks: 3, focus: 'Build the primary workflow' },
          { name: 'Polish & launch', weeks: 1, focus: 'Testing, hardening, release' },
        ]
      : answers.appSize === 'medium'
        ? [
            { name: 'Foundation', weeks: 3, focus: 'Scaffold, schema, auth, CI' },
            { name: 'Core modules', weeks: 6, focus: 'Split modules, integrations' },
            { name: 'Hardening', weeks: 2, focus: 'Security, testing, audit' },
            { name: 'Launch', weeks: 1, focus: 'Migration, release, training' },
          ]
        : [
            { name: 'Discovery & architecture', weeks: 4, focus: 'Domain modeling, service boundaries, event bus' },
            { name: 'Build services', weeks: 12, focus: 'Implement bounded contexts + integrations' },
            { name: 'Integration & test', weeks: 6, focus: 'E2E, security, performance' },
            { name: 'Rollout', weeks: 2, focus: 'Phased rollout, observability, training' },
          ];

  const readyStories = [
    readyStory(domain, trimmed, benefitByDomain[domain]),
    {
      title: 'Configuration & administration',
      story: `As an administrator, I want to configure the ${noun.toLowerCase()} settings so that I can tailor it to my team.`,
      acceptance: [
        'Given I am an admin, I can edit the settings and they persist across sessions.',
        'Given a config change is saved, it is reflected immediately without a redeploy.',
      ],
    },
  ];

  return {
    name,
    headline,
    summary,
    architecture: size.architecture,
    stack,
    dataModel: {
      coreEntities,
      relationships: [
        `${coreEntities[0]} relates to ${coreEntities[1]} (many-to-one)`,
        `${coreEntities[1]} belongs to ${coreEntities[2]} (many-to-one)`,
      ],
    },
    integrations: integrations.integrations,
    security: settings && settings.authMode !== 'jwt' ? { ...audience, authentication: authLabel } : audience,
    estimate: {
      effort: size.effort,
      tShirt: size.tShirt,
      weeks: size.weeks,
      team: size.team,
    },
    phases,
    risks: [
      { risk: 'Scope creep from broad requirements', mitigation: 'Lock MVP via the readyStories; iterate in later phases.' },
      { risk: `Cross-system dependencies${answers.connectivity ? '' : ' (none — standalone)'}`, mitigation: 'Define clear integration contracts and use async retries.' },
    ],
    readyStories,
    reasoning: `Deterministic draft from the 4 answers: scale=${answers.userClass}, size=${answers.appSize}, audience=${answers.audience}, connectivity=${answers.connectivity ? 'yes' : 'no'}. ${scale.hosting}, ${scale.scaling}.${settings ? ` Configured defaults: stack=${settings.techStack.join(', ')}, auth=${settings.authMode}, db=${settings.defaultDatabase}→${settings.productionDatabase}.` : ''}`,
  };
}

// ---- Idea templates (seed list for the template picker) ----
export interface IdeaTemplate {
  id: string;
  title: string;
  ideaText: string;
  summary: string;
}

export const IDEA_TEMPLATES: IdeaTemplate[] = [
  {
    id: 'tpl-invoice',
    title: 'Invoice flagging & approval',
    ideaText: 'Flag vendor invoices outside approved spend thresholds and route them for approval.',
    summary: 'Finance app (internal) — flags over-threshold invoices and routes approval.',
  },
  {
    id: 'tpl-onboarding',
    title: 'Employee onboarding automation',
    ideaText: 'Automate provisioning of laptop, email, and badges so new hires can start in a day.',
    summary: 'HR app (internal) — automates access provisioning for new hires.',
  },
  {
    id: 'tpl-change',
    title: 'Change freeze calendar',
    ideaText: 'Show when each application\u2019s change freeze begins and ends, and block conflicting deployments.',
    summary: 'Operations app (internal) — change window calendar and freeze enforcement.',
  },
  {
    id: 'tpl-portal',
    title: 'Customer self-service portal',
    ideaText: 'Let customers submit, track, and resolve support requests self-service.',
    summary: 'External app — customer self-service support portal.',
  },
];

export const EXAMPLE_IDEAS = IDEA_TEMPLATES;
