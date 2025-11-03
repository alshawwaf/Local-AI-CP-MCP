"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpClient = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const zod_to_json_schema_1 = require("zod-to-json-schema");
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/client/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
class McpClient {
    constructor() {
        this.description = {
            displayName: 'MCP Client',
            name: 'mcpClient',
            icon: 'file:mcpClient.svg',
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["operation"]}}',
            description: 'Use MCP client',
            defaults: {
                name: 'MCP Client',
            },
            inputs: [{ type: "main" }],
            outputs: [{ type: "main" }],
            usableAsTool: true,
            credentials: [
                {
                    name: 'mcpClientApi',
                    required: false,
                    displayOptions: {
                        show: {
                            connectionType: ['cmd'],
                        },
                    },
                },
                {
                    name: 'mcpClientSseApi',
                    required: false,
                    displayOptions: {
                        show: {
                            connectionType: ['sse'],
                        },
                    },
                },
                {
                    name: 'mcpClientHttpApi',
                    required: false,
                    displayOptions: {
                        show: {
                            connectionType: ['http'],
                        },
                    },
                },
            ],
            properties: [
                {
                    displayName: 'Connection Type',
                    name: 'connectionType',
                    type: 'options',
                    options: [
                        {
                            name: 'Command Line (STDIO)',
                            value: 'cmd',
                        },
                        {
                            name: 'Server-Sent Events (SSE)',
                            value: 'sse',
                            description: 'Deprecated: Use HTTP Streamable instead',
                        },
                        {
                            name: 'HTTP Streamable',
                            value: 'http',
                            description: 'Use HTTP streamable protocol for real-time communication',
                        },
                    ],
                    default: 'cmd',
                    description: 'Choose the transport type to connect to MCP server',
                },
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        {
                            name: 'Execute Tool',
                            value: 'executeTool',
                            description: 'Execute a specific tool',
                            action: 'Execute a tool',
                        },
                        {
                            name: 'Get Prompt',
                            value: 'getPrompt',
                            description: 'Get a specific prompt template',
                            action: 'Get a prompt template',
                        },
                        {
                            name: 'List Prompts',
                            value: 'listPrompts',
                            description: 'Get available prompts',
                            action: 'List available prompts',
                        },
                        {
                            name: 'List Resource Templates',
                            value: 'listResourceTemplates',
                            description: 'Get a list of available resource templates',
                            action: 'List available resource templates',
                        },
                        {
                            name: 'List Resources',
                            value: 'listResources',
                            description: 'Get a list of available resources',
                            action: 'List available resources',
                        },
                        {
                            name: 'List Tools',
                            value: 'listTools',
                            description: 'Get available tools',
                            action: 'List available tools',
                        },
                        {
                            name: 'Read Resource',
                            value: 'readResource',
                            description: 'Read a specific resource by URI',
                            action: 'Read a resource',
                        },
                    ],
                    default: 'listTools',
                    required: true,
                },
                {
                    displayName: 'Resource URI',
                    name: 'resourceUri',
                    type: 'string',
                    required: true,
                    displayOptions: {
                        show: {
                            operation: ['readResource'],
                        },
                    },
                    default: '',
                    description: 'URI of the resource to read',
                },
                {
                    displayName: 'Tool Name',
                    name: 'toolName',
                    type: 'string',
                    required: true,
                    displayOptions: {
                        show: {
                            operation: ['executeTool'],
                        },
                    },
                    default: '',
                    description: 'Name of the tool to execute',
                },
                {
                    displayName: 'Tool Parameters',
                    name: 'toolParameters',
                    type: 'json',
                    required: true,
                    displayOptions: {
                        show: {
                            operation: ['executeTool'],
                        },
                    },
                    default: '{}',
                    description: 'Parameters to pass to the tool in JSON format',
                },
                {
                    displayName: 'Prompt Name',
                    name: 'promptName',
                    type: 'string',
                    required: true,
                    displayOptions: {
                        show: {
                            operation: ['getPrompt'],
                        },
                    },
                    default: '',
                    description: 'Name of the prompt template to get',
                },
            ],
        };
    }
    async execute() {
        var _a;
        const returnData = [];
        const operation = this.getNodeParameter('operation', 0);
        let transport;
        let connectionType = 'cmd';
        try {
            connectionType = this.getNodeParameter('connectionType', 0);
        }
        catch (error) {
            this.logger.debug('ConnectionType parameter not found, using default "cmd" transport');
        }
        let timeout = 600000;
        try {
            if (connectionType === 'http') {
                const httpCredentials = await this.getCredentials('mcpClientHttpApi');
                const { StreamableHTTPClientTransport } = await Promise.resolve().then(() => __importStar(require('@modelcontextprotocol/sdk/client/streamableHttp.js')));
                const httpStreamUrl = httpCredentials.httpStreamUrl;
                const messagesPostEndpoint = httpCredentials.messagesPostEndpoint || '';
                timeout = httpCredentials.httpTimeout || 60000;
                let headers = {};
                if (httpCredentials.headers) {
                    const headerLines = httpCredentials.headers.split('\n');
                    for (const line of headerLines) {
                        const equalsIndex = line.indexOf('=');
                        if (equalsIndex > 0) {
                            const name = line.substring(0, equalsIndex).trim();
                            const value = line.substring(equalsIndex + 1).trim();
                            if (name && value !== undefined) {
                                headers[name] = value;
                            }
                        }
                    }
                }
                const requestInit = { headers };
                if (messagesPostEndpoint) {
                    requestInit.endpoint = new URL(messagesPostEndpoint);
                }
                transport = new StreamableHTTPClientTransport(new URL(httpStreamUrl), { requestInit });
            }
            else if (connectionType === 'sse') {
                const sseCredentials = await this.getCredentials('mcpClientSseApi');
                const { SSEClientTransport } = await Promise.resolve().then(() => __importStar(require('@modelcontextprotocol/sdk/client/sse.js')));
                const sseUrl = sseCredentials.sseUrl;
                const messagesPostEndpoint = sseCredentials.messagesPostEndpoint || '';
                timeout = sseCredentials.sseTimeout || 60000;
                let headers = {};
                if (sseCredentials.headers) {
                    const headerLines = sseCredentials.headers.split('\n');
                    for (const line of headerLines) {
                        const equalsIndex = line.indexOf('=');
                        if (equalsIndex > 0) {
                            const name = line.substring(0, equalsIndex).trim();
                            const value = line.substring(equalsIndex + 1).trim();
                            if (name && value !== undefined) {
                                headers[name] = value;
                            }
                        }
                    }
                }
                transport = new SSEClientTransport(new URL(sseUrl), {
                    eventSourceInit: { headers },
                    requestInit: {
                        headers,
                        ...(messagesPostEndpoint
                            ? {
                                endpoint: new URL(messagesPostEndpoint),
                            }
                            : {}),
                    },
                });
                this.logger.debug(`Created SSE transport for MCP client URL: ${sseUrl}`);
                if (messagesPostEndpoint) {
                    this.logger.debug(`Using custom POST endpoint: ${messagesPostEndpoint}`);
                }
            }
            else {
                const cmdCredentials = await this.getCredentials('mcpClientApi');
                const env = {
                    PATH: process.env.PATH || '',
                };
                this.logger.debug(`Original PATH: ${process.env.PATH}`);
                if (cmdCredentials.environments) {
                    const envLines = cmdCredentials.environments.split('\n');
                    for (const line of envLines) {
                        const equalsIndex = line.indexOf('=');
                        if (equalsIndex > 0) {
                            const name = line.substring(0, equalsIndex).trim();
                            const value = line.substring(equalsIndex + 1).trim();
                            if (name && value !== undefined) {
                                env[name] = value;
                            }
                        }
                    }
                }
                for (const key in process.env) {
                    if (key.startsWith('MCP_') && process.env[key]) {
                        const envName = key.substring(4);
                        env[envName] = process.env[key];
                    }
                }
                transport = new stdio_js_1.StdioClientTransport({
                    command: cmdCredentials.command,
                    args: ((_a = cmdCredentials.args) === null || _a === void 0 ? void 0 : _a.split(' ')) || [],
                    env: env,
                });
                this.logger.debug(`Transport created for MCP client command: ${cmdCredentials.command}, PATH: ${env.PATH}`);
            }
            if (transport) {
                transport.onerror = (error) => {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Transport error: ${error.message}`);
                };
            }
            const client = new index_js_1.Client({
                name: `${McpClient.name}-client`,
                version: '1.0.0',
            }, {
                capabilities: {
                    prompts: {},
                    resources: {},
                    tools: {},
                },
            });
            try {
                if (!transport) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'No transport available');
                }
                await client.connect(transport);
                this.logger.debug('Client connected to MCP server');
            }
            catch (connectionError) {
                this.logger.error(`MCP client connection error: ${connectionError.message}`);
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Failed to connect to MCP server: ${connectionError.message}`);
            }
            const requestOptions = {};
            requestOptions.timeout = timeout;
            switch (operation) {
                case 'listResources': {
                    const resources = await client.listResources();
                    returnData.push({
                        json: { resources },
                    });
                    break;
                }
                case 'listResourceTemplates': {
                    const resourceTemplates = await client.listResourceTemplates();
                    returnData.push({
                        json: { resourceTemplates },
                    });
                    break;
                }
                case 'readResource': {
                    const uri = this.getNodeParameter('resourceUri', 0);
                    const resource = await client.readResource({
                        uri,
                    });
                    returnData.push({
                        json: { resource },
                    });
                    break;
                }
                case 'listTools': {
                    const rawTools = await client.listTools();
                    const tools = Array.isArray(rawTools)
                        ? rawTools
                        : Array.isArray(rawTools === null || rawTools === void 0 ? void 0 : rawTools.tools)
                            ? rawTools.tools
                            : typeof (rawTools === null || rawTools === void 0 ? void 0 : rawTools.tools) === 'object' && rawTools.tools !== null
                                ? Object.values(rawTools.tools)
                                : [];
                    if (!tools.length) {
                        this.logger.warn('No tools found from MCP client response.');
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'No tools found from MCP client');
                    }
                    const aiTools = tools.map((tool) => {
                        var _a;
                        const paramSchema = ((_a = tool.inputSchema) === null || _a === void 0 ? void 0 : _a.properties)
                            ? zod_1.z.object(Object.entries(tool.inputSchema.properties).reduce((acc, [key, prop]) => {
                                var _a, _b, _c, _d, _e;
                                let zodType;
                                switch (prop.type) {
                                    case 'string':
                                        zodType = zod_1.z.string();
                                        break;
                                    case 'number':
                                        zodType = zod_1.z.number();
                                        break;
                                    case 'integer':
                                        zodType = zod_1.z.number().int();
                                        break;
                                    case 'boolean':
                                        zodType = zod_1.z.boolean();
                                        break;
                                    case 'array':
                                        if (((_a = prop.items) === null || _a === void 0 ? void 0 : _a.type) === 'string') {
                                            zodType = zod_1.z.array(zod_1.z.string());
                                        }
                                        else if (((_b = prop.items) === null || _b === void 0 ? void 0 : _b.type) === 'number') {
                                            zodType = zod_1.z.array(zod_1.z.number());
                                        }
                                        else if (((_c = prop.items) === null || _c === void 0 ? void 0 : _c.type) === 'boolean') {
                                            zodType = zod_1.z.array(zod_1.z.boolean());
                                        }
                                        else {
                                            zodType = zod_1.z.array(zod_1.z.any());
                                        }
                                        break;
                                    case 'object':
                                        zodType = zod_1.z.record(zod_1.z.string(), zod_1.z.any());
                                        break;
                                    default:
                                        zodType = zod_1.z.any();
                                }
                                if (prop.description) {
                                    zodType = zodType.describe(prop.description);
                                }
                                if (!((_e = (_d = tool.inputSchema) === null || _d === void 0 ? void 0 : _d.required) === null || _e === void 0 ? void 0 : _e.includes(key))) {
                                    zodType = zodType.optional();
                                }
                                return {
                                    ...acc,
                                    [key]: zodType,
                                };
                            }, {}))
                            : zod_1.z.object({});
                        return new tools_1.DynamicStructuredTool({
                            name: tool.name,
                            description: tool.description || `Execute the ${tool.name} tool`,
                            schema: paramSchema,
                            func: async (params) => {
                                try {
                                    const result = await client.callTool({
                                        name: tool.name,
                                        arguments: params,
                                    }, types_js_1.CallToolResultSchema, requestOptions);
                                    return typeof result === 'object' ? JSON.stringify(result) : String(result);
                                }
                                catch (error) {
                                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Failed to execute ${tool.name}: ${error.message}`);
                                }
                            },
                        });
                    });
                    returnData.push({
                        json: {
                            tools: aiTools.map((t) => ({
                                name: t.name,
                                description: t.description,
                                schema: (0, zod_to_json_schema_1.zodToJsonSchema)(t.schema || zod_1.z.object({})),
                            })),
                        },
                    });
                    break;
                }
                case 'executeTool': {
                    const toolName = this.getNodeParameter('toolName', 0);
                    let toolParams;
                    try {
                        const rawParams = this.getNodeParameter('toolParameters', 0);
                        this.logger.debug(`Raw tool parameters: ${JSON.stringify(rawParams)}`);
                        if (rawParams === undefined || rawParams === null) {
                            toolParams = {};
                        }
                        else if (typeof rawParams === 'string') {
                            if (!rawParams || rawParams.trim() === '') {
                                toolParams = {};
                            }
                            else {
                                toolParams = JSON.parse(rawParams);
                            }
                        }
                        else if (typeof rawParams === 'object') {
                            toolParams = rawParams;
                        }
                        else {
                            try {
                                toolParams = JSON.parse(JSON.stringify(rawParams));
                            }
                            catch (parseError) {
                                throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Invalid parameter type: ${typeof rawParams}`);
                            }
                        }
                        if (typeof toolParams !== 'object' ||
                            toolParams === null ||
                            Array.isArray(toolParams)) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Tool parameters must be a JSON object');
                        }
                    }
                    catch (error) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Failed to parse tool parameters: ${error.message}. Make sure the parameters are valid JSON.`);
                    }
                    try {
                        const availableTools = await client.listTools();
                        const toolsList = Array.isArray(availableTools)
                            ? availableTools
                            : Array.isArray(availableTools === null || availableTools === void 0 ? void 0 : availableTools.tools)
                                ? availableTools.tools
                                : Object.values((availableTools === null || availableTools === void 0 ? void 0 : availableTools.tools) || {});
                        const toolExists = toolsList.some((tool) => tool.name === toolName);
                        if (!toolExists) {
                            const availableToolNames = toolsList.map((t) => t.name).join(', ');
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Tool '${toolName}' does not exist. Available tools: ${availableToolNames}`);
                        }
                        this.logger.debug(`Executing tool: ${toolName} with params: ${JSON.stringify(toolParams)}`);
                        const result = await client.callTool({
                            name: toolName,
                            arguments: toolParams,
                        }, types_js_1.CallToolResultSchema, requestOptions);
                        this.logger.debug(`Tool executed successfully: ${JSON.stringify(result)}`);
                        returnData.push({
                            json: { result },
                        });
                    }
                    catch (error) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Failed to execute tool '${toolName}': ${error.message}`);
                    }
                    break;
                }
                case 'listPrompts': {
                    const prompts = await client.listPrompts();
                    returnData.push({
                        json: { prompts },
                    });
                    break;
                }
                case 'getPrompt': {
                    const promptName = this.getNodeParameter('promptName', 0);
                    const prompt = await client.getPrompt({
                        name: promptName,
                    });
                    returnData.push({
                        json: { prompt },
                    });
                    break;
                }
                default:
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Operation ${operation} not supported`);
            }
            return [returnData];
        }
        catch (error) {
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Failed to execute operation: ${error.message}`);
        }
        finally {
            if (transport) {
                await transport.close();
            }
        }
    }
}
exports.McpClient = McpClient;
//# sourceMappingURL=McpClient.node.js.map