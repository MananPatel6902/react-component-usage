/* Copyright 2022 J.P. Morgan Chase & Co.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
    the License. You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
    specific language governing permissions and limitations under the License. 
    
    SPDX-License-Identifier: Apache-2.0 
*/

const loadRuleConfigs = require('./loadRuleConfigs');
const findStartFile = require('./findStartFile');
const getDependencyTree = require('./getDependencyTree');
const parser = require('./parser');
const runRules = require('./runRules');
const {
  accumulateResponse,
  getFinalResponse
} = require('./responseAccumulator');
const postData = require('./postData');

async function orchestrator({
  entryFile,
  baseDir,
  ruleDefinitionPath,
  externalApiConfig: {
    ruleRequestApiUrl,
    ruleRequestConfigPath,
    ruleResponseApiUrl
  },
  metaData
}) {

 
  try {
    const ruleConfigs = await loadRuleConfigs(ruleRequestApiUrl, ruleRequestConfigPath);
    const startFile = findStartFile(entryFile, baseDir);
    const files = await getDependencyTree(startFile, baseDir);

    await Promise.all(files.map(async (file) => {
      const { ast, language } = parser(file, baseDir);
      const finalResponse = runRules({ ast, ruleConfigs, language, file, metaData, ruleDefinitionPath });
      accumulateResponse(finalResponse);
    }));

    const response = getFinalResponse();
    await postData(ruleResponseApiUrl, response);
  } catch (error) {
    console.error('Error in orchestrator:', error);
    throw error;
  }

}

module.exports = orchestrator;
