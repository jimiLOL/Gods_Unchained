 
async function routes(server, options) {
  

  const optsGetListNFT = {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            listCollection: {
              type: 'array',
              default: []
            }
          }
        }
      }
    }
  };
  const subscriptionListUser = {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            subscriptionListUser: {
              type: 'array',
              default: []
            },
            title: {
              type: 'string',
              default: 'Successfully'
            },
            code: {
              type: 'number',
              default: 200
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            subscriptionListUser: {
              type: 'array',
              default: []
            },
            title: {
              type: 'string',
              default: 'Sorry, no authorization'
            },
            code: {
              type: 'number',
              default: 401
            }
          }

        },
        404: {
          type: 'object',
          properties: {
            subscriptionListUser: {
              type: 'array',
              default: []
            },
            title: {
              type: 'string',
              default: 'Sorry, no authorization in telegram'
            },
            code: {
              type: 'number',
              default: 404
            }
          }

        }
      }
    }
  }

  

   



  const animalBodyJsonSchema = {
    type: 'object',
    required: ['animal'],
    properties: {
      animal: { type: 'string' },
    },
  }

  const schema = {
    body: animalBodyJsonSchema,
  }

  // server.post('/animals', { schema }, async (request, reply) => {
  //   // we can use the `request.body` object to get the data sent by the client
  //   const result = await collection.insertOne({ animal: request.body.animal })
  //   return result
  // })
}

module.exports = routes