import {AirbyteRecord} from 'faros-airbyte-cdk';

import {DestinationModel, DestinationRecord} from '../converter';
import {GitHubConverter} from './common';

// Returns the id of the compute_Application resource for a given repo,
// or undefined if the repo should not be classed as an application
function getApplicationId(repo: string): string | undefined {
  if (/^web-mfe-/.test(repo)) {
    return `{"name":"${repo}","platform":"S3"}`;
  }

  if ([/^api-/, /^primary-care-api-/].some((re) => re.test(repo))) {
    return `{"name":"${repo}","platform":"ECR"}`;
  }

  return undefined;
}

export class TeamRepositories extends GitHubConverter {
  readonly destinationModels: ReadonlyArray<DestinationModel> = [
    'elephant_TeamRepositoryAssociation',
    'compute_ApplicationSource',
  ];

  async convert(
    record: AirbyteRecord
  ): Promise<ReadonlyArray<DestinationRecord>> {
    const source = this.streamName.source;
    const repo = record.record.data;

    // Consumes from custom team_repositories stream from the forked GitHub source
    // Writes elephant_TeamRepositoryAssociation records,
    // and compute_Application records if the repository contains an MFE or service

    const repository = {
      uid: repo.name,
      organization: {uid: repo.organization, source},
      source,
    };

    const entities: DestinationRecord[] = [
      {
        model: 'elephant_TeamRepositoryAssociation',
        record: {
          team: {uid: repo.team_slug, source},
          repository,
          source,
        },
      },
    ];

    const applicationId = getApplicationId(repo.name);
    if (applicationId) {
      entities.push({
        model: 'compute_ApplicationSource',
        record: {
          application: {uid: applicationId},
          repository,
        },
      });
    }

    // next steps
    // PR both source and destinations into our fork, and release new versions
    // Configure airbyte to use our forks
    // Close off linear tickets
    // Write up linear tickets for incident ingestion

    return entities;
  }
}
