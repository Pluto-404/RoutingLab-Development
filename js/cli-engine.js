/* RoutingLab CLI Engine v0.1 — educational Cisco-like interpreter, not Cisco IOS. */
(function (root, factory) {
  const value = factory();
  if (typeof module === "object" && module.exports) module.exports = value;
  root.RoutingLabCLI = value;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const INITIAL = {
    R1: {
      hostname: "R1",
      interfaces: {
        "g0/0": {
          ip: "192.168.1.1",
          mask: "255.255.255.0",
          up: true,
          link: "LAN1",
        },
        "g0/1": {
          ip: "10.10.10.1",
          mask: "255.255.255.252",
          up: true,
          link: "WAN",
        },
      },
      routes: [],
      saved: false,
    },
    R2: {
      hostname: "R2",
      interfaces: {
        "g0/0": {
          ip: "10.10.10.2",
          mask: "255.255.255.252",
          up: true,
          link: "WAN",
        },
        "g0/1": {
          ip: "192.168.2.1",
          mask: "255.255.255.0",
          up: true,
          link: "LAN2",
        },
      },
      routes: [],
      saved: false,
    },
  };
  const isIPv4 = (v) => {
    const a = String(v || "").split(".");
    return (
      a.length === 4 && a.every((s) => /^\d{1,3}$/.test(s) && Number(s) <= 255)
    );
  };
  const ipNum = (s) =>
    s.split(".").reduce((n, x) => ((n << 8) >>> 0) + (Number(x) >>> 0), 0) >>>
    0;
  const validMask = (m) => {
    if (!isIPv4(m)) return false;
    const n = ipNum(m);
    const inv = ~n >>> 0;
    return (inv & (inv + 1)) >>> 0 === 0;
  };
  const prefix = (m) => {
    let n = ipNum(m),
      p = 0;
    while (n & 0x80000000) {
      p++;
      n = (n << 1) >>> 0;
    }
    return p;
  };
  const network = (ip, mask) => (ipNum(ip) & ipNum(mask)) >>> 0;
  const contains = (ip, net, mask) =>
    isIPv4(ip) &&
    isIPv4(net) &&
    validMask(mask) &&
    network(ip, mask) === network(net, mask);
  function create() {
    let state = clone(INITIAL),
      selected = "R1",
      mode = "user",
      iface = null;
    return {
      get selected() {
        return selected;
      },
      get mode() {
        return mode;
      },
      get state() {
        return clone(state);
      },
      get prompt() {
        const host = state[selected].hostname;
        return (
          host +
          (mode === "user"
            ? ">"
            : mode === "exec"
              ? "#"
              : mode === "config"
                ? "(config)#"
                : "(config-if)#")
        );
      },
      select(id) {
        if (!state[id]) return "Unknown router";
        selected = id;
        mode = "user";
        iface = null;
        return `Connected to ${state[id].hostname} console.`;
      },
      reset() {
        state = clone(INITIAL);
        selected = "R1";
        mode = "user";
        iface = null;
      },
      // Deterministic, pedagogical forwarding model for the fixed PC0-R1-R2-PC1 topology.
      // Does not implement ARP, dynamic routing, or an actual IOS data plane.
      trace(source = "PC0", target = "192.168.2.10") {
        const hosts = {
          PC0: { ip: "192.168.1.10", mask: "255.255.255.0", gateway: "192.168.1.1", router: "R1", lan: "LAN1" },
          PC1: { ip: "192.168.2.10", mask: "255.255.255.0", gateway: "192.168.2.1", router: "R2", lan: "LAN2" }
        };
        const src = hosts[source];
        if (!src || !isIPv4(target)) return { ok:false, path:[], reason:"Sumber atau alamat tujuan tidak valid." };
        const destination = Object.entries(hosts).find(([, h]) => h.ip === target);
        if (!destination) return { ok:false, path:[source], reason:"Alamat tujuan di luar skenario pembelajaran." };
        const [destName, dst] = destination;
        const path = [source];
        if (source === destName) return { ok:true, path, reason:"Alamat lokal." };
        const routerInLan = (routerId, lan) => Object.entries(state[routerId].interfaces).find(([,v]) => v.link === lan);
        const srcIface = routerInLan(src.router, src.lan);
        if (!srcIface || !srcIface[1].up || srcIface[1].ip !== src.gateway || !contains(src.ip,srcIface[1].ip,src.mask))
          return {ok:false,path,reason:"Gateway LAN asal tidak tersedia atau interface shutdown."};
        path.push(source === "PC0" ? "SW0" : "SW1",src.router);
        let current = src.router;
        const visited = new Set();
        for(let ttl=0;ttl<5;ttl++){
          if(visited.has(current))return {ok:false,path,reason:"Routing loop terdeteksi."};
          visited.add(current);
          const r=state[current];
          const directly = Object.entries(r.interfaces).find(([,v])=>v.up && v.ip && validMask(v.mask) && contains(target,v.ip,v.mask));
          if(directly && current===dst.router && directly[1].link===dst.lan){
            path.push(destName === "PC0" ? "SW0" : "SW1",destName);
            return {ok:true,path,reason:"Paket mencapai host tujuan."};
          }
          const routes = [];
          for(const [name,v] of Object.entries(r.interfaces)){
            if(v.up && v.ip && validMask(v.mask) && contains(target,v.ip,v.mask)) routes.push({type:"connected",len:prefix(v.mask),out:name});
          }
          for(const route of r.routes){
            if(contains(target,route.net,route.mask)) routes.push({type:"static",len:prefix(route.mask),hop:route.hop});
          }
          routes.sort((x,y)=>y.len-x.len || (x.type==="connected"?-1:1));
          const choice=routes[0];
          if(!choice) return {ok:false,path,reason:`${current}: tidak ada route menuju ${target}.`};
          if(choice.type==="connected") return {ok:false,path,reason:`${current}: alamat tujuan tidak tersedia pada link terhubung.`};
          const outgoing=Object.entries(r.interfaces).find(([,v])=>v.up && v.ip && validMask(v.mask) && contains(choice.hop,v.ip,v.mask));
          if(!outgoing) return {ok:false,path,reason:`${current}: next hop ${choice.hop} tidak dapat dijangkau melalui interface aktif.`};
          const [outName,outIf]=outgoing;
          const peerId=current==="R1"?"R2":"R1";
          const peer=Object.entries(state[peerId].interfaces).find(([,v])=>v.link===outIf.link && v.up && v.ip===choice.hop && contains(v.ip,outIf.ip,outIf.mask) && contains(outIf.ip,v.ip,v.mask));
          if(!peer) return {ok:false,path,reason:`${current}: tidak ada tetangga aktif dengan alamat next hop ${choice.hop}.`};
          path.push(peerId);
          current=peerId;
        }
        return {ok:false,path,reason:"TTL habis."};
      },
      reachable() {
        const forward=this.trace("PC0","192.168.2.10");
        const reverse=this.trace("PC1","192.168.1.10");
        const a=state.R1.interfaces["g0/1"],b=state.R2.interfaces["g0/0"];
        const links=!!(a.up && b.up && a.ip && b.ip && contains(a.ip,b.ip,b.mask) && contains(b.ip,a.ip,a.mask));
        return {ok:forward.ok && reverse.ok,links,forward:forward.ok,returnRoute:reverse.ok,forwardTrace:forward,returnTrace:reverse};
      },
      preset(kind) {
        this.reset();
        if(kind === "missing-return" || kind === "wan-down" || kind === "wrong-next-hop"){
          state.R1.routes.push({net:"192.168.2.0",mask:"255.255.255.0",hop:"10.10.10.2"});
          state.R2.routes.push({net:"192.168.1.0",mask:"255.255.255.0",hop:"10.10.10.1"});
          if(kind === "missing-return")state.R2.routes=[];
          if(kind === "wan-down")state.R1.interfaces["g0/1"].up=false;
          if(kind === "wrong-next-hop")state.R1.routes[0].hop="10.10.10.6";
        }
        return this.reachable();
      },
      run(raw) {
        const input = String(raw || "").trim();
        if (!input) return "";
        const args = input.replace(/\s+/g, " ").split(" "),
          cmd = input.toLowerCase(),
          d = state[selected];
        if (cmd === "?" || cmd === "help")
          return "Supported: enable, configure terminal, interface g0/0|g0/1, ip address A.B.C.D MASK, no shutdown, shutdown, exit, end, ip route NETWORK MASK NEXT-HOP, no ip route NETWORK MASK NEXT-HOP, show ip route, show ip interface brief, show running-config, ping IP, hostname NAME, copy running-config startup-config.";
        if (cmd === "exit") {
          if (mode === "if") {
            mode = "config";
            iface = null;
          } else if (mode === "config") mode = "exec";
          else mode = "user";
          return "";
        }
        if (cmd === "end") {
          mode = "exec";
          iface = null;
          return "";
        }
        if (cmd === "enable" && mode === "user") {
          mode = "exec";
          return "";
        }
        if (
          (cmd === "configure terminal" || cmd === "conf t") &&
          mode === "exec"
        ) {
          mode = "config";
          return "Enter configuration commands, one per line. End with CNTL/Z.";
        }
        const show = cmd.startsWith("show ") || cmd.startsWith("do show ");
        const showCmd = cmd.startsWith("do ") ? cmd.slice(3) : cmd;
        if (
          show &&
          !(
            mode === "exec" ||
            (cmd.startsWith("do ") && ["config", "if"].includes(mode))
          )
        )
          return "% Command available from privileged EXEC (or use do in configuration mode).";
        if (show) {
          if (showCmd === "show ip interface brief")
            return Object.entries(d.interfaces)
              .map(
                ([n, v]) =>
                  `${n.padEnd(9)} ${(v.ip || "unassigned").padEnd(17)} ${v.up ? "up" : "administratively down"} ${v.up ? "up" : "down"}`,
              )
              .join("\n");
          if (showCmd === "show ip route") {
            const connected = Object.entries(d.interfaces)
              .filter(([, v]) => v.up && v.ip && validMask(v.mask))
              .map(
                ([n, v]) =>
                  `C ${v.ip.split(".").map(Number).length === 4 ? numIp(network(v.ip, v.mask)) : ""}/${prefix(v.mask)} is directly connected, ${n}`,
              );
            const routes = d.routes.map(
              (r) => `S ${r.net}/${prefix(r.mask)} [1/0] via ${r.hop}`,
            );
            return (
              [...connected, ...routes].join("\n") ||
              "Gateway of last resort is not set"
            );
          }
          if (showCmd === "show running-config")
            return [
              "hostname " + d.hostname,
              ...Object.entries(d.interfaces).flatMap(([n, v]) => [
                "interface " + n,
                ...(v.ip ? [` ip address ${v.ip} ${v.mask}`] : []),
                " " + (v.up ? "no shutdown" : "shutdown"),
                " exit",
              ]),
              ...d.routes.map((r) => `ip route ${r.net} ${r.mask} ${r.hop}`),
            ].join("\n");
          return "% Invalid show command.";
        }
        if (args[0].toLowerCase() === "ping") {
          if (mode !== "exec") return "% Use ping in privileged EXEC mode.";
          if (!isIPv4(args[1])) return "% Invalid IPv4 destination.";
          const target = args[1],
            status = this.reachable();
          if (
            (selected === "R1" && target === "192.168.2.10") ||
            (selected === "R2" && target === "192.168.1.10")
          )
            return status.ok
              ? "!!!!!\nSuccess rate is 100 percent (5/5)"
              : ".....\nSuccess rate is 0 percent (0/5)";
          return "% This educational scenario supports ping to remote PC 192.168.2.10 (R1) / 192.168.1.10 (R2).";
        }
        if (mode === "config" && /^hostname\s+\S+$/i.test(input)) {
          d.hostname = args[1].slice(0, 24);
          return "";
        }
        if (mode === "config" && /^interface\s+/i.test(input)) {
          const name = (args[1] || "")
            .toLowerCase()
            .replace(/^gigabitethernet/, "g")
            .replace(/^gi/, "g");
          if (!d.interfaces[name])
            return "% Unknown interface; use g0/0 or g0/1.";
          iface = name;
          mode = "if";
          return "";
        }
        if (mode === "if" && cmd === "no shutdown") {
          d.interfaces[iface].up = true;
          return `% Interface ${iface} changed state to up.`;
        }
        if (mode === "if" && cmd === "shutdown") {
          d.interfaces[iface].up = false;
          return `% Interface ${iface} administratively down.`;
        }
        if (mode === "if" && /^ip address\s+/i.test(input)) {
          if (args.length !== 4 || !isIPv4(args[2]) || !validMask(args[3]))
            return "% Invalid IP address or subnet mask.";
          d.interfaces[iface].ip = args[2];
          d.interfaces[iface].mask = args[3];
          return "";
        }
        if (
          mode === "config" &&
          (cmd.startsWith("ip route ") || cmd.startsWith("no ip route "))
        ) {
          const remove = cmd.startsWith("no "),
            p = remove ? args.slice(3) : args.slice(2);
          if (
            p.length !== 3 ||
            !isIPv4(p[0]) ||
            !validMask(p[1]) ||
            !isIPv4(p[2])
          )
            return "% Usage: ip route NETWORK MASK NEXT-HOP";
          if (network(p[0], p[1]) !== ipNum(p[0]))
            return "% Destination must be network address.";
          const entry = { net: p[0], mask: p[1], hop: p[2] },
            same = (r) =>
              r.net === entry.net &&
              r.mask === entry.mask &&
              r.hop === entry.hop;
          if (remove) d.routes = d.routes.filter((r) => !same(r));
          else if (!d.routes.some(same)) d.routes.push(entry);
          return "";
        }
        if (mode === "exec" && cmd === "copy running-config startup-config") {
          d.saved = true;
          return "Building configuration...\n[OK]";
        }
        return "% Invalid command or wrong CLI mode. Type ? for supported commands.";
      },
    };
  }
  function numIp(n) {
    return [24, 16, 8, 0].map((b) => (n >>> b) & 255).join(".");
  }
  return { create, isIPv4, validMask, contains };
});
