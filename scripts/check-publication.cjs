// Dependency-free pre-publication check. It reports locations, never matching secret values.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const failures=[];
const forbidden=/^(?:db_?connect.*|pdo_?connect.*|\.env(?:\..*)?|credentials.*\.json|secrets.*\.json)$|\.(?:log|pem|key|pfx|p12|dump|bak)$/i;
function walk(dir){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name),relative=path.relative(root,file);
  if(entry.name==='.git'||entry.name==='node_modules')continue;
  if(entry.isSymbolicLink()){failures.push(relative+': symbolic link requires manual review');continue;}
  if(entry.isDirectory()){walk(file);continue;}
  if(forbidden.test(entry.name)){failures.push(relative+': private configuration/log/key filename');continue;}
  if(!/\.(?:html|js|cjs|php|json|md|sql|css|txt|yml|yaml)$/.test(entry.name))continue;
  const content=fs.readFileSync(file,'utf8');
  const patterns=[
   ['private key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
   ['GitHub token',/\bgh[pousr]_[A-Za-z0-9]{20,}/],
   ['AWS access key',/\bAKIA[0-9A-Z]{16}\b/],
   ['embedded credential',/(?:password|api[_-]?key|client[_-]?secret)\s*[:=]\s*["'][^"'\r\n]{6,}["']/i],
   ['Windows user path',/[A-Z]:\\(?:\\)?Users\\(?:\\)?[^\s"'`]+/],
   ['private IPv4 address',/\b(?:10\.(?:\d{1,3}\.){2}\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/]
  ];
  for(const [label,regex] of patterns)if(regex.test(content))failures.push(relative+': '+label);
 }
}
walk(root);
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}
else console.log('Publication checks passed: no disallowed configuration files, logs, key files, common credential patterns, private IPv4 addresses or Windows user paths found. Git history and arbitrary secret formats require separate review.');
