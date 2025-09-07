import { getDatabase } from '../database/connection';
import { AuthUtils } from '../utils/auth';
import { logger } from '../utils/logger';
import { MockDataGenerator } from '../utils/mockDataGenerator';

interface TestDataConfig {
  users: number;
  documents: number;
  ingestionJobs: number;
}

class TestDataGenerator {
  private db = getDatabase();
  private config: TestDataConfig;

  constructor(config: TestDataConfig) {
    this.config = config;
  }

  /**
   * Generate test data
   */
  async generate(): Promise<void> {
    try {
      logger.info('Starting test data generation...', this.config);

      // Generate users
      const userIds = await this.generateUsers();
      logger.info(`Generated ${userIds.length} users`);

      // Generate documents
      const documentIds = await this.generateDocuments(userIds);
      logger.info(`Generated ${documentIds.length} documents`);

      // Generate ingestion jobs
      await this.generateIngestionJobs(documentIds);
      logger.info(`Generated ${this.config.ingestionJobs} ingestion jobs`);

      logger.info('Test data generation completed successfully!');
    } catch (error) {
      logger.error('Error generating test data:', error);
      throw error;
    }
  }

  /**
   * Generate test users
   */
  private async generateUsers(): Promise<string[]> {
    const users = [];
    const userIds: string[] = [];

    for (let i = 0; i < this.config.users; i++) {
      const role = this.getRandomRole();
      const user = {
        id: MockDataGenerator.uuid(),
        email: MockDataGenerator.email(),
        username: MockDataGenerator.username(),
        password_hash: await AuthUtils.hashPassword('Test123!'),
        first_name: MockDataGenerator.firstName(),
        last_name: MockDataGenerator.lastName(),
        role,
        is_active: MockDataGenerator.boolean(0.95), // 95% active
        email_verified: MockDataGenerator.boolean(0.8), // 80% verified
        last_login: MockDataGenerator.dateRecent(30),
        created_at: MockDataGenerator.datePast(2),
        updated_at: MockDataGenerator.dateRecent(30),
      };

      users.push(user);
      userIds.push(user.id);
    }

    // Insert users in batches
    const batchSize = 100;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      await this.db('users').insert(batch);
    }

    return userIds;
  }

  /**
   * Generate test documents
   */
  private async generateDocuments(userIds: string[]): Promise<string[]> {
    const documents = [];
    const documentIds: string[] = [];

    const fileTypes = ['pdf', 'docx', 'txt', 'md'];
    const statuses = ['pending', 'processing', 'completed', 'failed'];
    const statusWeights = [0.3, 0.2, 0.4, 0.1]; // 30% pending, 20% processing, 40% completed, 10% failed

    for (let i = 0; i < this.config.documents; i++) {
      const fileType = MockDataGenerator.randomElement(fileTypes);
      const status = MockDataGenerator.weightedArrayElement(statuses, statusWeights);
      const uploadedBy = MockDataGenerator.randomElement(userIds);
      const createdAt = MockDataGenerator.datePast(1);
      const updatedAt = MockDataGenerator.dateBetween(createdAt, new Date());

      const document = {
        id: MockDataGenerator.uuid(),
        title: MockDataGenerator.documentTitle(),
        description: MockDataGenerator.boolean(0.7) ? MockDataGenerator.paragraph() : null,
        file_name: `${MockDataGenerator.fileName()}.${fileType}`,
        file_path: `./uploads/${fileType}/${MockDataGenerator.uuid()}.${fileType}`,
        file_type: fileType,
        file_size: MockDataGenerator.numberInt(1024, 10485760), // 1KB to 10MB
        mime_type: this.getMimeType(fileType),
        status,
        metadata: {
          originalName: MockDataGenerator.fileName(),
          generated: true,
          testData: true,
        },
        uploaded_by: uploadedBy,
        created_at: createdAt,
        updated_at: updatedAt,
        processed_at: status === 'completed' ? MockDataGenerator.dateBetween(createdAt, new Date()) : null,
      };

      documents.push(document);
      documentIds.push(document.id);
    }

    // Insert documents in batches
    const batchSize = 100;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      await this.db('documents').insert(batch);
    }

    return documentIds;
  }

  /**
   * Generate test ingestion jobs
   */
  private async generateIngestionJobs(documentIds: string[]): Promise<void> {
    const ingestionJobs = [];

    const statuses = ['queued', 'processing', 'completed', 'failed', 'cancelled'];
    const statusWeights = [0.2, 0.1, 0.6, 0.08, 0.02]; // 20% queued, 10% processing, 60% completed, 8% failed, 2% cancelled

    for (let i = 0; i < this.config.ingestionJobs; i++) {
      const documentId = MockDataGenerator.randomElement(documentIds);
      const status = MockDataGenerator.weightedArrayElement(statuses, statusWeights);
      const createdAt = MockDataGenerator.datePast(30);
      const updatedAt = MockDataGenerator.dateBetween(createdAt, new Date());

      const job = {
        id: MockDataGenerator.uuid(),
        document_id: documentId,
        status,
        error_message: status === 'failed' ? MockDataGenerator.errorMessage() : null,
        progress: status === 'completed' ? { percentage: 100, stage: 'completed' } : 
                  status === 'processing' ? { percentage: MockDataGenerator.numberInt(1, 99), stage: 'processing' } : null,
        retry_count: MockDataGenerator.numberInt(0, 3),
        started_at: status !== 'queued' ? MockDataGenerator.dateBetween(createdAt, updatedAt) : null,
        completed_at: status === 'completed' ? MockDataGenerator.dateBetween(createdAt, new Date()) : null,
        created_at: createdAt,
        updated_at: updatedAt,
      };

      ingestionJobs.push(job);
    }

    // Insert ingestion jobs in batches
    const batchSize = 100;
    for (let i = 0; i < ingestionJobs.length; i += batchSize) {
      const batch = ingestionJobs.slice(i, i + batchSize);
      await this.db('ingestion_jobs').insert(batch);
    }
  }

  /**
   * Get random user role
   */
  private getRandomRole(): string {
    const roles = ['admin', 'editor', 'viewer'];
    const weights = [0.05, 0.25, 0.7]; // 5% admin, 25% editor, 70% viewer
    return MockDataGenerator.weightedArrayElement(roles, weights);
  }

  /**
   * Get MIME type for file type
   */
  private getMimeType(fileType: string): string {
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
      md: 'text/markdown',
    };
    return mimeTypes[fileType] || 'application/octet-stream';
  }

  /**
   * Clean up test data
   */
  async cleanup(): Promise<void> {
    try {
      logger.info('Cleaning up test data...');

      await this.db('user_sessions').del();
      await this.db('ingestion_jobs').del();
      await this.db('documents').del();
      
      // Keep admin users, remove only test users
      await this.db('users')
        .where('metadata->generated', true)
        .del();

      logger.info('Test data cleanup completed');
    } catch (error) {
      logger.error('Error cleaning up test data:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<any> {
    try {
      const userCount = await this.db('users').count('* as count');
      const documentCount = await this.db('documents').count('* as count');
      const jobCount = await this.db('ingestion_jobs').count('* as count');

      const userRoleStats = await this.db('users')
        .select('role')
        .count('* as count')
        .groupBy('role');

      const documentStatusStats = await this.db('documents')
        .select('status')
        .count('* as count')
        .groupBy('status');

      const jobStatusStats = await this.db('ingestion_jobs')
        .select('status')
        .count('* as count')
        .groupBy('status');

      return {
        users: parseInt(userCount[0].count as string),
        documents: parseInt(documentCount[0].count as string),
        ingestionJobs: parseInt(jobCount[0].count as string),
        userRoles: userRoleStats.reduce((acc: any, stat: any) => {
          acc[stat.role] = parseInt(stat.count as string);
          return acc;
        }, {}),
        documentStatuses: documentStatusStats.reduce((acc: any, stat: any) => {
          acc[stat.status] = parseInt(stat.count as string);
          return acc;
        }, {}),
        jobStatuses: jobStatusStats.reduce((acc: any, stat: any) => {
          acc[stat.status] = parseInt(stat.count as string);
          return acc;
        }, {}),
      };
    } catch (error) {
      logger.error('Error getting database statistics:', error);
      throw error;
    }
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    // Configuration for test data generation
    const config: TestDataConfig = {
      users: 1000,        // Generate 1,000 users
      documents: 100000,  // Generate 100,000 documents
      ingestionJobs: 150000, // Generate 150,000 ingestion jobs
    };

    const generator = new TestDataGenerator(config);

    // Check command line arguments
    const args = process.argv.slice(2);
    if (args.includes('--cleanup')) {
      await generator.cleanup();
      return;
    }

    if (args.includes('--stats')) {
      const stats = await generator.getStats();
      console.log('📊 Database Statistics:');
      console.log(JSON.stringify(stats, null, 2));
      return;
    }

    // Generate test data
    console.log('🚀 Starting test data generation...');
    console.log(`📝 Will generate:`);
    console.log(`   - ${config.users.toLocaleString()} users`);
    console.log(`   - ${config.documents.toLocaleString()} documents`);
    console.log(`   - ${config.ingestionJobs.toLocaleString()} ingestion jobs`);
    console.log('');

    const startTime = Date.now();
    await generator.generate();
    const endTime = Date.now();

    console.log('');
    console.log(`✅ Test data generation completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds`);

    // Show statistics
    const stats = await generator.getStats();
    console.log('');
    console.log('📊 Final Database Statistics:');
    console.log(JSON.stringify(stats, null, 2));

  } catch (error) {
    console.error('❌ Error generating test data:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { TestDataGenerator, TestDataConfig };
