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
} from '../db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  // Delete in FK-safe order (children first).
  console.log('🧹 Clearing existing data (FK-safe order)…');
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

  console.log('✅ Seed complete.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
