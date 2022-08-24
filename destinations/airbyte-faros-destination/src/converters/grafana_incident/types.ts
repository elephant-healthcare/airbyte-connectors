// Types for records coming in from Airbyte
// Not all fields are listed here in the TS types as many are not used

export type Incident = {
  incidentID: string;
  severity: string;
  labels: Label[];
  isDrill: boolean;
  createdTime: string;
  createdByUser: User;
  modifiedTime: string;
  closedTime: string;
  status: string;
  statusModifiedTime: string;
  statusModifiedByUser: string;
  title: string;
  description: string;
  descriptionModifiedTime: string;
  descriptionUser: User;
  slug: string;
  overviewURL: string;
  roles: Role[];
  version: number;
  summary: string;
  incidentStart: string;
  incidentEnd: string;
};

export type Label = {
  label: string;
  description: string;
  colorHex: string;
};

export type Role = {
  role: string;
  description: string;
  user: User;
};

export type User = {
  userID: string;
  name: string;
  email: string;
};
