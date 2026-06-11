require('dotenv').config();
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");
const mongoose = require('mongoose');
const Folder = require('./models/Folder');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drive_clone')
  .then(() => console.error('MCP Server MongoDB connected'))
  .catch(err => console.error(err));

const server = new Server({
  name: "google-drive-clone-mcp",
  version: "1.0.0"
}, {
  capabilities: {
    tools: {}
  }
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_folder",
        description: "Create a new folder in the Google Drive clone",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Name of the folder" },
            parentId: { type: "string", description: "Parent folder ID (optional)" },
            userEmail: { type: "string", description: "Email of the user creating the folder" }
          },
          required: ["name", "userEmail"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "create_folder") {
    const { name, parentId, userEmail } = request.params.arguments;
    
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return { content: [{ type: "text", text: `User not found with email: ${userEmail}` }], isError: true };
    }

    const folder = new Folder({
      name,
      parentId: parentId || null,
      userId: user._id
    });
    
    await folder.save();
    return {
      content: [{ type: "text", text: `Folder '${name}' created successfully with ID: ${folder._id}` }]
    };
  }
  
  throw new Error("Tool not found");
});

const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);
