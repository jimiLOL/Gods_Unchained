const server = require('fastify')({ logger: false });

const {start} = require('./controller/startWorker');
server.register(require('fastify-cors'), 
// function (instance) {

//   return (req, callback) => {
//     let corsOptions;
//     const origin = req.headers.origin;
//     console.log(origin);
//     // do not include CORS headers for requests from localhost
//     const hostname = new URL(origin).hostname;
//     if(hostname === "localhost"){
//       corsOptions = { origin: false }
//     } else {
//       corsOptions = { origin: true }
//     }
//     callback(null, corsOptions) // callback expects two parameters: error and options
//   }
// }
{
  origin: "*",
  methods: ["POST", "GET"]
} // только для разработки
);

 
start()


server.register(require('./routers'));
