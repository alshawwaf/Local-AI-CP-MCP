"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const McpClient_node_1 = require("../nodes/McpClient/McpClient.node");
describe('McpClient Node', () => {
    let mcpClient;
    beforeEach(() => {
        mcpClient = new McpClient_node_1.McpClient();
    });
    it('should have the correct node type', () => {
        expect(mcpClient.description.name).toBe('mcpClient');
    });
    it('should have properties defined', () => {
        expect(mcpClient.description.properties).toBeDefined();
    });
});
//# sourceMappingURL=McpClient.test.js.map