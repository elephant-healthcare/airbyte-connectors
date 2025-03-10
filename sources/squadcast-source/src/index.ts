import {Command} from 'commander';
import {
  AirbyteLogger,
  AirbyteSourceBase,
  AirbyteSourceRunner,
  AirbyteSpec,
  AirbyteStreamBase,
} from 'faros-airbyte-cdk';
import VError from 'verror';

import {Squadcast, SquadcastConfig} from './squadcast';
import {Events, Incidents, Services, Users} from './streams';

/** The main entry point. */
export function mainCommand(): Command {
  const logger = new AirbyteLogger();
  const source = new SquadcastSource(logger);
  return new AirbyteSourceRunner(logger, source).mainCommand();
}

/** SquadCast source implementation. */
export class SquadcastSource extends AirbyteSourceBase<SquadcastConfig> {
  async spec(): Promise<AirbyteSpec> {
    return new AirbyteSpec(require('../resources/spec.json'));
  }
  async checkConnection(config: SquadcastConfig): Promise<[boolean, VError]> {
    try {
      const squadcast = await Squadcast.instance(config, this.logger);
      await squadcast.checkConnection();
    } catch (err: any) {
      return [false, err];
    }
    return [true, undefined];
  }
  streams(config: SquadcastConfig): AirbyteStreamBase[] {
    return [
      new Events(config, this.logger),
      new Incidents(config, this.logger),
      new Services(config, this.logger),
      new Users(config, this.logger),
    ];
  }
}
