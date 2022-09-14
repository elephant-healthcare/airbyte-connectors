import {AirbyteRecord} from 'faros-airbyte-cdk';

import {
  Converter,
  DestinationModel,
  DestinationRecord,
  StreamContext,
} from '../converter';
import {Team} from './types';

class TeamConverter extends Converter {
  source = 'Linear';

  readonly destinationModels: ReadonlyArray<DestinationModel> = ['tms_Team'];

  id(record: AirbyteRecord): any {
    const data = record?.record?.data as Team | undefined;
    return data?.id;
  }

  async convert(
    record: AirbyteRecord,
    _ctx: StreamContext
  ): Promise<ReadonlyArray<DestinationRecord>> {
    const source = this.streamName.source;
    const team = record.record.data as Team | undefined;

    if (!team) return [];

    const {id, name} = team;

    return [
      {
        model: 'tms_Team',
        record: {
          uid: id,
          source,
          name,
        },
      },
    ];
  }
}

export {TeamConverter as Team};
