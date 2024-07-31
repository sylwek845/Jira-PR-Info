module.exports = {
    constructBodyTemplate: ({fields, JiraUrl, jiraId}) => {
        const {description, summary} = fields;
        let checkedDesc
        if (description == null) {
            checkedDesc = "No Summary Found in Jira Ticket"
        } else {
            checkedDesc = description
        }
        let updatedDescription = checkedDesc.toString().replace(/\[https(.*?)\]/, '<https$1>');
        return `# ${summary} - [${jiraId}](${JiraUrl} "${jiraId}")\n## :bulb: Jira Info\n${updatedDescription}`.trim();
    }
}