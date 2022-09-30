/**
 * Returns a key/value object containing all variables relevant for the activity.
 *
 * That includes project level variables, plus any variables visible for
 * the relevant environment for the activity, if any.
 *
 * Note that JSON-encoded values will show up as a string, and need to be
 * decoded with JSON.parse().
 */
function getEnvironmentVariables() {
  return activity.payload.deployment.variables.reduce(
    (vars, { name, value }) => ({
      ...vars,
      [name]: value,
    }),
    {}
  );
}

const ENV_VARIABLES = getEnvironmentVariables();

/**
 * Sends a color-coded formatted message to Slack.
 *
 * You must first configure a Platform.sh variable named "SLACK_URL".
 * That is the group and channel to which the message will be sent.
 *
 * To control what events it will run on, use the --events switch in
 * the Platform.sh CLI.
 *
 * @param {string} title
 *   The title of the message block to send.
 * @param {string} message
 *   The message body to send.
 */
function sendSlackMessage(activity) {
  const url = ENV_VARIABLES.SLACK_URL;

  if (!url) {
    throw new Error("You must define a SLACK_URL project variable.");
  }

  const environmentUrl = `https://${activity.payload.environment.edge_hostname}`;
  const consoleUrl = `https://console.platform.sh/org/${activity.project}/${activity.payload.environment.id}`;
  const activityUrl = `https://console.platform.sh/org/${activity.project}/${activity.payload.environment.id}/log/${activity.id}`;

  const body = {
    blocks: [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": ":rocket: " + activity.text
            }
        },
        {
            "type": "context",
            "elements": [
                {
                    "text": "*"+ activity.project +"* | "+ activity.type,
                    "type": "mrkdwn"
                }
            ]
        },
        {
            "type": "divider"
        },
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "Access Environment"
                    },
                    "style": "primary",
                    "url": environmentUrl
                },
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "Access Console"
                    },
                    "style": "danger",
                    "url": consoleUrl
                }
            ]
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": ":computer: *Activity logs*"
            },
            "accessory": {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "View logs",
                    "emoji": true
                },
                "url": activityUrl
            }
        },
        {
            "type": "divider"
        },
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": "With :heart: from *Platform.sh*."
                }
            ]
        }
    ]
  };

  const resp = fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    console.log("Sending slack message failed: " + resp.body.text());
  }
}

sendSlackMessage(activity);