import { db } from '@database/_index.js';
import { common } from '@common/_index.js';
import { adapters } from '@adapters/_index.js';

const { env } = common.constants;
const { database, models } = db;
const { User, StyleManual, ComplianceCheck } = models;
const { passwordAdapter } = adapters.password;

let serverInstance = null;

export async function connectDatabase() {
  await database.connect(env.MONGODB_URI);
  console.log(`[Database] Connected successfully to MongoDB at ${env.MONGODB_URI}`);
}

export async function seedInitialData() {
  // 1. Seed supervisor user
  const supervisorEmail = 'supervisor@university.edu';
  const existingUser = await User.findOne({ email: supervisorEmail });
  let supervisorUser = existingUser;

  if (!existingUser) {
    const passwordHash = await passwordAdapter.hash('password123');
    supervisorUser = await User.create({
      email: supervisorEmail,
      passwordHash,
      name: 'Prof. Sarah Okonkwo',
      role: 'supervisor',
    });
    console.log(`[Seed] Created default supervisor: ${supervisorEmail} / password123`);
  }

  // 2. Seed active style manual matching mockup (SettingsStyleManual.jpeg)
  const existingManual = await StyleManual.findOne({ isActive: true });
  if (!existingManual) {
    await StyleManual.create({
      originalName: 'University_Style_Manual_2024.pdf',
      filename: 'manual-university-2024.pdf',
      mimeType: 'application/pdf',
      size: 2400000, // 2.4 MB
      uploadedAt: new Date('2025-01-03T10:00:00Z'),
      isActive: true,
    });
    console.log('[Seed] Created active style manual: University_Style_Manual_2024.pdf');
  }

  // 3. Seed recent checks matching mockup (DashboardUpload.jpeg / ResultsPage.jpeg)
  const existingChecksCount = await ComplianceCheck.countDocuments();
  if (existingChecksCount === 0) {
    await ComplianceCheck.create([
      {
        studentName: 'Amara Diallo',
        chapter: 'Chapter Three',
        documentName: 'Amara_Diallo_Chapter_3.docx',
        documentSize: 3400000,
        overallScore: 91,
        status: 'Full Compliance',
        passedCount: 7,
        failedCount: 1,
        totalRules: 8,
        rulesBreakdown: [
          { ruleId: 'font-size', ruleName: 'Font size (12pt body text)', status: 'Passed' },
          { ruleId: 'margins', ruleName: 'Page margins (1 inch all sides)', status: 'Passed' },
          { ruleId: 'line-spacing', ruleName: 'Line spacing (1.5 lines)', status: 'Passed' },
          { ruleId: 'citation-format', ruleName: 'Citation format (APA 7th Ed.)', status: 'Passed' },
          { ruleId: 'reference-list', ruleName: 'Reference list format', status: 'Passed' },
          { ruleId: 'heading-format', ruleName: 'Heading format (bold, centred)', status: 'Passed' },
          { ruleId: 'page-numbering', ruleName: 'Page numbering', status: 'Passed' },
          { ruleId: 'toc-format', ruleName: 'Table of contents format', status: 'Failed' },
        ],
        checkedAt: new Date(),
        supervisorId: supervisorUser._id,
      },
      {
        studentName: 'Kwame Asante',
        chapter: 'Proposal',
        documentName: 'Kwame_Asante_Proposal.docx',
        documentSize: 4200000,
        overallScore: 74,
        status: 'Partial Compliance',
        passedCount: 5,
        failedCount: 3,
        totalRules: 8,
        rulesBreakdown: [
          { ruleId: 'font-size', ruleName: 'Font size (12pt body text)', status: 'Passed' },
          { ruleId: 'margins', ruleName: 'Page margins (1 inch all sides)', status: 'Passed' },
          { ruleId: 'line-spacing', ruleName: 'Line spacing (1.5 lines)', status: 'Passed' },
          { ruleId: 'citation-format', ruleName: 'Citation format (APA 7th Ed.)', status: 'Failed' },
          { ruleId: 'reference-list', ruleName: 'Reference list format', status: 'Failed' },
          { ruleId: 'heading-format', ruleName: 'Heading format (bold, centred)', status: 'Passed' },
          { ruleId: 'page-numbering', ruleName: 'Page numbering', status: 'Passed' },
          { ruleId: 'toc-format', ruleName: 'Table of contents format', status: 'Failed' },
        ],
        checkedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        supervisorId: supervisorUser._id,
      },
      {
        studentName: 'Fatima Al-Rashid',
        chapter: 'Chapter One',
        documentName: 'Fatima_Chapter_One.docx',
        documentSize: 2800000,
        overallScore: 55,
        status: 'Non-Compliant',
        passedCount: 3,
        failedCount: 5,
        totalRules: 8,
        rulesBreakdown: [
          { ruleId: 'font-size', ruleName: 'Font size (12pt body text)', status: 'Passed' },
          { ruleId: 'margins', ruleName: 'Page margins (1 inch all sides)', status: 'Passed' },
          { ruleId: 'line-spacing', ruleName: 'Line spacing (1.5 lines)', status: 'Passed' },
          { ruleId: 'citation-format', ruleName: 'Citation format (APA 7th Ed.)', status: 'Failed' },
          { ruleId: 'reference-list', ruleName: 'Reference list format', status: 'Failed' },
          { ruleId: 'heading-format', ruleName: 'Heading format (bold, centred)', status: 'Failed' },
          { ruleId: 'page-numbering', ruleName: 'Page numbering', status: 'Passed' },
          { ruleId: 'toc-format', ruleName: 'Table of contents format', status: 'Failed' },
        ],
        checkedAt: new Date('2025-06-10T11:00:00Z'),
        supervisorId: supervisorUser._id,
      },
    ]);
    console.log('[Seed] Created sample recent compliance checks');
  }
}

export function startServer(app, port) {
  return new Promise((resolve) => {
    serverInstance = app.listen(port, () => {
      console.log(`[Server] StyleCheck backend listening on http://localhost:${port}`);
      resolve(serverInstance);
    });
  });
}

export async function shutdownServer() {
  if (serverInstance) {
    await new Promise((resolve) => serverInstance.close(resolve));
  }
  await database.disconnect();
  console.log('[Server] Gracefully shut down');
}

export function registerShutdownHandlers() {
  const handleSignal = async (signal) => {
    console.log(`[Server] Received ${signal}, starting graceful shutdown...`);
    await shutdownServer();
    process.exit(0);
  };

  process.on('SIGTERM', () => handleSignal('SIGTERM'));
  process.on('SIGINT', () => handleSignal('SIGINT'));
}
