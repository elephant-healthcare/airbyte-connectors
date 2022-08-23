import {Command} from 'commander';
import {
  AirbyteConfig,
  AirbyteLogger,
  AirbyteSourceBase,
  AirbyteSourceRunner,
  AirbyteSpec,
  AirbyteStreamBase,
} from 'faros-airbyte-cdk';
import VError from 'verror';

import GrafanaIncidentClient from './GrafanaIncidentClient';
import {Incidents} from './streams';

/** The main entry point. */
export function mainCommand(): Command {
  const logger = new AirbyteLogger();
  const source = new GrafanaIncidentSource(logger);
  return new AirbyteSourceRunner(logger, source).mainCommand();
}

class GrafanaIncidentSource extends AirbyteSourceBase {
  async spec(): Promise<AirbyteSpec> {
    return new AirbyteSpec(require('../resources/spec.json'));
  }
  async checkConnection(config: AirbyteConfig): Promise<[boolean, VError]> {
    const client = new GrafanaIncidentClient(config);

    try {
      this.logger.info('Checking now');
      await client.check();
      this.logger.info('Success');
      return [true, undefined];
    } catch (err) {
      this.logger.error('Error');
      return [false, err as VError];
    }
  }
  streams(config: AirbyteConfig): AirbyteStreamBase[] {
    const client = new GrafanaIncidentClient(config);
    return [new Incidents(this.logger, client)];
  }
}
