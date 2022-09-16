import {AirbyteRecord} from 'faros-airbyte-cdk';

import {
  DestinationModel,
  DestinationRecord,
  StreamContext,
  StreamName,
} from '../converter';
import {GitHubConverter} from './common';

export class TeamMembers extends GitHubConverter {
  readonly destinationModels: ReadonlyArray<DestinationModel> = [
    'vcs_Membership',
  ];

  private readonly teamsStream = new StreamName('github', 'teams');
  private readonly usersStream = new StreamName('github', 'users');

  override get dependencies(): ReadonlyArray<StreamName> {
    return [this.teamsStream, this.usersStream];
  }

  // TODO: depend on teams and Users
  // get ids from context

  async convert(
    record: AirbyteRecord
    // ctx: StreamContext
  ): Promise<ReadonlyArray<DestinationRecord>> {
    const source = this.streamName.source;
    const teamMembership = record.record.data;

    const {organization, team_slug, login} = teamMembership;

    // should patch the existing record
    const out = {
      model: 'vcs_Membership',
      record: {
        organization: {source, uid: organization},
        team: {source, uid: team_slug},
        user: {source, uid: login},
        source,
      },
    };

    return [out];
  }
}
