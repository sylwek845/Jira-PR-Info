const trigger = require('./actions');
const core = require('@actions/core');
trigger.addPrInfo()
.catch(error=>{
    core.setFailed(error.message);
});
