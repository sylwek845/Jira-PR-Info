module.exports = {
    constructBodyTemplate: ({fields, JiraUrl, JiraId}) => {
        const {description, summary} = fields;
        let updatedDescription = description.toString().replace(/\[https(.*?)\]/, '<https$1>');
        return `
        #${summary} - [${JiraId}](${JiraUrl} "${JiraId}")\n\n
        
        > ${updatedDescription}
        `;
    }
}