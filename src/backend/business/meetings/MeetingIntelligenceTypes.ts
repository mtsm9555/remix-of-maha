export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type MeetingType = 'one_on_one' | 'team' | 'client' | 'interview' | 'workshop' | 'standup' | 'retrospective' | 'planning';
export type TranscriptStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ActionItemStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type DecisionStatus = 'proposed' | 'approved' | 'rejected' | 'deferred';

export interface ExternalParticipant {
  name: string;
  email: string;
  company?: string;
  role?: string;
}

export interface Meeting {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  type: MeetingType;
  status: MeetingStatus;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  durationMinutes: number;
  location?: string;
  meetingUrl?: string;
  isVirtual: boolean;
  organizerId: string;
  participantIds: string[];
  externalParticipants: ExternalParticipant[];
  projectId?: string;
  dealId?: string;
  contactId?: string;
  calendarEventId?: string;
  isRecorded: boolean;
  recordingUrl?: string;
  recordingDurationSeconds?: number;
  transcriptStatus: TranscriptStatus;
  transcriptId?: string;
  summaryId?: string;
  aiProcessed: boolean;
  actionItemCount: number;
  decisionCount: number;
  followUpCount: number;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TranscriptSegment {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  startTimeMs: number;
  endTimeMs: number;
  confidence: number;
}

export interface MeetingTranscript {
  id: string;
  meetingId: string;
  tenantId: string;
  status: TranscriptStatus;
  fullTranscript: string;
  segments: TranscriptSegment[];
  wordCount: number;
  speakerCount: number;
  language: string;
  confidence: number;
  processedAt?: Date;
  processingTimeMs?: number;
  createdAt: Date;
}

export interface ActionItem {
  id: string;
  summaryId: string;
  meetingId: string;
  tenantId: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: ActionItemStatus;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: Date;
  completedAt?: Date;
  mentionedAt?: number;
  context?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Decision {
  id: string;
  summaryId: string;
  meetingId: string;
  tenantId: string;
  title: string;
  description?: string;
  status: DecisionStatus;
  rationale?: string;
  alternatives?: string[];
  decidedBy: string[];
  mentionedAt?: number;
  createdAt: Date;
}

export interface FollowUp {
  id: string;
  summaryId: string;
  meetingId: string;
  tenantId: string;
  title: string;
  description?: string;
  responsibleId?: string;
  responsibleName?: string;
  dueDate?: Date;
  type: 'task' | 'meeting' | 'information' | 'approval';
  createdAt: Date;
}

export interface MeetingSummary {
  id: string;
  meetingId: string;
  tenantId: string;
  executiveSummary: string;
  keyPoints: string[];
  topics: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  actionItems: ActionItem[];
  decisions: Decision[];
  followUps: FollowUp[];
  wordCount: number;
  readingTimeMinutes: number;
  aiConfidence: number;
  humanReviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}