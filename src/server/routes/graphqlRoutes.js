const express = require('express');
const router = express.Router();
const { graphql } = require('graphql');
const { schema, rootValue } = require('../graphql/schema');

// Handle both POST and GET for GraphQL queries
router.all('/', async (req, res) => {
  try {
    const query = req.body?.query || req.query?.query;
    const variables = req.body?.variables || (req.query?.variables ? JSON.parse(req.query.variables) : undefined);

    if (!query) {
      return res.status(400).json({
        errors: [{ message: 'No GraphQL query provided. Send JSON with { query: "..." }' }]
      });
    }

    const response = await graphql({
      schema,
      source: query,
      rootValue,
      variableValues: variables
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('GraphQL Execution Error:', error);
    res.status(500).json({ errors: [{ message: error.message }] });
  }
});

module.exports = router;
