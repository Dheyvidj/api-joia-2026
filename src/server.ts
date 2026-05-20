import os from "os";
import { app } from "./app";
import { env } from "./env";

function getLocalIPs(): string[] {
  const ips: string[] = [];
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === "IPv4" && !net.internal) ips.push(net.address);
    }
  }
  return ips;
}

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`API JOIA 2026 escutando em 0.0.0.0:${env.PORT}`);
  console.log(`  Local:   http://localhost:${env.PORT}`);
  for (const ip of getLocalIPs()) {
    console.log(`  Rede:    http://${ip}:${env.PORT}`);
  }
  console.log(`  Swagger: /docs`);
});
