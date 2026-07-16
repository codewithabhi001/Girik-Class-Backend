import { createClientTool } from './client.tools.js';

export const allTools = [
    createClientTool
];

export const getToolByName = (name) => {
    return allTools.find(tool => tool.name === name);
};
