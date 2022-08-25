import {
  AirbyteConfig,
  AirbyteLogger,
  AirbyteStreamBase,
  StreamKey,
  SyncMode,
} from 'faros-airbyte-cdk';
import {Dictionary} from 'ts-essentials';

import GrafanaIncidentClient, {Incident} from '../GrafanaIncidentClient';

export class Incidents extends AirbyteStreamBase {
  private client: GrafanaIncidentClient;

  constructor(logger: AirbyteLogger, private config: AirbyteConfig) {
    super(logger);
    this.client = new GrafanaIncidentClient(config);
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
  ): AsyncGenerator<Incident> {
    const lastCutoff: number = streamState?.cutoff ?? 0;
    if (lastCutoff > Date.now()) {
      this.logger.info(
        `Last cutoff ${lastCutoff} is greater than current time`
      );
      return;
    }

    const fromDate = syncMode === SyncMode.FULL_REFRESH ? 0 : lastCutoff;

    for await (const incident of this.client.getIncidents(fromDate)) {
      // Override the overviewURL to prepend the Grafana instance URL to the path
      yield {
        ...incident,
        overviewURL:
          incident.overviewURL &&
          `${this.config.server_url}${incident.overviewURL}`,
      };
    }
  }

  getUpdatedState(
    currentStreamState: Dictionary<any>,
    latestRecord: Incident
  ): Dictionary<any> {
    const nextCutoff = Math.max(
      currentStreamState.cutoff ?? 0,
      new Date(latestRecord.modifiedTime).getTime() ?? 0
    );
    return {cutoff: nextCutoff};
  }
}
