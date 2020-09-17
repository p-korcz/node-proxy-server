import http from "http";
import httpProxy from "http-proxy";
import detectPort from "detect-port";

const proxy = httpProxy.createProxyServer({});

const inServer =
  process.argv[2] && process.argv[2] === "-in" && process.argv[3];
let outPort = process.argv[4] && process.argv[4] === "-p" && process.argv[5];

detectPort(outPort).then((freePort) => {
  if (freePort != outPort) {
    console.log(`
        Port: ${outPort} was occupied
        automaticaly change to next free port
        ${freePort}`);
    outPort = freePort;
  }

  if (inServer && outPort) {
    const server = http.createServer(function (req, res) {
      proxy.web(req, res, {
        target: inServer,
        secure: false,
        prependPath: false,
        ignorePath: false,
      });
    });

    server.listen(outPort).addListener("error", console.log);

    console.log(`Output proxy port ${outPort}`);
    proxy.on("error", (err, _req, res) => {
      console.log(err);
      res.writeHead(500, {
        "Content-Type": "text/plain",
      });
      res.end("Error");
    });

    proxy.on("proxyRes", (proxyRes, _req, res) => {
      console.log(`
    =======================================
    Response status: ${proxyRes.statusCode}
    ${proxyRes.statusMessage}
    `);

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    });
    proxy.on("proxyReq", (proxyReq) => {
      console.log(`
    Request path: ${proxyReq.path}
    method ${proxyReq.method}
    `);
    });
  } else {
    console.error(`
  Wrong args
  proxied server received: ${inServer}
  output port received ${outPort}
  `);
  }
});
