import {
  AirbyteLogger,
  AirbyteStreamBase,
  StreamKey,
  SyncMode,
} from 'faros-airbyte-cdk';
import {Dictionary} from 'ts-essentials';

import GrafanaIncidentClient, {Incident} from '../GrafanaIncidentClient';

export class Incidents extends AirbyteStreamBase {
  constructor(logger: AirbyteLogger, private client: GrafanaIncidentClient) {
    super(logger);
  }

  getJsonSchema(): Dictionary<any, string> {
    return require('../../resources/schemas/incidents.json');
  }
  get primaryKey(): StreamKey {
    return ['incidentID', 'source'];
  }
  get cursorField(): string | string[] {
    return 'modifiedTime';
  }

  async *readRecords(
    syncMode: SyncMode,
    _cursorField?: string[],
    _streamSlice?: Dictionary<any, string>,
    streamState?: Dictionary<any, string>
  ): AsyncGenerator<Dictionary<any, string>, any, unknown> {
    const lastCutoff: number = streamState?.cutoff ?? 0;
    if (lastCutoff > Date.now()) {
      this.logger.info(
        `Last cutoff ${lastCutoff} is greater than current time`
      );
      return;
    }

    const fromDate = syncMode === SyncMode.FULL_REFRESH ? 0 : lastCutoff;

    for await (const incident of this.client.getIncidents(fromDate)) {
      yield incident;
    }
  }

  getUpdatedState(
    currentStreamState: Dictionary<any>,
    latestRecord: Incident
  ): Dictionary<any> {
    this.logger.info(`Current cutoff: ${currentStreamState.cutOff}`);
    const nextCutoff = Math.max(
      currentStreamState.cutoff ?? 0,
      new Date(latestRecord.modifiedTime).getTime() ?? 0
    );
    this.logger.info(`Current cutoff: ${currentStreamState.cutOff}`);
    this.logger.info(`Next cutoff: ${nextCutoff}`);
    return {
      cutoff: nextCutoff,
    };
  }
}
