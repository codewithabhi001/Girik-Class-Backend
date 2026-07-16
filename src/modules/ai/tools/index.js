import { createClientTool } from './client.tools.js';
import { createJobTool } from './job.tools.js';
import { searchClientsTool, searchVesselsTool, searchCertificateTypesTool, searchFlagsTool } from './query.tools.js';
import { createVesselTool } from './vessel.tools.js';

export const allTools = [
    createClientTool,
    createJobTool,
    searchClientsTool,
    searchVesselsTool,
    searchCertificateTypesTool,
    searchFlagsTool,
    createVesselTool
];

export const getToolByName = (name) => {
    return allTools.find(tool => tool.name === name);
};
