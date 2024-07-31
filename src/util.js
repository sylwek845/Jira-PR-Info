module.exports = {
    constructBodyTemplate: ({fields, JiraUrl}) => {
        const {description, summary} = fields;
        const body = `## Jira Ticket\n${JiraUrl} \n\n# Description\n\n### ${summary}\n\n ${description}\n\n`
        return body;
    }
}