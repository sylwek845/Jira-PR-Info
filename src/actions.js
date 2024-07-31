
const core = require('@actions/core');
const github = require('@actions/github');
const {Octokit} = require("@octokit/rest");
const fetchDescription = require('./fetchDescription')
const util = require('./util');

export async function addPrInfo() {
    try {
        let title = getPullRequestTitle();
        const branchName = getPullRequestBranchName();
        const addIdToTitle = true // TODO - config var
        const regex = RegExp("\\b[A-Z]{3,4}-\\d{1,4}\\b");
        const {context} = github;

        let jiraId = null;

        if (regex.test(title)) {
            jiraId = title.match(regex)[0];
            core.debug(`Found match in title - ${jiraId}`);
        } else if (regex.test(branchName)) {
            jiraId = branchName.match(regex)[0];
            if (addIdToTitle) {
                title = `[${jiraId}] - ${title}`
            }
            core.debug(`Found match in branch - ${jiraId}`);
        }

        if (jiraId == null) {
            core.debug(`Regex ${regex} failed with title ${title}`);
            core.info("Ticket Finding Failed");
            core.setFailed("PullRequest title does not start with any Jira Issue key.");
            return;
        }

        const token = core.getInput('token', {required: true});
        const orgUrl = core.getInput('orgUrl', {required: true});
        const jiraToken = core.getInput('jiraToken', {required: true});
        const jiraUsername = core.getInput('JiraUsername', {required: true});
        const authToken = Buffer.from(`${jiraUsername}:${jiraToken}`).toString('base64');
        const client = new Octokit({
            auth: token
        });

        const pull_number = context.payload.pull_request.number;
        const owner = context.payload.repository.owner.login;
        const repo = context.payload.pull_request.base.repo.name;
        const jiraApiUrl = `${orgUrl}/rest/api/2/issue/${jiraId}`;
        const JiraUrl = `${orgUrl}/browse/${jiraId}`;
        const fields = await fetchDescription({
            authToken,
            jiraApiUrl
        });
        const updatedJiraBody = util.constructBodyTemplate({
            fields,
            JiraUrl,
        });
        core.debug(`#######body ::: ${updatedJiraBody}\n\n`);
        let currentBody = context.payload.pull_request.body
        core.debug(`#######currentBody ::: ${currentBody}`);
        let updatedPRBody = currentBody.replace('<!--jira-body-here-->', `${updatedJiraBody}`);
        core.debug(`#######updatedBody ::: ${updatedPRBody}`);
        let body = `${updatedPRBody}`

        await client.rest.pulls.update({
            owner,
            repo,
            pull_number,
            title,
            body,
        })
    } catch (e) {
        core.setFailed(`process failed with ::: ${e.message}`);
    }
}

const getPullRequestBranchName = () => {
    const pull_request = github.context.payload.pull_request;
    core.debug(
        `Pull Request: ${JSON.stringify(github.context.payload.pull_request)}`
    );
    if (pull_request == undefined || pull_request.title == undefined) {
        const message = "This action should only be run with Pull Request Events";
        throw new Error(message);
    }
    return pull_request.branchName;
};

const getPullRequestTitle = () => {
    const pull_request = github.context.payload.pull_request;
    core.debug(
        `Pull Request: ${JSON.stringify(github.context.payload.pull_request)}`
    );
    if (pull_request == undefined || pull_request.title == undefined) {
        const message = "This action should only be run with Pull Request Events";
        throw new Error(message);
    }
    return pull_request.title;
};
