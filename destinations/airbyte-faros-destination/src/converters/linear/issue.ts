import {AirbyteRecord} from 'faros-airbyte-cdk';

import {
  Converter,
  DestinationModel,
  DestinationRecord,
  StreamContext,
  StreamName,
} from '../converter';
import {Issue} from './types';

// MVP - ingest issues with labels so we can count bugs
// Also need to ingest teams in Linear, map to GH, and issue-team mapping
//
// TEAMS:
// - create new tms_Team table
// - one-to-one relationship to ims_Team on name (???)
class IssueConverter extends Converter {
  source = 'Linear';

  readonly destinationModels: ReadonlyArray<DestinationModel> = [
    'tms_Task',
    'tms_TaskTag',
  ];

  private readonly issueLabelStream = new StreamName('linear', 'issue_label');
  private readonly teamStream = new StreamName('linear', 'team');

  override get dependencies(): ReadonlyArray<StreamName> {
    return [this.issueLabelStream, this.teamStream];
  }

  id(record: AirbyteRecord): any {
    const data = record?.record?.data as Issue | undefined;
    return data?.id;
  }

  async convert(
    record: AirbyteRecord,
    ctx: StreamContext
  ): Promise<ReadonlyArray<DestinationRecord>> {
    // const config = ctx.config.source_specific_configs?.grafana_incident;

    const source = this.streamName.source;
    const issue = record.record.data as Issue | undefined;
    const res: DestinationRecord[] = [];

    if (!issue) return res;

    const {
      id: taskId,
      title,
      createdAt,
      updatedAt,
      priority,
      estimate,
      stateId,
      teamId,
      labelIds,
      parentId,
    } = issue;

    res.push({
      model: 'tms_Task',
      record: {
        uid: taskId,
        source,
        name: title,
        createdAt,
        updatedAt,
        url: 'TODO',
        type: 'TODO', // WHAT IS THIS?
        // status: stateId && {source, uid: stateId}, // TODO: actually, FK to workflow state, expects status, may need to alter schema?
        points: estimate,
        priority: `${priority}`,
        team: teamId && {source, uid: teamId},
        parent: parentId && {source, uid: parentId},
      },
    });

    if (Array.isArray(labelIds)) {
      for (const labelId of labelIds) {
        const label = ctx.get(this.issueLabelStream.asString, labelId);
        const name = label?.record?.data?.name;

        if (!name) continue;
        res.push({
          model: 'tms_TaskTag',
          record: {task: {uid: taskId, source}, label: {name}},
        });
      }
    }

    return res;
  }
}

export {IssueConverter as Issue};
