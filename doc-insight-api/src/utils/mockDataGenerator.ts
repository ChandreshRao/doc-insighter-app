/**
 * Simple mock data generator to replace faker dependency
 * Provides basic data generation functions for testing
 */

export class MockDataGenerator {
  private static readonly FIRST_NAMES = [
    'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica',
    'William', 'Ashley', 'James', 'Amanda', 'Christopher', 'Jennifer', 'Daniel',
    'Lisa', 'Matthew', 'Nancy', 'Anthony', 'Karen', 'Mark', 'Betty', 'Donald',
    'Helen', 'Steven', 'Sandra', 'Paul', 'Donna', 'Andrew', 'Carol', 'Joshua',
    'Ruth', 'Kenneth', 'Sharon', 'Kevin', 'Michelle', 'Brian', 'Laura', 'George',
    'Sarah', 'Timothy', 'Kimberly', 'Ronald', 'Deborah', 'Jason', 'Dorothy',
    'Edward', 'Lisa', 'Jeffrey', 'Nancy', 'Ryan', 'Karen', 'Jacob', 'Betty',
    'Gary', 'Helen', 'Nicholas', 'Sandra', 'Eric', 'Donna', 'Jonathan', 'Carol',
    'Stephen', 'Ruth', 'Larry', 'Sharon', 'Justin', 'Michelle', 'Scott', 'Laura',
    'Brandon', 'Sarah', 'Benjamin', 'Kimberly', 'Samuel', 'Deborah', 'Gregory',
    'Dorothy', 'Alexander', 'Lisa', 'Patrick', 'Nancy', 'Jack', 'Karen', 'Dennis',
    'Betty', 'Jerry', 'Helen', 'Tyler', 'Sandra', 'Aaron', 'Donna', 'Jose',
    'Carol', 'Henry', 'Ruth', 'Adam', 'Sharon', 'Douglas', 'Michelle', 'Nathan',
    'Laura', 'Peter', 'Sarah', 'Zachary', 'Kimberly', 'Kyle', 'Deborah', 'Walter',
    'Dorothy', 'Harold', 'Lisa', 'Carl', 'Nancy', 'Jeremy', 'Karen', 'Gerald',
    'Betty', 'Keith', 'Helen', 'Roger', 'Sandra', 'Arthur', 'Donna', 'Lawrence',
    'Carol', 'Sean', 'Ruth', 'Christian', 'Sharon', 'Ethan', 'Michelle', 'Austin',
    'Laura', 'Joe', 'Sarah', 'Albert', 'Kimberly', 'Jesse', 'Deborah', 'Willie',
    'Dorothy', 'Mason', 'Lisa', 'Roy', 'Nancy', 'Ralph', 'Karen', 'Eugene', 'Betty'
  ];

  private static readonly LAST_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
    'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
    'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill',
    'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell',
    'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner',
    'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris',
    'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
    'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox',
    'Ward', 'Richardson', 'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett',
    'Gray', 'Mendoza', 'Ruiz', 'Hughes', 'Price', 'Alvarez', 'Castillo', 'Sanders',
    'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez', 'Powell', 'Jenkins',
    'Perry', 'Russell', 'Sullivan', 'Bell', 'Coleman', 'Butler', 'Henderson',
    'Barnes', 'Gonzales', 'Fisher', 'Vasquez', 'Simmons', 'Romero', 'Jordan',
    'Patterson', 'Alexander', 'Hamilton', 'Graham', 'Reynolds', 'Griffin', 'Wallace',
    'Moreno', 'West', 'Cole', 'Hayes', 'Bryant', 'Herrera', 'Gibson', 'Ellis',
    'Tran', 'Medina', 'Aguilar', 'Stevens', 'Murray', 'Ford', 'Castro', 'Marshall',
    'Owens', 'Harrison', 'Fernandez', 'McDonald', 'Woods', 'Washington', 'Kennedy',
    'Wells', 'Vargas', 'Henry', 'Chen', 'Freeman', 'Webb', 'Tucker', 'Guzman',
    'Burns', 'Crawford', 'Olson', 'Simpson', 'Porter', 'Hunter', 'Gordon', 'Mendez',
    'Silva', 'Shaw', 'Snyder', 'Mason', 'Dixon', 'Munoz', 'Hunt', 'Hicks',
    'Holmes', 'Palmer', 'Wagner', 'Black', 'Robertson', 'Boyd', 'Rose', 'Stone',
    'Salazar', 'Fox', 'Warren', 'Mills', 'Meyer', 'Rice', 'Schmidt', 'Garza',
    'Daniels', 'Ferguson', 'Nichols', 'Stephens', 'Soto', 'Weaver', 'Ryan', 'Gardner',
    'Payne', 'Grant', 'Dunn', 'Spencer', 'Coleman', 'Powell', 'Jenkins', 'Perry',
    'Russell', 'Sullivan', 'Bell', 'Coleman', 'Butler', 'Henderson', 'Barnes',
    'Gonzales', 'Fisher', 'Vasquez', 'Simmons', 'Romero', 'Jordan', 'Patterson'
  ];

  private static readonly EMAIL_DOMAINS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'protonmail.com', 'example.com', 'test.com', 'demo.com'
  ];

  private static readonly FILE_EXTENSIONS = ['pdf', 'docx', 'txt', 'md', 'doc', 'rtf'];

  private static readonly DOCUMENT_TITLES = [
    'Project Report', 'Meeting Notes', 'Technical Documentation', 'User Manual',
    'API Specification', 'Design Document', 'Test Plan', 'Requirements Analysis',
    'System Architecture', 'Database Schema', 'Code Review', 'Performance Report',
    'Security Assessment', 'Deployment Guide', 'Troubleshooting Guide', 'Training Material',
    'Process Documentation', 'Policy Document', 'Procedure Manual', 'Best Practices',
    'Implementation Guide', 'Configuration Guide', 'Installation Manual', 'User Guide',
    'Developer Documentation', 'Release Notes', 'Change Log', 'Version History',
    'Feature Specification', 'Bug Report', 'Issue Tracking', 'Project Status',
    'Budget Analysis', 'Financial Report', 'Quarterly Review', 'Annual Summary',
    'Research Findings', 'Market Analysis', 'Competitive Analysis', 'Business Plan',
    'Strategic Planning', 'Risk Assessment', 'Compliance Report', 'Audit Report'
  ];

  private static readonly ERROR_MESSAGES = [
    'Processing failed due to invalid file format',
    'Unable to extract text from document',
    'File size exceeds maximum limit',
    'Document is corrupted or damaged',
    'Unsupported file type detected',
    'Network timeout during processing',
    'Insufficient memory to process document',
    'Authentication failed for external service',
    'Database connection lost during processing',
    'Invalid document structure detected',
    'OCR processing failed',
    'Text extraction service unavailable',
    'Document parsing error occurred',
    'File encoding not supported',
    'Processing queue is full',
    'Service temporarily unavailable',
    'Document validation failed',
    'Content analysis error',
    'Metadata extraction failed',
    'Indexing service error'
  ];

  /**
   * Generate a random UUID
   */
  static uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Generate a random email address
   */
  static email(): string {
    const firstName = this.randomElement(this.FIRST_NAMES).toLowerCase();
    const lastName = this.randomElement(this.LAST_NAMES).toLowerCase();
    const domain = this.randomElement(this.EMAIL_DOMAINS);
    const number = Math.floor(Math.random() * 1000);
    return `${firstName}.${lastName}${number}@${domain}`;
  }

  /**
   * Generate a random username
   */
  static username(): string {
    const firstName = this.randomElement(this.FIRST_NAMES).toLowerCase();
    const lastName = this.randomElement(this.LAST_NAMES).toLowerCase();
    const number = Math.floor(Math.random() * 1000);
    return `${firstName}${lastName}${number}`;
  }

  /**
   * Generate a random first name
   */
  static firstName(): string {
    return this.randomElement(this.FIRST_NAMES);
  }

  /**
   * Generate a random last name
   */
  static lastName(): string {
    return this.randomElement(this.LAST_NAMES);
  }

  /**
   * Generate a random boolean with given probability
   */
  static boolean(probability: number = 0.5): boolean {
    return Math.random() < probability;
  }

  /**
   * Generate a random date in the past
   */
  static datePast(years: number = 1): Date {
    const now = new Date();
    const pastDate = new Date(now.getTime() - (Math.random() * years * 365 * 24 * 60 * 60 * 1000));
    return pastDate;
  }

  /**
   * Generate a random date between two dates
   */
  static dateBetween(from: Date, to: Date): Date {
    const fromTime = from.getTime();
    const toTime = to.getTime();
    const randomTime = fromTime + Math.random() * (toTime - fromTime);
    return new Date(randomTime);
  }

  /**
   * Generate a random recent date
   */
  static dateRecent(days: number = 30): Date {
    const now = new Date();
    const recentDate = new Date(now.getTime() - (Math.random() * days * 24 * 60 * 60 * 1000));
    return recentDate;
  }

  /**
   * Generate a random sentence
   */
  static sentence(minWords: number = 3, maxWords: number = 8): string {
    const words = ['The', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'and', 'runs', 'through', 'forest', 'to', 'find', 'food', 'for', 'its', 'family', 'while', 'avoiding', 'dangerous', 'predators', 'in', 'wild', 'nature', 'environment', 'where', 'survival', 'depends', 'on', 'skill', 'and', 'luck'];
    const wordCount = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
    const selectedWords = this.randomElements(words, wordCount);
    return selectedWords.join(' ') + '.';
  }

  /**
   * Generate a random paragraph
   */
  static paragraph(): string {
    const sentences = [];
    const sentenceCount = Math.floor(Math.random() * 3) + 2; // 2-4 sentences
    for (let i = 0; i < sentenceCount; i++) {
      sentences.push(this.sentence(5, 15));
    }
    return sentences.join(' ');
  }

  /**
   * Generate a random file name
   */
  static fileName(): string {
    const words = ['document', 'report', 'file', 'data', 'info', 'content', 'material', 'resource', 'asset', 'item'];
    const word = this.randomElement(words);
    const number = Math.floor(Math.random() * 1000);
    return `${word}_${number}`;
  }

  /**
   * Generate a random file type
   */
  static fileType(): string {
    return this.randomElement(this.FILE_EXTENSIONS);
  }

  /**
   * Generate a random document title
   */
  static documentTitle(): string {
    return this.randomElement(this.DOCUMENT_TITLES);
  }

  /**
   * Generate a random error message
   */
  static errorMessage(): string {
    return this.randomElement(this.ERROR_MESSAGES);
  }

  /**
   * Generate a random number between min and max (inclusive)
   */
  static numberInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate a random array element
   */
  static randomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Generate random array elements
   */
  static randomElements<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Generate weighted random array element
   */
  static weightedArrayElement<T>(array: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < array.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return array[i];
      }
    }
    
    return array[array.length - 1];
  }
}
