/**
 * Example: Integrating JavaScript agents into your project
 *
 * Method 1: Git Submodule
 * - Add this repo as a submodule: git submodule add <repo-url> lib/agents
 * - Import agents: const { ChatAgent } = require('./lib/agents/javascript')
 *
 * Method 2: Direct Copy
 * - Copy the agents you need into your project
 * - Import and use them
 *
 * Method 3: NPM Package (when published)
 * - npm install reusable-agents
 * - const { ChatAgent } = require('reusable-agents')
 */

const path = require('path');

// If using git submodule
const { ChatAgent } = require('../../javascript/chat-agent');
const { ApiAgent } = require('../../javascript/api-agent');


async function example1_chatAgent() {
  console.log('='.repeat(60));
  console.log('Example 1: Chat Agent');
  console.log('='.repeat(60));

  // Create a customer support agent
  const supportAgent = new ChatAgent({
    systemPrompt: `You are a helpful customer support agent.
    Be friendly, professional, and solve customer problems efficiently.`,
    maxHistory: 10
  });

  await supportAgent.use(async (agent) => {
    const customerMessages = [
      "I can't log into my account",
      "I tried resetting my password but didn't get an email",
      "My email is john@example.com"
    ];

    for (const msg of customerMessages) {
      console.log(`\nCustomer: ${msg}`);
      const response = await agent.execute(msg);
      console.log(`Support: ${response}`);
    }

    console.log(`\nTotal messages: ${agent.getHistory().length}`);
  });
}


async function example2_apiAgent() {
  console.log('\n' + '='.repeat(60));
  console.log('Example 2: API Agent');
  console.log('='.repeat(60));

  // Create an API client agent
  const apiAgent = new ApiAgent({
    baseUrl: 'https://jsonplaceholder.typicode.com',
    retryCount: 3,
    timeout: 10000
  });

  await apiAgent.use(async (agent) => {
    try {
      // Fetch data
      console.log('\n1. Fetching posts...');
      const postsResponse = await agent.get('/posts?_limit=3');
      console.log(`Fetched ${postsResponse.data.length} posts`);

      // Create new post
      console.log('\n2. Creating new post...');
      const newPost = await agent.post('/posts', {
        title: 'My New Post',
        body: 'This is a test post created by an agent',
        userId: 1
      });
      console.log(`Created post with ID: ${newPost.data.id}`);

      // View request log
      console.log('\n3. Request History:');
      const log = agent.getRequestLog();
      log.forEach(entry => {
        const status = entry.success ? '✓' : '✗';
        console.log(`  ${status} ${entry.method} ${entry.url} (${entry.status})`);
      });

    } catch (error) {
      console.error('Error:', error.message);
    }
  });
}


async function example3_combiningAgents() {
  console.log('\n' + '='.repeat(60));
  console.log('Example 3: Combining Multiple Agents');
  console.log('='.repeat(60));

  const apiAgent = new ApiAgent({
    baseUrl: 'https://jsonplaceholder.typicode.com'
  });

  const analyzerAgent = new ChatAgent({
    systemPrompt: 'You are a data analyst. Provide brief insights about the data.'
  });

  await apiAgent.initialize();
  await analyzerAgent.initialize();

  try {
    // Fetch data with API agent
    console.log('\n1. Fetching user data...');
    const usersResponse = await apiAgent.get('/users?_limit=5');
    const users = usersResponse.data;
    console.log(`Fetched ${users.length} users`);

    // Analyze with Chat agent
    console.log('\n2. Analyzing data with AI...');
    const userSummary = users.map(u => ({
      name: u.name,
      email: u.email,
      company: u.company.name
    }));

    const analysis = await analyzerAgent.execute(
      `Analyze these users and provide insights: ${JSON.stringify(userSummary)}`
    );
    console.log(`\nAnalysis: ${analysis}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await apiAgent.cleanup();
    await analyzerAgent.cleanup();
  }
}


async function example4_errorHandling() {
  console.log('\n' + '='.repeat(60));
  console.log('Example 4: Error Handling and Retry Logic');
  console.log('='.repeat(60));

  const apiAgent = new ApiAgent({
    baseUrl: 'https://jsonplaceholder.typicode.com',
    retryCount: 3,
    retryDelay: 1000
  });

  await apiAgent.use(async (agent) => {
    try {
      // This will succeed
      console.log('\n1. Valid request...');
      await agent.get('/posts/1');
      console.log('Success!');

      // This will fail and retry
      console.log('\n2. Invalid request (will retry)...');
      try {
        await agent.get('/invalid-endpoint-12345');
      } catch (error) {
        console.log(`Failed after retries: ${error.message}`);
      }

      // Show all requests including failed ones
      console.log('\n3. Complete request log:');
      agent.getRequestLog().forEach(entry => {
        const icon = entry.success ? '✓' : '✗';
        console.log(`  ${icon} ${entry.method} ${entry.url} (${entry.status})`);
      });

    } catch (error) {
      console.error('Unexpected error:', error.message);
    }
  });
}


async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('JavaScript Agents Integration Examples');
  console.log('='.repeat(60) + '\n');

  try {
    await example1_chatAgent();
    await example2_apiAgent();
    await example3_combiningAgents();
    await example4_errorHandling();

    console.log('\n' + '='.repeat(60));
    console.log('All examples completed!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  example1_chatAgent,
  example2_apiAgent,
  example3_combiningAgents,
  example4_errorHandling
};
