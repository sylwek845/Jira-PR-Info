module.exports = {
    constructBodyTemplate: ({fields, JiraUrl, jiraId}) => {
        const {description, summary} = fields;
        let updatedDescription = description.toString().replace(/\[https(.*?)\]/, '<https$1>');
        return `# ${summary} - [${jiraId}](${JiraUrl} "${jiraId}")\n## :bulb: Jira Info\n${updatedDescription}`.trim();
    }
}