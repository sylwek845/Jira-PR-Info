/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 665:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const core = __nccwpck_require__(535);
const github = __nccwpck_require__(993);
const { Octokit } = __nccwpck_require__(870);
const fetchDescription = __nccwpck_require__(604)
const util = __nccwpck_require__(304);
const addprdescription = async() => {
    try {
        const title = getPullRequestTitle();
        const branchName = getPullRequestBranchName();
        const allPossibleRegex = getRegex();

        let jiraId = null;
        for (const regex of allPossibleRegex) {
            const match = title.match(regex);
            if (match) {
                jiraId = match[0];
                break;
            }
            const matchBranch = branchName.match(regex);
            if (matchBranch) {
                jiraId = match[0];
                break;
            }
        }

        if(!matchedValue) {
            core.debug(`Regex ${allPossibleRegex} failed with title ${title}`);
            core.info("Title Failed");
            core.setFailed("PullRequest title does not start with any Jira Issue key.");
            return;
        }

        const token = core.getInput('token',{required:true});
        const orgUrl = core.getInput('orgUrl',{required:true});
        const jiraToken = core.getInput('jiraToken',{required:true});
        const orgSonarQubeUrl = (core.getInput('sonarQubeUrl',{required:false}) || false);
        const jiraUsername = core.getInput('JiraUsername',{required:true});
        const authToken = Buffer.from(`${jiraUsername}:${jiraToken}`).toString('base64');
        const client = new Octokit({
            auth: token
        });
        const { context } = github;
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
        core.info(`body ::: ${body}`);
        let currentBody = await client.rest.pulls.body
        const updatedCurrentBody = currentBody.replace('--jira-body-here--', `${updatedJiraBody}`);

        await client.rest.pulls.update({
            owner,
            repo,
            pull_number,
            updatedCurrentBody,
        })
    }
    catch (e) {
        core.setFailed(`process failed with ::: ${e.message}`);
    }
}
const getRegex = () => {
    const projectKeyInput = core.getInput("projectKey", { required: false });
    const projectKeysInput = core.getMultilineInput("projectKeys", {
      required: false,
    });
    const separator = core.getInput("separator", { required: false });
    const keyAnywhereInTitle = core.getBooleanInput("keyAnywhereInTitle", {
      required: false,
    });
  
    core.debug(`Project Key ${projectKeyInput}`);
    core.debug(`Project Keys ${projectKeysInput}`);
    core.debug(`Separator ${separator}`);
    core.debug(`Key Anywhere In Title ${keyAnywhereInTitle}`);
  
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
  
  const getRegexWithProjectKeyAndKeyAnywhereInTitle = (
    projectKey,
    keyAnywhereInTitle
  ) =>
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
  
  const getRegexWithProjectKeyAndSeparator = (
    projectKey,
    separator,
    keyAnywhereInTitle
  ) =>
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


/***/ }),

/***/ 604:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const core = __nccwpck_require__(535);
module.exports = async({authToken,jiraApiUrl}) => {
    try{
    core.info('fetching...')
    const response = await fetch(jiraApiUrl,{
        headers:{ 
            Authorization: `Basic ${authToken}` } 
        });
        if(response.ok){
             const { fields } = await response.json() ; 
             return fields;
        }
        else{
            throw new Error(`Failed to fetch response from jira api, please check Organisation url , jira token , jira username :::: ${ response}`);
        }
    }
    catch(e){
        core.setFailed(e.message);
        process.exit(1)
    }
}

/***/ }),

/***/ 304:
/***/ ((module) => {

module.exports = {
    constructBodyTemplate: ({fields,sonarQubeUrl,JiraUrl})=>{
        const { description , summary} = fields;
        const body = `# Description\n\n### ${summary}\n\n ${description}\n\n## Jira Ticket\n${JiraUrl}\n\n${ sonarQubeUrl ? `\n\n## Sonar Results:\n${sonarQubeUrl}`:""}\n\n## Checklist:\n - [ ] Code follows the coding style guidelines.\n - [ ] Tests have been added or updated.\n - [ ] Documentation has been updated if necessary.`
        return body;
    }
}

/***/ }),

/***/ 535:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 993:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 870:
/***/ ((module) => {

module.exports = eval("require")("@octokit/rest");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const trigger = __nccwpck_require__(665);
const core = __nccwpck_require__(535);
trigger.addprdescription()
.catch(error=>{
    core.setFailed(error.message);
});

})();

module.exports = __webpack_exports__;
/******/ })()
;