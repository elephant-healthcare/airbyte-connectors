import {AirbyteRecord} from 'faros-airbyte-cdk';

import {DestinationModel, DestinationRecord} from '../converter';
import {GitHubConverter} from './common';

export class Teams extends GitHubConverter {
  readonly destinationModels: ReadonlyArray<DestinationModel> = ['ims_Team'];

  async convert(
    record: AirbyteRecord
  ): Promise<ReadonlyArray<DestinationRecord>> {
    const source = this.streamName.source;
    const team = record.record.data;

    const out = {
      model: 'ims_Team',
      record: {
        uid: team.slug,
        name: team.name,
        source,
      },
    };

    return [out];
  }
}
