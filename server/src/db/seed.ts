// Seed script — idempotent, FK-safe delete-then-insert.
// Per spec §9.2 (and the known pitfall re: onConflictDoNothing on non-unique fields).
import { db } from '../db';
import {
  projects,
  users,
  businessUnits,
  requirements,
  sprints,
  deployments,
  supportTickets,
  changeRequests,
  changeTasks,
  changeApprovals,
  cabMembers,
  changeWindows,
  notifications,
} from '../db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  // Delete in FK-safe order (children first).
  console.log('🧹 Clearing existing data (FK-safe order)…');
  await db.delete(notifications);
  await db.delete(changeApprovals);
  await db.delete(changeTasks);
  await db.delete(cabMembers);
  await db.delete(changeWindows);
  await db.delete(changeRequests);
  await db.delete(supportTickets);
  await db.delete(deployments);
  await db.delete(sprints);
  await db.delete(requirements);
  await db.delete(projects);
  await db.delete(businessUnits);
  await db.delete(users);

  const now = new Date().toISOString();

  console.log('👤 Seeding users…');
  const [u1, u2, u3, u4, u5, u6] = await db
    .insert(users)
    .values([
      { id: 'usr-0001', email: 'jane.chen@corp.com', name: 'Jane Chen', role: 'executive' },
      { id: 'usr-0002', email: 'd.okafor@corp.com', name: 'D. Okafor', role: 'pm' },
      { id: 'usr-0003', email: 'l.reyes@corp.com', name: 'L. Reyes', role: 'developer' },
      { id: 'usr-0004', email: 's.patel@corp.com', name: 'S. Patel', role: 'analyst' },
      { id: 'usr-0005', email: 'm.torres@corp.com', name: 'M. Torres', role: 'pm' },
      { id: 'usr-0006', email: 'support@corp.com', name: 'Support Desk', role: 'support' },
    ])
    .returning();

  // Dev-stub user (auth middleware injects id 'dev-0001'); must exist so FK
  // constraints hold when the dev session creates records.
  await db.insert(users).values({ id: 'dev-0001', email: 'dev.stub@corp.com', name: 'Dev User', role: 'executive' });

  console.log('🏢 Seeding business units…');
  const [buFinance, buOps, buIT, buHR] = await db
    .insert(businessUnits)
    .values([
      { id: 'bu-fn', name: 'Finance', ownerId: u1.id },
      { id: 'bu-ops', name: 'Operations', ownerId: u1.id },
      { id: 'bu-it', name: 'IT', ownerId: u3.id },
      { id: 'bu-hr', name: 'HR', ownerId: u4.id },
    ])
    .returning();

  console.log('📊 Seeding projects…');
  const seededProjects = await db
    .insert(projects)
    .values([
      {
        id: 'prj-1001',
        title: 'Customer Care Portal',
        description: 'Unified customer support portal.',
        status: 'in_progress',
        priority: 'critical',
        score: 88,
        businessUnitId: buOps.id,
        requestorId: u2.id,
        pmId: u2.id,
        budget: 620000,
        targetDate: '2026-08-27',
      },
      {
        id: 'prj-1002',
        title: 'Claims Automation',
        description: 'Automated claims processing.',
        status: 'uat',
        priority: 'high',
        score: 92,
        businessUnitId: buFinance.id,
        requestorId: u3.id,
        pmId: u5.id,
        budget: 1150000,
        targetDate: '2026-08-28',
      },
      {
        id: 'prj-1003',
        title: 'Employee Onboarding',
        description: 'Streamline new-hire provisioning.',
        status: 'deployed',
        priority: 'medium',
        score: 74,
        businessUnitId: buHR.id,
        requestorId: u4.id,
        pmId: u2.id,
        budget: 240000,
        targetDate: '2026-08-30',
      },
      {
        id: 'prj-1004',
        title: 'Vendor Risk Scoring',
        description: 'Score third-party vendor risk.',
        status: 'approved',
        priority: 'critical',
        score: 81,
        businessUnitId: buFinance.id,
        requestorId: u5.id,
        pmId: u5.id,
        budget: 410000,
        targetDate: '2026-08-29',
      },
    ])
    .returning();

  console.log('📝 Seeding requirements…');
  await db.insert(requirements).values([
    { id: 'req-1', projectId: seededProjects[0].id, title: 'View case history', type: 'user_story', story: 'As a support agent, I want to view case history so I can resolve faster.', status: 'done', assigneeId: u3.id },
    { id: 'req-2', projectId: seededProjects[0].id, title: 'Escalate P1 tickets', type: 'user_story', story: 'As a support agent, I want to escalate P1 tickets.', status: 'in_progress', assigneeId: u3.id },
    { id: 'req-3', projectId: seededProjects[1].id, title: 'Parse claim docs', type: 'task', story: 'As a claims analyst, I want to parse claim documents.', status: 'backlog', assigneeId: u4.id },
  ]);

  console.log('🚀 Seeding deployments…');
  await db.insert(deployments).values([
    { id: 'dep-1', projectId: seededProjects[2].id, environment: 'prod', version: 'v1.2.0', status: 'deployed', deployedBy: u3.id, deployedAt: now },
  ]);

  console.log('🎫 Seeding support tickets…');
  await db.insert(supportTickets).values([
    { id: 'tkt-1', projectId: seededProjects[0].id, title: 'Login loop on portal', priority: 'p1', status: 'open', reportedBy: u2.id, assigneeId: u3.id },
    { id: 'tkt-2', projectId: seededProjects[1].id, title: 'PDF parse timeout', priority: 'p2', status: 'in_progress', reportedBy: u4.id, assigneeId: u3.id },
    { id: 'tkt-3', projectId: seededProjects[2].id, title: 'Onboarding badge delay', priority: 'p2', status: 'resolved', reportedBy: u4.id, assigneeId: u6.id },
  ]);

  console.log('🔧 Seeding CAB members…');
  await db.insert(cabMembers).values([
    { userId: u1.id, memberType: 'cab_member' },
    { userId: u2.id, memberType: 'cab_member' },
    { userId: u5.id, memberType: 'it_manager' },
  ]);

  console.log('📅 Seeding change windows…');
  const freezeStart = new Date();
  freezeStart.setDate(freezeStart.getDate() + 3);
  const freezeEnd = new Date(freezeStart);
  freezeEnd.setDate(freezeEnd.getDate() + 1);
  await db.insert(changeWindows).values([
    { id: 'cw-1', name: 'Monthly Release Window (June)', kind: 'window', startAt: new Date(Date.now() - 2 * 86400000).toISOString(), endAt: new Date(Date.now() - 2 * 86400000 + 4 * 3600000).toISOString(), scope: 'Services: api, worker' },
    { id: 'cw-2', name: 'Q3 Change Freeze', kind: 'freeze', startAt: freezeStart.toISOString(), endAt: freezeEnd.toISOString(), scope: 'All production changes' },
  ]);

  console.log('📝 Seeding change requests…');
  await db.insert(changeRequests).values([
    {
      id: 'chg-1001',
      title: 'Upgrade Postgres 16 → 17',
      description: 'Rolling upgrade of the primary customer database.',
      type: 'major',
      category: 'data',
      priority: 'high',
      risk: 'high',
      reason: 'EOL for Postgres 16 security patches.',
      implementationPlan: 'Stand up replica, switchover, verify.',
      rollbackPlan: 'Promote old primary back on failure.',
      testPlan: 'Run full integration suite on replica.',
      projectId: seededProjects[0].id,
      requestedBy: u2.id,
      serviceOwner: u3.id,
      status: 'approved',
    },
    {
      id: 'chg-1002',
      title: 'WAF Rule Deployment',
      description: 'Deploy new WAF rules for the public portal.',
      type: 'standard',
      category: 'security',
      priority: 'medium',
      risk: 'medium',
      reason: 'Mitigate OWASP Top 10.',
      implementationPlan: 'Apply ruleset to CDN edge.',
      rollbackPlan: 'Revert to previous ruleset.',
      testPlan: 'Validate against staging board.',
      projectId: seededProjects[0].id,
      requestedBy: u4.id,
      serviceOwner: u3.id,
      status: 'pending_approval',
    },
    {
      id: 'chg-1003',
      title: 'Claims Microservice Deploy',
      description: 'Ship v1.4 of the claims service.',
      type: 'normal',
      category: 'application',
      priority: 'high',
      risk: 'medium',
      reason: 'Support new claim doc parser.',
      implementationPlan: 'Canary to 10% then full.',
      rollbackPlan: 'Revert image tag to v1.3.',
      testPlan: 'Smoke + regression suite.',
      projectId: seededProjects[1].id,
      requestedBy: u3.id,
      serviceOwner: u3.id,
      status: 'in_implementation',
    },
    {
      id: 'chg-1004',
      title: 'Emergency Incident Response',
      description: 'Hotfix for production outage.',
      type: 'emergency',
      category: 'infrastructure',
      priority: 'critical',
      risk: 'high',
      reason: 'Service degradation detected.',
      implementationPlan: 'Ship hotfix immediately.',
      rollbackPlan: 'Revert config change.',
      testPlan: 'Health checks after deploy.',
      projectId: seededProjects[1].id,
      requestedBy: u5.id,
      serviceOwner: u3.id,
      status: 'in_implementation',
    },
  ]);

  const chg1001 = (await db.query.changeRequests.findFirst({ where: eq(changeRequests.id, 'chg-1001') }))!;
  const chg1003 = (await db.query.changeRequests.findFirst({ where: eq(changeRequests.id, 'chg-1003') }))!;

  console.log('🛠️ Seeding change tasks…');
  await db.insert(changeTasks).values([
    { id: 'ct-1', changeId: chg1001.id, title: 'Provision replica', assigneeId: u3.id, status: 'done', position: 0 },
    { id: 'ct-2', changeId: chg1001.id, title: 'Run integration tests', assigneeId: u3.id, status: 'in_progress', position: 1 },
    { id: 'ct-3', changeId: chg1003.id, title: 'Deploy canary', assigneeId: u3.id, status: 'done', position: 0 },
  ]);

  console.log('✅ Seed complete.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
