// Types for records coming in from Airbyte
// Not all fields are listed here in the TS types as many are not used

export type Issue = {
  id: string;
  title: string;
  number: number;
  priority: number;
  estimate: number | null;
  createdAt: string;
  updatedAt: string | null;
  archivedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  canceledAt: string | null;
  autoClosedAt: string | null;
  autoArchivedAt: string | null;
  dueDate: string | null;
  trashed: string | null;
  snoozedUntilAt: string | null;

  labelIds: string[];
  teamId: string;
  cycleId: string | null;
  projectId: string | null;
  creatorId: string | null;
  assigneeId: string | null;
  snoozedById: string | null;

  stateId: string | null;
  parentId: string | null;
  description: string; // JSON-serialized rich text
};

export type IssueLabel = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  organizationId: string | null;
  teamId: string | null;
  creatorId: string | null;
  createdAt: string;
  updatedAt: string | null;
  archivedAt: string | null;
};

export type Team = {
  id: string;
  name: string;
};
