import axios, {Axios} from 'axios';
import {AirbyteConfig} from 'faros-airbyte-cdk/lib';

// TODO
export type Incident = {
  modifiedTime: string;
};

export default class GrafanaIncidentClient {
  private client: Axios;

  constructor(config: AirbyteConfig) {
    this.client = axios.create({
      baseURL: `${config.server_url}/api/plugins/grafana-incident-app/resources/api/`,
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
    });
  }

  async check(): Promise<void> {
    await this.client.get('/org');
  }

  // TODO: tests for
  // - incremental vs full refresh
  // - fromDate being provided properly
  // - cursor automatically fetching next
  async *getIncidents(fromDate?: number): AsyncGenerator<Incident[]> {
    let hasMore = false;
    let nextValue = '';

    do {
      const res = await this.client.post('IncidentsService.QueryIncidents', {
        query: {
          limit: 100,
          includeStatuses: [],
          onlyDrills: false,
          dateFrom: fromDate ? `${fromDate}` : '',
          dateTo: '',
          excludeStatuses: [],
          incidentLabels: [],
          orderDirection: 'DESC',
          severity: '',
        },
        cursor: {hasMore, nextValue},
      });

      const {cursor, incidents} = res.data;

      // Yield data from this call
      for (const incident of incidents) {
        yield incident;
      }

      ({hasMore, nextValue} = cursor);
    } while (hasMore);
  }
}
