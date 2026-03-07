export default {
  async fetch(request, env, ctx) {
    const PASSWORD = env.APP_PASSWORD || "";

    if (!PASSWORD) {
      return new Response(HTML_CONTENT, {
        headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "no-cache" },
      });
    }

    const url = new URL(request.url);

    if (url.pathname === "/logout") {
      return new Response("Logged out.", {
        status: 302,
        headers: {
          "Location": "/",
          "Set-Cookie": "ss_auth=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict",
        },
      });
    }

    if (request.method === "POST" && url.pathname === "/login") {
      const form = await request.formData();
      const pw = form.get("password") || "";
      if (pw === PASSWORD) {
        const token = btoa(PASSWORD + ":" + Date.now());
        return new Response("OK", {
          status: 302,
          headers: {
            "Location": "/",
            "Set-Cookie": `ss_auth=${token}; Path=/; Max-Age=${60*60*24*30}; HttpOnly; Secure; SameSite=Strict`,
          },
        });
      }
      return new Response(LOGIN_PAGE(true), {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    }

    const cookie = request.headers.get("Cookie") || "";
    const match = cookie.match(/ss_auth=([^;]+)/);
    if (match) {
      try {
        const decoded = atob(match[1]);
        const storedPw = decoded.split(":")[0];
        if (storedPw === PASSWORD) {
          return new Response(HTML_CONTENT, {
            headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "no-cache" },
          });
        }
      } catch(e) {}
    }

    return new Response(LOGIN_PAGE(false), {
      headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
  },
};

function LOGIN_PAGE(failed) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Surplus Secure \u2014 Login</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%23C0392B'/><text x='50%25' y='55%25' font-size='20' font-weight='800' fill='white' text-anchor='middle' dominant-baseline='middle'>S</text></svg>"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Instrument Sans','Segoe UI',system-ui,sans-serif;background:linear-gradient(135deg,#1B2A4A 0%,#2C3E6B 60%,#1B2A4A 100%);min-height:100vh;display:flex;align-items:center;justify-content:center}
  .card{background:#fff;border-radius:12px;padding:40px 36px;width:100%;max-width:380px;box-shadow:0 20px 60px rgba(0,0,0,0.3);text-align:center}
  .logo{width:48px;height:48px;background:#C0392B;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:#fff;margin-bottom:16px}
  h1{font-size:22px;font-weight:700;color:#1B2A4A;margin-bottom:4px}
  .sub{font-size:13px;color:#8E99A4;margin-bottom:28px;letter-spacing:0.5px;text-transform:uppercase}
  input[type="password"]{width:100%;padding:12px 14px;border:1px solid #D5D8DC;border-radius:8px;font-size:14px;font-family:inherit;margin-bottom:16px;text-align:center;letter-spacing:2px}
  input[type="password"]:focus{outline:none;border-color:#2471A3;box-shadow:0 0 0 3px rgba(36,113,163,0.15)}
  button{width:100%;padding:12px 16px;background:#C0392B;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer}
  button:hover{background:#A93226}
  .error{background:#FADBD8;color:#C0392B;padding:8px 12px;border-radius:6px;font-size:12px;font-weight:600;margin-bottom:16px}
</style>
</head>
<body>
<div class="card">
  <div class="logo">S</div>
  <h1>Surplus Secure</h1>
  <div class="sub">County Configuration Database</div>
  ${failed ? '<div class="error">Incorrect password. Try again.</div>' : ''}
  <form method="POST" action="/login">
    <input type="password" name="password" placeholder="Enter password" autofocus required />
    <button type="submit">Sign In</button>
  </form>
</div>
</body>
</html>`;
}

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Surplus Secure \u2014 County Configuration Database</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%23C0392B'/><text x='50%25' y='55%25' font-size='20' font-weight='800' fill='white' text-anchor='middle' dominant-baseline='middle'>S</text></svg>"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Instrument Sans','Segoe UI',system-ui,sans-serif;background:#F0F2F5;min-height:100vh}
  input,select,textarea,button{font-family:inherit}
  .mono{font-family:'JetBrains Mono',monospace}
  ::-webkit-scrollbar{width:6px;height:6px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:#C5CAD0;border-radius:3px}
  ::-webkit-scrollbar-thumb:hover{background:#A0A8B0}
  @keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
  .saved-toast{animation:fadeIn 0.3s ease}
  .detail-panel{animation:slideIn 0.2s ease}
  table tr:hover td{background:#EBF5FB !important}
  select:focus,input:focus,textarea:focus{outline:none;border-color:#2471A3 !important;box-shadow:0 0 0 2px rgba(36,113,163,0.15)}
  button:hover{filter:brightness(1.08)}
  a{color:#2471A3;text-decoration:none}
  a:hover{text-decoration:underline}
  .tab{padding:6px 14px;border:none;background:none;cursor:pointer;font-size:11px;font-weight:600;color:#8E99A4;border-bottom:2px solid transparent;text-transform:uppercase;letter-spacing:0.5px;transition:all 0.15s}
  .tab.active{color:#1B2A4A;border-bottom-color:#C0392B}
  .action-btn{display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border-radius:6px;border:1px solid #D5D8DC;background:#fff;cursor:pointer;font-size:11px;font-weight:600;color:#2C3E50;transition:all 0.15s}
  .action-btn:hover{background:#EBF5FB;border-color:#2471A3}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:100}
  .modal{background:#fff;border-radius:12px;width:90%;max-width:640px;max-height:85vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3)}
  .pipeline-dot{width:10px;height:10px;border-radius:50%;display:inline-block}
</style>
</head>
<body>
<div id="root"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"><\/script>
<script>
var e = React.createElement;
var useState = React.useState, useEffect = React.useEffect, useMemo = React.useMemo, useCallback = React.useCallback;

// === DATA INJECTED AT BUILD TIME ===
var COUNTIES = /*__COUNTIES_DATA__*/;
var FOIA_TEMPLATES = /*__FOIA_TEMPLATES__*/;
var JOURNEY_STAGES = /*__JOURNEY_STAGES__*/;

var FOIA_METHODS = ["Portal","Form","Email","Mail"];
var PLATFORMS = ["tax-sale.info","Zeus Auction","County-Direct","Other"];
var AUCTION_MONTHS = ["August","September","October","November","Varies"];
var TIERS = ["High","Medium","Low"];
var REGIONS = {UP:"Upper Peninsula",NW:"Northwest",NE:"Northeast",N:"Northern",W:"West",C:"Central",E:"East",SW:"Southwest",S:"South",SE:"Southeast"};
var STATUS_COLORS = {State:{bg:"#FADBD8",text:"#C0392B",border:"#E74C3C"},County:{bg:"#D5F5E3",text:"#1E8449",border:"#27AE60"}};
var TIER_COLORS = {High:{bg:"#C0392B",text:"#fff"},Medium:{bg:"#D4AC0D",text:"#1B2A4A"},Low:{bg:"#2471A3",text:"#fff"}};

// === STORAGE HELPERS ===
function loadData(key, fallback) { try { var r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch(e) { return fallback; } }
function saveToStorage(key, data) { try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) { console.error(e); } }

function SurplusSecureDB() {
  var [counties, setCounties] = useState(function() {
    var saved = loadData("ss-county-config", []);
    return COUNTIES.map(function(c) {
      var defaults = {foiaMethod:"",foiaPortalUrl:"",foiaEmail:"",foiaAvgDays:"",auctionPlatform:"tax-sale.info",auctionMonth:"",foreclosureVol:"",surplusRetained:"",surplusReturned:"",tier:"",notes:"",pipelineStage:"",foiaSubmittedDate:"",foiaResponseDate:""};
      var s = saved.find(function(x){return x.id===c.id;});
      return Object.assign({}, c, defaults, s || {});
    });
  });
  var [search, setSearch] = useState("");
  var [filterFgu, setFilterFgu] = useState("All");
  var [filterRegion, setFilterRegion] = useState("All");
  var [filterTier, setFilterTier] = useState("All");
  var [filterFoia, setFilterFoia] = useState("All");
  var [filterPipeline, setFilterPipeline] = useState("All");
  var [selected, setSelected] = useState(null);
  var [editData, setEditData] = useState(null);
  var [saved, setSaved] = useState(false);
  var [detailTab, setDetailTab] = useState("config");
  var [showLetterModal, setShowLetterModal] = useState(false);
  var [letterTemplate, setLetterTemplate] = useState(null);
  var [letterVars, setLetterVars] = useState({});
  var [senderInfo, setSenderInfo] = useState(function(){ return loadData("ss-sender-info", {sender_name:"",sender_address:"",sender_email:"",sender_phone:""}); });

  var saveData = useCallback(function(updated) {
    var toSave = updated.map(function(c) {
      return {id:c.id,foiaMethod:c.foiaMethod,foiaPortalUrl:c.foiaPortalUrl,foiaEmail:c.foiaEmail,foiaAvgDays:c.foiaAvgDays,auctionPlatform:c.auctionPlatform,auctionMonth:c.auctionMonth,foreclosureVol:c.foreclosureVol,surplusRetained:c.surplusRetained,surplusReturned:c.surplusReturned,tier:c.tier,notes:c.notes,pipelineStage:c.pipelineStage,foiaSubmittedDate:c.foiaSubmittedDate,foiaResponseDate:c.foiaResponseDate};
    });
    saveToStorage("ss-county-config", toSave);
    setSaved(true);
    setTimeout(function(){setSaved(false);}, 2000);
  }, []);

  var filtered = useMemo(function() {
    return counties.filter(function(c) {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.treasurer.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterFgu !== "All" && c.fgu !== filterFgu) return false;
      if (filterRegion !== "All" && c.region !== filterRegion) return false;
      if (filterTier !== "All" && c.tier !== filterTier) return false;
      if (filterFoia === "Set" && !c.foiaMethod) return false;
      if (filterFoia === "Needs Input" && c.foiaMethod) return false;
      if (filterPipeline !== "All" && c.pipelineStage !== filterPipeline) return false;
      return true;
    });
  }, [counties, search, filterFgu, filterRegion, filterTier, filterFoia, filterPipeline]);

  var stats = useMemo(function() {
    var filled = counties.filter(function(c){return c.foiaMethod;}).length;
    var stateFgu = counties.filter(function(c){return c.fgu==="State";}).length;
    var tiered = counties.filter(function(c){return c.tier;}).length;
    var inPipeline = counties.filter(function(c){return c.pipelineStage;}).length;
    return {filled:filled,stateFgu:stateFgu,tiered:tiered,inPipeline:inPipeline};
  }, [counties]);

  function openEdit(county) { setEditData(Object.assign({},county)); setSelected(county.id); setDetailTab("config"); }
  function saveEdit() {
    if (!editData) return;
    var updated = counties.map(function(c){return c.id===editData.id ? Object.assign({},c,editData) : c;});
    setCounties(updated); saveData(updated); setEditData(null);
  }

  // Export CSV
  function exportCSV() {
    var headers = ["County","FGU","Region","Treasurer","Phone","Address","FOIA Method","Platform","Auction Month","Tier","Pipeline Stage","Foreclosure Vol","Surplus Retained","Surplus Returned","Notes"];
    var rows = filtered.map(function(c){
      return [c.name,c.fgu,REGIONS[c.region]||c.region,c.treasurer,c.phone,'"'+c.address+'"',c.foiaMethod,c.auctionPlatform,c.auctionMonth,c.tier,c.pipelineStage,c.foreclosureVol,c.surplusRetained,c.surplusReturned,'"'+(c.notes||"").replace(/"/g,'""')+'"'].join(",");
    });
    var csv = headers.join(",") + "\\n" + rows.join("\\n");
    var blob = new Blob([csv], {type:"text/csv"});
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "surplus-secure-export-" + new Date().toISOString().split("T")[0] + ".csv";
    a.click();
  }

  // Open letter generator
  function openLetterGen(templateId) {
    var tmpl = FOIA_TEMPLATES.find(function(t){return t.id===templateId;});
    if (!tmpl || !editData) return;
    var vars = {};
    tmpl.variables.forEach(function(v) {
      if (v === "treasurer_name") vars[v] = editData.treasurer;
      else if (v === "county_name") vars[v] = editData.name;
      else if (v === "year_range") vars[v] = "2020-2024";
      else if (senderInfo[v]) vars[v] = senderInfo[v];
      else vars[v] = "";
    });
    setLetterVars(vars);
    setLetterTemplate(tmpl);
    setShowLetterModal(true);
  }

  function renderLetter() {
    if (!letterTemplate) return "";
    var body = letterTemplate.body;
    Object.keys(letterVars).forEach(function(k) { body = body.split("{"+k+"}").join(letterVars[k] || "["+k+"]"); });
    return body;
  }

  function copyLetter() {
    navigator.clipboard.writeText(renderLetter());
    alert("Letter copied to clipboard!");
  }

  // Field component
  function Field(props) {
    var label=props.label, field=props.field, type=props.type||"text", options=props.options;
    return e("div",{style:{marginBottom:12}},
      e("label",{style:{display:"block",fontSize:11,fontWeight:600,color:"#5D6D7E",marginBottom:3,textTransform:"uppercase",letterSpacing:"0.5px"}},label),
      options ?
        e("select",{value:editData[field]||"",onChange:function(ev){var o={};o[field]=ev.target.value;setEditData(Object.assign({},editData,o));},style:{width:"100%",padding:"8px 10px",border:"1px solid #D5D8DC",borderRadius:6,fontSize:13,fontFamily:"'JetBrains Mono',monospace",background:"#FAFAFA"}},
          e("option",{value:""},"\\u2014"),
          options.map(function(o){return e("option",{key:o,value:o},o);}))
      : e("input",{type:type,value:editData[field]||"",onChange:function(ev){var o={};o[field]=ev.target.value;setEditData(Object.assign({},editData,o));},style:{width:"100%",padding:"8px 10px",border:"1px solid #D5D8DC",borderRadius:6,fontSize:13,fontFamily:"'JetBrains Mono',monospace",background:"#FAFAFA",boxSizing:"border-box"}})
    );
  }

  // === HEADER ===
  var header = e("div",{style:{background:"linear-gradient(135deg,#1B2A4A 0%,#2C3E6B 100%)",padding:"20px 24px",borderBottom:"3px solid #C0392B"}},
    e("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}},
      e("div",null,
        e("div",{style:{display:"flex",alignItems:"center",gap:10}},
          e("div",{style:{width:32,height:32,background:"#C0392B",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#fff"}},"S"),
          e("div",null,
            e("h1",{style:{margin:0,fontSize:18,fontWeight:700,color:"#fff",letterSpacing:"-0.3px"}},"Surplus Secure"),
            e("div",{style:{fontSize:11,color:"#8E99A4",letterSpacing:"1px",textTransform:"uppercase"}},"County Configuration Database")))),
      e("div",{style:{display:"flex",gap:16,flexWrap:"wrap"}},
        [{label:"Counties",value:"83"},{label:"FOIA Set",value:String(stats.filled)},{label:"State FGU",value:String(stats.stateFgu)},{label:"In Pipeline",value:String(stats.inPipeline)},{label:"Prioritized",value:String(stats.tiered)}
        ].map(function(s){return e("div",{key:s.label,style:{textAlign:"center",padding:"4px 12px"}},
          e("div",{style:{fontSize:20,fontWeight:700,color:"#fff"}},s.value),
          e("div",{style:{fontSize:10,color:"#8E99A4",textTransform:"uppercase",letterSpacing:"0.5px"}},s.label));})
      ),
      e("button",{onClick:exportCSV,className:"action-btn",style:{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff"}},"\\u2B07 Export CSV")
    )
  );

  // === CONTROLS ===
  var controls = e("div",{style:{padding:"12px 24px",background:"#fff",borderBottom:"1px solid #E5E8EB",display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}},
    e("input",{placeholder:"Search county or treasurer...",value:search,onChange:function(ev){setSearch(ev.target.value);},style:{padding:"7px 12px",border:"1px solid #D5D8DC",borderRadius:6,fontSize:13,width:220,fontFamily:"inherit"}}),
    e("select",{value:filterFgu,onChange:function(ev){setFilterFgu(ev.target.value);},style:{padding:"7px 10px",border:"1px solid #D5D8DC",borderRadius:6,fontSize:12}},
      e("option",{value:"All"},"All FGU"),e("option",{value:"County"},"County FGU"),e("option",{value:"State"},"State FGU")),
    e("select",{value:filterRegion,onChange:function(ev){setFilterRegion(ev.target.value);},style:{padding:"7px 10px",border:"1px solid #D5D8DC",borderRadius:6,fontSize:12}},
      e("option",{value:"All"},"All Regions"),
      Object.entries(REGIONS).map(function(p){return e("option",{key:p[0],value:p[0]},p[1]);})),
    e("select",{value:filterTier,onChange:function(ev){setFilterTier(ev.target.value);},style:{padding:"7px 10px",border:"1px solid #D5D8DC",borderRadius:6,fontSize:12}},
      e("option",{value:"All"},"All Tiers"),TIERS.map(function(t){return e("option",{key:t,value:t},t);})),
    e("select",{value:filterFoia,onChange:function(ev){setFilterFoia(ev.target.value);},style:{padding:"7px 10px",border:"1px solid #D5D8DC",borderRadius:6,fontSize:12}},
      e("option",{value:"All"},"FOIA: All"),e("option",{value:"Set"},"FOIA: Set"),e("option",{value:"Needs Input"},"FOIA: Needs Input")),
    e("select",{value:filterPipeline,onChange:function(ev){setFilterPipeline(ev.target.value);},style:{padding:"7px 10px",border:"1px solid #D5D8DC",borderRadius:6,fontSize:12}},
      e("option",{value:"All"},"Pipeline: All"),
      JOURNEY_STAGES.map(function(s){return e("option",{key:s.id,value:s.id},s.label);}),
      e("option",{value:""},"Not Started")),
    e("div",{style:{marginLeft:"auto",fontSize:12,color:"#7F8C8D"}},filtered.length+" of 83 counties"),
    saved ? e("div",{className:"saved-toast",style:{background:"#27AE60",color:"#fff",padding:"4px 12px",borderRadius:12,fontSize:11,fontWeight:600}},"Saved") : null
  );

  // === TABLE ===
  var tableHeaders = ["County","FGU","Region","Treasurer","Phone","FOIA","Pipeline","Tier"];
  var table = e("div",{style:{flex:1,overflow:"auto",padding:0}},
    e("table",{style:{width:"100%",borderCollapse:"collapse",fontSize:12}},
      e("thead",{style:{position:"sticky",top:0,zIndex:2}},
        e("tr",{style:{background:"#2C3E50"}},
          tableHeaders.map(function(h){return e("th",{key:h,style:{padding:"8px 10px",color:"#fff",fontWeight:600,textAlign:"left",fontSize:11,textTransform:"uppercase",letterSpacing:"0.5px",whiteSpace:"nowrap"}},h);}))),
      e("tbody",null,
        filtered.map(function(c,i) {
          var isSelected = selected===c.id;
          var sc = STATUS_COLORS[c.fgu];
          var stage = JOURNEY_STAGES.find(function(s){return s.id===c.pipelineStage;});
          return e("tr",{key:c.id,onClick:function(){openEdit(c);},style:{background:isSelected?"#EBF5FB":i%2===0?"#fff":"#FAFBFC",cursor:"pointer",borderLeft:isSelected?"3px solid #2471A3":"3px solid transparent",transition:"all 0.15s"}},
            e("td",{style:{padding:"7px 10px",fontWeight:600,color:"#1B2A4A",whiteSpace:"nowrap"}},c.name),
            e("td",{style:{padding:"7px 10px"}},e("span",{style:{display:"inline-block",padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:700,background:sc.bg,color:sc.text,border:"1px solid "+sc.border}},c.fgu)),
            e("td",{style:{padding:"7px 10px",color:"#7F8C8D",fontSize:11}},REGIONS[c.region]||c.region),
            e("td",{style:{padding:"7px 10px",color:"#2C3E50",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},c.treasurer),
            e("td",{style:{padding:"7px 10px",color:"#2471A3",fontFamily:"'JetBrains Mono',monospace",fontSize:11,whiteSpace:"nowrap"}},c.phone),
            e("td",{style:{padding:"7px 10px"}},
              c.foiaMethod ? e("span",{style:{display:"inline-block",padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:"#D5F5E3",color:"#1E8449"}},c.foiaMethod)
              : e("span",{style:{display:"inline-block",padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:"#FCF3CF",color:"#B7950B"}},"Needs Input")),
            e("td",{style:{padding:"7px 10px"}},
              stage ? e("span",{style:{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:stage.color+"22",color:stage.color}},
                e("span",{className:"pipeline-dot",style:{background:stage.color}}),stage.label)
              : e("span",{style:{fontSize:10,color:"#BDC3C7"}},"\\u2014")),
            e("td",{style:{padding:"7px 10px"}},
              c.tier ? e("span",{style:{display:"inline-block",padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:700,background:(TIER_COLORS[c.tier]||{}).bg,color:(TIER_COLORS[c.tier]||{}).text}},c.tier)
              : e("span",{style:{fontSize:10,color:"#BDC3C7"}},"\\u2014"))
          );
        })
      )
    )
  );

  // === DETAIL PANEL ===
  var detailPanel = null;
  if (editData) {
    var sc2 = STATUS_COLORS[editData.fgu];
    var showReturnRate = editData.surplusRetained && editData.surplusReturned && parseInt(editData.surplusRetained) > 0;
    var currentStage = JOURNEY_STAGES.find(function(s){return s.id===editData.pipelineStage;});

    // Config tab content
    var configTab = e("div",null,
      e("div",{style:{marginBottom:16,padding:12,background:"#F8F9FA",borderRadius:8,border:"1px solid #EAECEE"}},
        e("div",{style:{fontSize:10,fontWeight:700,color:"#7F8C8D",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6}},"Treasurer Contact"),
        e("div",{style:{fontSize:13,fontWeight:600,color:"#1B2A4A"}},editData.treasurer),
        e("div",{style:{display:"flex",gap:8,marginTop:6}},
          e("a",{href:"tel:"+editData.phone,className:"action-btn",style:{fontSize:11}},"\\u260E Call"),
          editData.foiaEmail ? e("a",{href:"mailto:"+editData.foiaEmail,className:"action-btn",style:{fontSize:11}},"\\u2709 Email") : null
        ),
        e("div",{style:{fontSize:11,color:"#5D6D7E",marginTop:6,lineHeight:1.4}},editData.address)
      ),
      editData.fguNote ? e("div",{style:{marginBottom:16,padding:10,background:"#FEF9E7",borderRadius:8,border:"1px solid #F9E79F",fontSize:12,color:"#7D6608",lineHeight:1.4}},e("strong",null,"Note: "),editData.fguNote) : null,

      e("div",{style:{fontSize:10,fontWeight:700,color:"#C0392B",textTransform:"uppercase",letterSpacing:"1px",marginBottom:10,paddingBottom:6,borderBottom:"2px solid #FADBD8"}},"FOIA Configuration"),
      e(Field,{label:"FOIA Method",field:"foiaMethod",options:FOIA_METHODS}),
      e(Field,{label:"FOIA Portal URL",field:"foiaPortalUrl"}),
      e(Field,{label:"FOIA Email",field:"foiaEmail"}),
      e(Field,{label:"Avg Response Time (Days)",field:"foiaAvgDays",type:"number"}),

      e("div",{style:{fontSize:10,fontWeight:700,color:"#2471A3",textTransform:"uppercase",letterSpacing:"1px",marginBottom:10,marginTop:16,paddingBottom:6,borderBottom:"2px solid #D4E6F1"}},"Auction & Data"),
      e(Field,{label:"Auction Platform",field:"auctionPlatform",options:PLATFORMS}),
      e(Field,{label:"Typical Auction Month",field:"auctionMonth",options:AUCTION_MONTHS}),
      e(Field,{label:"2023 Foreclosure Volume",field:"foreclosureVol",type:"number"}),
      e(Field,{label:"2023 Surplus Retained ($)",field:"surplusRetained",type:"number"}),
      e(Field,{label:"2023 Surplus Returned ($)",field:"surplusReturned",type:"number"}),
      showReturnRate ? e("div",{style:{padding:8,background:"#EBF5FB",borderRadius:6,fontSize:12,color:"#1B4F72",textAlign:"center",marginBottom:12}},"Return Rate: ",e("strong",null,(parseInt(editData.surplusReturned)/parseInt(editData.surplusRetained)*100).toFixed(1)+"%")) : null,

      e("div",{style:{fontSize:10,fontWeight:700,color:"#17A589",textTransform:"uppercase",letterSpacing:"1px",marginBottom:10,marginTop:16,paddingBottom:6,borderBottom:"2px solid #D1F2EB"}},"Priority & Notes"),
      e(Field,{label:"Priority Tier",field:"tier",options:TIERS}),
      e("div",{style:{marginBottom:12}},
        e("label",{style:{display:"block",fontSize:11,fontWeight:600,color:"#5D6D7E",marginBottom:3,textTransform:"uppercase",letterSpacing:"0.5px"}},"Claim Process Notes"),
        e("textarea",{value:editData.notes||"",onChange:function(ev){setEditData(Object.assign({},editData,{notes:ev.target.value}));},rows:4,style:{width:"100%",padding:"8px 10px",border:"1px solid #D5D8DC",borderRadius:6,fontSize:13,fontFamily:"inherit",background:"#FAFAFA",resize:"vertical",boxSizing:"border-box"}}))
    );

    // Pipeline tab content
    var pipelineTab = e("div",null,
      e("div",{style:{fontSize:10,fontWeight:700,color:"#1B2A4A",textTransform:"uppercase",letterSpacing:"1px",marginBottom:12,paddingBottom:6,borderBottom:"2px solid #D5D8DC"}},"Pipeline Stage"),
      e("div",{style:{marginBottom:16}},
        JOURNEY_STAGES.map(function(stage) {
          var isCurrent = editData.pipelineStage === stage.id;
          var stageOrder = stage.order;
          var currentOrder = currentStage ? currentStage.order : 0;
          var isPast = stageOrder < currentOrder;
          return e("div",{key:stage.id,onClick:function(){setEditData(Object.assign({},editData,{pipelineStage:stage.id}));},style:{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:6,cursor:"pointer",marginBottom:4,background:isCurrent?stage.color+"15":"transparent",border:isCurrent?"1px solid "+stage.color+"44":"1px solid transparent",transition:"all 0.15s"}},
            e("div",{style:{width:22,height:22,borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,background:isPast?"#27AE60":isCurrent?stage.color:"#E5E8EB",color:isPast||isCurrent?"#fff":"#BDC3C7"}},isPast?"\\u2713":String(stage.order)),
            e("div",null,
              e("div",{style:{fontSize:12,fontWeight:isCurrent?700:500,color:isCurrent?"#1B2A4A":"#7F8C8D"}},stage.label),
              isCurrent ? e("div",{style:{fontSize:10,color:"#5D6D7E",marginTop:2}},stage.description) : null
            )
          );
        })
      ),
      currentStage ? e("div",{style:{marginTop:8}},
        e("div",{style:{fontSize:10,fontWeight:700,color:currentStage.color,textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}},"Checklist: "+currentStage.label),
        currentStage.checklist.map(function(item,i) {
          return e("div",{key:i,style:{display:"flex",alignItems:"flex-start",gap:6,padding:"4px 0",fontSize:12,color:"#2C3E50"}},
            e("span",{style:{color:currentStage.color,flexShrink:0}},"\\u25CB"),
            e("span",null,item)
          );
        })
      ) : null,
      e("div",{style:{marginTop:16}},
        e(Field,{label:"FOIA Submitted Date",field:"foiaSubmittedDate",type:"date"}),
        e(Field,{label:"FOIA Response Date",field:"foiaResponseDate",type:"date"})
      )
    );

    // Actions tab content
    var actionsTab = e("div",null,
      e("div",{style:{fontSize:10,fontWeight:700,color:"#1B2A4A",textTransform:"uppercase",letterSpacing:"1px",marginBottom:12,paddingBottom:6,borderBottom:"2px solid #D5D8DC"}},"Generate FOIA Letters"),
      FOIA_TEMPLATES.map(function(tmpl) {
        return e("div",{key:tmpl.id,style:{marginBottom:12,padding:12,background:"#F8F9FA",borderRadius:8,border:"1px solid #EAECEE"}},
          e("div",{style:{fontSize:13,fontWeight:600,color:"#1B2A4A",marginBottom:2}},tmpl.name),
          e("div",{style:{fontSize:11,color:"#7F8C8D",marginBottom:8}},tmpl.description),
          e("button",{onClick:function(){openLetterGen(tmpl.id);},className:"action-btn"},"\\u270E Generate Letter")
        );
      }),
      e("div",{style:{fontSize:10,fontWeight:700,color:"#1B2A4A",textTransform:"uppercase",letterSpacing:"1px",marginBottom:12,marginTop:20,paddingBottom:6,borderBottom:"2px solid #D5D8DC"}},"Quick Actions"),
      e("div",{style:{display:"flex",flexDirection:"column",gap:8}},
        e("a",{href:"tel:"+editData.phone,className:"action-btn",style:{justifyContent:"center"}},"\\u260E Call "+editData.name+" Treasurer"),
        editData.foiaEmail ? e("a",{href:"mailto:"+editData.foiaEmail,className:"action-btn",style:{justifyContent:"center"}},"\\u2709 Email "+editData.foiaEmail) : null,
        editData.foiaPortalUrl ? e("a",{href:editData.foiaPortalUrl,target:"_blank",className:"action-btn",style:{justifyContent:"center"}},"\\u2197 Open FOIA Portal") : null
      )
    );

    detailPanel = e("div",{className:"detail-panel",style:{width:380,background:"#fff",borderLeft:"1px solid #E5E8EB",overflow:"auto",padding:0,flexShrink:0}},
      e("div",{style:{padding:"16px 20px",background:"#1B2A4A",position:"sticky",top:0,zIndex:1}},
        e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
          e("h2",{style:{margin:0,fontSize:16,fontWeight:700,color:"#fff"}},editData.name),
          e("button",{onClick:function(){setEditData(null);setSelected(null);},style:{background:"none",border:"none",color:"#8E99A4",cursor:"pointer",fontSize:18,lineHeight:1}},"\\u2715")),
        e("div",{style:{display:"flex",gap:8,marginTop:6}},
          e("span",{style:{fontSize:10,padding:"2px 8px",borderRadius:10,background:sc2.bg,color:sc2.text,fontWeight:600}},editData.fgu+" FGU"),
          e("span",{style:{fontSize:10,padding:"2px 8px",borderRadius:10,background:"#2C3E6B",color:"#8E99A4"}},"FIPS "+editData.fips),
          e("span",{style:{fontSize:10,padding:"2px 8px",borderRadius:10,background:"#2C3E6B",color:"#8E99A4"}},REGIONS[editData.region])
        )
      ),
      // Tabs
      e("div",{style:{display:"flex",borderBottom:"1px solid #E5E8EB",background:"#FAFBFC"}},
        e("button",{className:"tab"+(detailTab==="config"?" active":""),onClick:function(){setDetailTab("config");}},"Config"),
        e("button",{className:"tab"+(detailTab==="pipeline"?" active":""),onClick:function(){setDetailTab("pipeline");}},"Pipeline"),
        e("button",{className:"tab"+(detailTab==="actions"?" active":""),onClick:function(){setDetailTab("actions");}},"Actions")
      ),
      e("div",{style:{padding:"16px 20px"}},
        detailTab==="config" ? configTab : detailTab==="pipeline" ? pipelineTab : actionsTab,
        e("button",{onClick:saveEdit,style:{width:"100%",padding:"10px 16px",background:"#C0392B",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",letterSpacing:"0.3px",marginTop:16}},"Save Changes")
      )
    );
  }

  // === LETTER MODAL ===
  var letterModal = null;
  if (showLetterModal && letterTemplate) {
    letterModal = e("div",{className:"modal-overlay",onClick:function(ev){if(ev.target===ev.currentTarget)setShowLetterModal(false);}},
      e("div",{className:"modal"},
        e("div",{style:{padding:"16px 20px",background:"#1B2A4A",borderRadius:"12px 12px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}},
          e("h3",{style:{margin:0,color:"#fff",fontSize:15,fontWeight:700}},letterTemplate.name),
          e("button",{onClick:function(){setShowLetterModal(false);},style:{background:"none",border:"none",color:"#8E99A4",cursor:"pointer",fontSize:18}},"\\u2715")
        ),
        e("div",{style:{padding:"16px 20px"}},
          e("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}},
            letterTemplate.variables.map(function(v) {
              return e("div",{key:v},
                e("label",{style:{display:"block",fontSize:10,fontWeight:600,color:"#5D6D7E",marginBottom:2,textTransform:"uppercase"}},v.replace(/_/g," ")),
                e("input",{value:letterVars[v]||"",onChange:function(ev){var o=Object.assign({},letterVars);o[v]=ev.target.value;setLetterVars(o);
                  if(v.startsWith("sender_")){var si=Object.assign({},senderInfo);si[v]=ev.target.value;setSenderInfo(si);saveToStorage("ss-sender-info",si);}},
                  style:{width:"100%",padding:"6px 8px",border:"1px solid #D5D8DC",borderRadius:4,fontSize:12}})
              );
            })
          ),
          e("div",{style:{background:"#F8F9FA",border:"1px solid #E5E8EB",borderRadius:8,padding:16,fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap",fontFamily:"'Instrument Sans',sans-serif",maxHeight:300,overflow:"auto"}},renderLetter()),
          e("div",{style:{display:"flex",gap:10,marginTop:16}},
            e("button",{onClick:copyLetter,style:{flex:1,padding:"10px 16px",background:"#C0392B",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer"}},"Copy to Clipboard"),
            e("button",{onClick:function(){setShowLetterModal(false);},style:{padding:"10px 16px",background:"#fff",color:"#7F8C8D",border:"1px solid #D5D8DC",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}},"Close")
          )
        )
      )
    );
  }

  return e("div",{style:{fontFamily:"'Instrument Sans','Segoe UI',system-ui,sans-serif",background:"#F0F2F5",minHeight:"100vh"}},
    header, controls,
    e("div",{style:{display:"flex",height:"calc(100vh - 160px)"}}, table, detailPanel),
    letterModal
  );
}

ReactDOM.render(e(SurplusSecureDB), document.getElementById("root"));
<\/script>
</body>
</html>`;
