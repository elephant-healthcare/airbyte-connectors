import {AirbyteRecord} from 'faros-airbyte-cdk';

import {
  Converter,
  DestinationModel,
  DestinationRecord,
  StreamContext,
} from '../converter';
import {IssueLabel} from './types';

class IssueLabelConverter extends Converter {
  source = 'Linear';

  readonly destinationModels: ReadonlyArray<DestinationModel> = ['tms_Label'];

  id(record: AirbyteRecord): string {
    const data = record?.record?.data as IssueLabel | undefined;
    return data?.id;
  }

  async convert(
    record: AirbyteRecord,
    _ctx: StreamContext
  ): Promise<ReadonlyArray<DestinationRecord>> {
    const source = this.streamName.source;
    const issueLabel = record.record.data as IssueLabel | undefined;
    const res: DestinationRecord[] = [];

    if (!issueLabel) return res;

    const {id, name} = issueLabel;

    res.push({
      model: 'tms_Label',
      record: {
        uid: id,
        source,
        // TODO: Assign to team? Post MVP - we only need Bug atm
        name,
      },
    });

    return res;
  }
}

export {IssueLabelConverter as IssueLabel};
