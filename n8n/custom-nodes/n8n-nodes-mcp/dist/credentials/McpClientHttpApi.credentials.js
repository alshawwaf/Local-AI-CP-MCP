"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpClientHttpApi = void 0;
class McpClientHttpApi {
    constructor() {
        this.name = 'mcpClientHttpApi';
        this.displayName = 'MCP Client (HTTP Streamable) API';
        this.icon = 'file:mcpClient.svg';
        this.properties = [
            {
                displayName: 'HTTP Stream URL',
                name: 'httpStreamUrl',
                type: 'string',
                default: 'http://localhost:3001/stream',
                required: true,
                description: 'URL of the HTTP stream endpoint for the MCP server',
            },
            {
                displayName: 'HTTP Connection Timeout',
                name: 'httpTimeout',
                type: 'number',
                default: 60000,
                required: false,
                description: 'Timeout for the HTTP stream connection in milliseconds. Default is 60 seconds.',
            },
            {
                displayName: 'Messages Post Endpoint',
                name: 'messagesPostEndpoint',
                type: 'string',
                default: '',
                description: 'Optional custom endpoint for posting messages (if different from HTTP stream URL)',
            },
            {
                displayName: 'Additional Headers',
                name: 'headers',
                type: 'string',
                default: '',
                description: 'Additional headers to send in the request in NAME=VALUE format, separated by commas (e.g., BRAVE_API_KEY=xyz,OPENAI_API_KEY=abc)',
            },
        ];
    }
}
exports.McpClientHttpApi = McpClientHttpApi;
//# sourceMappingURL=McpClientHttpApi.credentials.js.map