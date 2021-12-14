import {AirbyteRecord} from 'faros-airbyte-cdk';

import {DestinationModel, DestinationRecord, StreamContext} from '../converter';
import {SquadcastConverter, User} from './common';

export class SquadcastUsers extends SquadcastConverter {
  readonly destinationModels: ReadonlyArray<DestinationModel> = [
    'ims_User',
  ];

  convert(
    record: AirbyteRecord,
    ctx: StreamContext
  ): ReadonlyArray<DestinationRecord> {
    const source = this.streamName.source;
    const user = record.record.data as User;

    const username = `${user.first_name} ${user.last_name}`;

    return [
      {
        model: 'ims_User',
        record: {
          uid: user.id,
          email: user.email,
          name: username,
          source,
        },
      },
    ];
  }
}
