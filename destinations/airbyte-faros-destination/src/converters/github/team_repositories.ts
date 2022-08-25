import {AirbyteRecord} from 'faros-airbyte-cdk';

import {DestinationModel, DestinationRecord} from '../converter';
import {GitHubConverter} from './common';

// Returns the "platform" of the compute_Application resource for a given repo,
// or undefined if the repo should not be classed as an application
function getApplicationPlatform(repo: string): string | undefined {
  if (/^web-mfe-/.test(repo)) {
    return 'S3';
  }

  if ([/^api-/, /^primary-care-api-/].some((re) => re.test(repo))) {
    return 'ECR';
  }

  return undefined;
}

type TeamRepository = {
  name: string;
  team_slug: string;
  organization: string;
};

/**
 * Custom Elephant converter
 * Consumes from custom team_repositories stream from the Elephant forked GitHub source
 * Writes elephant_TeamRepositoryAssociation records,
 * and compute_Application records if the repository contains an MFE or service
 */
export class TeamRepositories extends GitHubConverter {
  readonly destinationModels: ReadonlyArray<DestinationModel> = [
    'elephant_TeamRepositoryAssociation',
    'compute_ApplicationSource',
  ];

  async convert(
    record: AirbyteRecord
  ): Promise<ReadonlyArray<DestinationRecord>> {
    const source = this.streamName.source;
    const repo = record.record.data as TeamRepository;
    if (repo.organization !== 'elephant-healthcare') {
      return [];
    }

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

    const applicationPlatform = getApplicationPlatform(repo.name);
    if (applicationPlatform) {
      entities.push({
        model: 'compute_ApplicationSource',
        record: {
          application: {
            uid: JSON.stringify({
              name: repo.name,
              platform: applicationPlatform,
            }),
          },
          repository,
        },
      });
    }

    return entities;
  }
}
