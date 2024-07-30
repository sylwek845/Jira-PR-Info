const core = require('@actions/core');
const github = require('@actions/github');
const {Octokit} = require("@octokit/rest");
const fetchDescription = require('./fetchDescription')
const util = require('./util');
const addprdescription = async () => {
    try {
        const title = getPullRequestTitle();
        const branchName = getPullRequestBranchName();
        const regex = getRegex();

        let jiraId = null;

        if (regex.test(title)) {
            jiraId = title.match(regex)[0];
        } else if (regex.test(branchName)) {
            jiraId = branchName.match(regex)[0];
        }

        if (!jiraId) {
            core.debug(`Regex ${regex} failed with title ${title}`);
            core.info("Title Failed");
            core.setFailed("PullRequest title does not start with any Jira Issue key.");
            return;
        }

        const token = core.getInput('token', {required: true});
        const orgUrl = core.getInput('orgUrl', {required: true});
        const jiraToken = core.getInput('jiraToken', {required: true});
        const orgSonarQubeUrl = (core.getInput('sonarQubeUrl', {required: false}) || false);
        const jiraUsername = core.getInput('JiraUsername', {required: true});
        const authToken = Buffer.from(`${jiraUsername}:${jiraToken}`).toString('base64');
        const client = new Octokit({
            auth: token
        });
        const {context} = github;
        const pull_number = context.payload.pull_request.number;
        const owner = context.payload.repository.owner.login;
        const repo = context.payload.pull_request.base.repo.name;
        const jiraApiUrl = `${orgUrl}/rest/api/2/issue/${jiraId}`;
        const JiraUrl = `${orgUrl}/browse/${jiraId}`;
        const sonarQubeUrl = (orgSonarQubeUrl ? `${orgSonarQubeUrl}/dashboard?id=${repo}&pullRequest=${pull_number}` : "");
        const fields = await fetchDescription({
            authToken,
            jiraApiUrl
        });
        const updatedJiraBody = util.constructBodyTemplate({
            fields,
            JiraUrl,
            sonarQubeUrl
        });
        core.info(`body ::: ${updatedJiraBody}`);
        let currentBody = context.payload.pull_request.body
        const updatedCurrentBody = currentBody.replace('--jira-body-here--', `${updatedJiraBody}`);

        await client.rest.pulls.update({
            owner,
            repo,
            pull_number,
            updatedCurrentBody,
        })
    } catch (e) {
        core.setFailed(`process failed with ::: ${e.message}`);
    }
}
const getRegex = () => {
    return new RegExp("\\b[A-Z]{3,4}-\\d{1,4}\\b");
    const projectKeyInput = core.getInput("projectKey", {required: false});
    const projectKeysInput = core.getMultilineInput("projectKeys", {
        required: false,
    });
    const separator = core.getInput("separator", {required: false});
    const keyAnywhereInTitle = true;

    core.debug(`Project Key ${projectKeyInput}`);
    core.debug(`Project Keys ${projectKeysInput}`);
    core.debug(`Separator ${separator}`);

    if (stringIsNullOrWhitespace(projectKeyInput) && projectKeysInput.length < 1)
        return [getDefaultJiraIssueRegex()];

    const projectKeys = projectKeysInput.map((projectKey) =>
        projectKey.replaceAll(/'/g, "")
    );

    if (!stringIsNullOrWhitespace(projectKeyInput)) {
        projectKeys.push(projectKeyInput);
    }

    const escapedProjectKeys = projectKeys.map((projectKey) =>
        escaperegexp(projectKey)
    );

    escapedProjectKeys.forEach((projectKey) => {
        if (!isValidProjectKey(projectKey)) {
            const message = `ProjectKey ${projectKey} is not valid`;
            throw new Error(message);
        }
    });

    const allPossibleRegex = [];

    if (stringIsNullOrWhitespace(separator)) {
        escapedProjectKeys.forEach((projectKey) => {
            allPossibleRegex.push(
                getRegexWithProjectKey(projectKey, keyAnywhereInTitle)
            );
        });
        return allPossibleRegex;
    }

    const escapedSeparator = escaperegexp(separator);

    escapedProjectKeys.forEach((projectKey) => {
        allPossibleRegex.push(
            getRegexWithProjectKeyAndSeparator(
                projectKey,
                escapedSeparator,
                keyAnywhereInTitle
            )
        );
    });
    return allPossibleRegex;
};

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

const getDefaultJiraIssueRegex = () =>
    new RegExp(
        "(?<=^|[a-z]-|[\\s\\p{P}&[^\\-])([A-Z][A-Z0-9_]*-\\d+)(?![^\\W_])(\\s)+(.)+",
        "u"
    );

const isValidProjectKey = (projectKey) =>
    /(?<=^|[a-z]-|[\s\p{P}&[^-])([A-Z][A-Z0-9_]*)/u.test(projectKey);

const getRegexWithProjectKeyAndKeyAnywhereInTitle = (projectKey, keyAnywhereInTitle) =>
    `${keyAnywhereInTitle ? "(.)*" : ""}(${
        keyAnywhereInTitle ? "" : "^"
    }${projectKey}-){1}`;

const getRegexWithProjectKey = (projectKey, keyAnywhereInTitle) =>
    new RegExp(
        `${getRegexWithProjectKeyAndKeyAnywhereInTitle(
        projectKey,
        keyAnywhereInTitle
      )}(\\d)+(\\s)+(.)+`
    );

const getRegexWithProjectKeyAndSeparator = (projectKey, separator, keyAnywhereInTitle) =>
    new RegExp(
        `${getRegexWithProjectKeyAndKeyAnywhereInTitle(
        projectKey,
        keyAnywhereInTitle
      )}(\\d)+(${separator})+(\\S)+(.)+`
    );

const stringIsNullOrWhitespace = (str) =>
    str == null || str.trim() === "";
module.exports = {
    addprdescription
}
