const TurndownService = require('turndown');
const turndownPluginGfm = require('turndown-plugin-gfm');
const turndownService = new TurndownService({ 
    headingStyle: 'atx'
});
turndownService.use(turndownPluginGfm.gfm);

// Add custom rule for tt tags
turndownService.addRule('tt', {
    filter: ['tt'],
    replacement: function(content) {
        return '`' + content + '`';
    }
});

// Add custom rule for pre tags
turndownService.addRule('pre', {
    filter: ['pre'],
    replacement: function(content) {
        return '\n```\n' + content + '\n```\n';
    }
});

module.exports = {
    constructBodyTemplate: ({fields, renderedFields, JiraUrl, jiraId}) => {
        const description = renderedFields.description;
        const summary = fields.summary;
        let updatedDescription

        if (description == null) {
            updatedDescription = "No Summary Found in Jira Ticket"
        } else {
            updatedDescription = turndownService.turndown(description);
        }
        return `**[${jiraId}](${JiraUrl} "${jiraId}") - ${summary}**\n## :bulb: Jira Info\n${updatedDescription}`.trim();
    }
}