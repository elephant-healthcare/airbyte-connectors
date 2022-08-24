import {AirbyteRecord} from 'faros-airbyte-cdk';
import {Utils} from 'faros-feeds-sdk';

import {
  Converter,
  DestinationModel,
  DestinationRecord,
  StreamContext,
} from '../converter';
import {Incident} from './types';

// Fields like severity, priority and status store a JSON objct
// We are not grouping by category yet, so use the name for both
function categoryAndDetail<T extends string>(
  name: T
): {
  category: T;
  detail: T;
} {
  return {category: name, detail: name};
}

// KNOWN LIMITATIONS:
// - Does not ingest tasks - these must be linked to tms_Task
//
export class Incidents extends Converter {
  source = 'GrafanaIncident';

  readonly destinationModels: ReadonlyArray<DestinationModel> = [
    'ims_Incident',
    'ims_IncidentAssignment',
    'ims_Label',
    'ims_IncidentTag',
    'ims_Team',
    'ims_TeamIncidentAssociation',
    'ims_User',
  ];

  id(record: AirbyteRecord): any {
    const data = record?.record?.data as Incident | undefined;
    return data?.incidentID;
  }

  async convert(
    record: AirbyteRecord,
    _ctx: StreamContext
  ): Promise<ReadonlyArray<DestinationRecord>> {
    const source = this.streamName.source;
    const incident = record.record.data as Incident | undefined;
    const res: DestinationRecord[] = [];

    if (!incident) return res;

    const {incidentID} = incident;

    res.push({
      model: 'ims_Incident',
      record: {
        uid: incidentID,
        source,
        title: incident.title,
        description: incident.description,
        // TODO: Use config for URL - maybe put in the source instead and just map the url
        url:
          incident.overviewURL &&
          `https://elephanthealthcare.grafana.net${incident.overviewURL}`,

        createdAt: Utils.toDate(incident.incidentStart),
        updatedAt: Utils.toDate(incident.modifiedTime),
        acknowledgedAt: Utils.toDate(incident.createdTime),
        resolvedAt: Utils.toDate(incident.incidentEnd),
        severity: categoryAndDetail(incident.severity),
        status: categoryAndDetail(incident.status),
      },
    });

    // Users with "commander" or "investigator" roles will be assigned to the incident
    const assignee = incident.roles?.find(({role}) =>
      ['commander', 'investigator'].includes(role)
    )?.user;
    if (assignee) {
      const {userID, email, name} = assignee;
      res.push({
        model: 'ims_User',
        record: {
          uid: userID,
          source,
          name,
          email,
        },
      });

      res.push({
        model: 'ims_IncidentAssignment',
        record: {
          incident: {uid: incidentID, source},
          assignee: {uid: userID, source},
        },
      });
    }

    // Ingest and assign labels
    incident.labels.forEach(({label}) => {
      res.push({
        model: 'ims_Label',
        record: {
          name: label,
          source,
        },
      });

      res.push({
        model: 'ims_IncidentTag',
        record: {
          incident: {uid: incidentID, source},
          label: {name: label},
        },
      });

      // TODO: configuration option for this
      // Labels starting with team: should be used to assign the incident to a team
      const teamRe = /^team:(\w+)$/;
      const teamMatches = teamRe.exec(label);
      if (teamMatches) {
        const [, team] = teamMatches;

        // Using GitHub source for team, assuming they have already been ingested
        // This will map incidents to existing team records rather than creating new "Grafana Incident" teams
        const teamSource = 'GitHub';

        res.push({
          model: 'ims_Team',
          record: {
            uid: team,
            name: team,
            source: teamSource,
          },
        });

        res.push({
          model: 'ims_TeamIncidentAssociation',
          record: {
            incident: {uid: incidentID, source},
            team: {uid: team, source: teamSource},
          },
        });
      }
    });

    // (POST MVP ISSUE) ims_User will have email only, but tms_User does not have emailAddress - why?

    return res;
  }
}
