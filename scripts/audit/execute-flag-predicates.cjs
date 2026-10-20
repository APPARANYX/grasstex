/* Execute literal query regex predicates from the shipping AST.
   Predicate outputs are not subsystem activation or deployment attestations. */
const acorn=require('acorn'),fs=require('node:fs');
const dir='docs/audits/2026-10-20-grasstex/runtime-verification/artifacts/';
const inventory=JSON.parse(fs.readFileSync(dir+'query-read-inventory.json','utf8'));
const names=new Set(inventory.map(r=>r.name)),files=new Set(inventory.flatMap(r=>r.references.map(x=>x.file)).filter(f=>f.endsWith('.js')));
const predicates=[],initializers=[],helpers=[],parseFailures=[];
function walk(n,parent,source,file){
 if(!n||typeof n!=='object')return;
 if(n.type==='VariableDeclarator'&&n.init){
 const text=source.slice(n.init.start,n.init.end),queryNames=[...text.matchAll(/\.get\(\s*['"]([A-Za-z][A-Za-z0-9_]*)['"]/g)].map(m=>m[1]).filter(x=>names.has(x));
 if(queryNames.length){const cases=[];for(const name of new Set(queryNames))for(const value of [null,'0','1','off','false']){
  const query=value===null?'':'?'+name+'='+value,reads=new Set();class TracedParams extends URLSearchParams{get(key){reads.add(key);return super.get(key)}}const q=new TracedParams(query),root={location:{search:query}},location=root.location;
  try{const output=new Function('q','params','location','root','SEARCH','search','queryParams','URLSearchParams','return ('+text+');')(q,q,location,root,query,query,()=>q,TracedParams);cases.push({name,query,output:typeof output==='function'?null:output===undefined?null:output,queriedNames:[...reads],unexecuted:!reads.has(name)});}
  catch(error){cases.push({name,query,error:String(error)});}
 }initializers.push({file,line:n.loc.start.line,variable:n.id.name||null,expression:text,queryNames:[...new Set(queryNames)],cases,scope:'original initializer in query-only fixture; errors explicitly unresolved'});}
}
if(n.type==='FunctionDeclaration'&&['flagOff','flagOn'].includes(n.id?.name)){
 const text=source.slice(n.start,n.end);
 if(text.includes('RegExp')&&text.includes('location')){for(const name of names)if(source.includes(n.id.name+"('"+name+"')")){
  const cases=[];for(const value of [null,'0','1','off','false']){const query=value===null?'':'?'+name+'='+value;try{const output=new Function('root','return ('+text+')(arguments[1]);')({location:{search:query}},name);cases.push({query,output});}catch(error){cases.push({query,error:String(error)});}}
  helpers.push({name,file,line:n.loc.start.line,function:n.id.name,expression:text,cases,scope:'helper output only; caller inversion/dependencies remain separate'});
 }}
}
if(n.type==='CallExpression'&&n.callee.type==='MemberExpression'&&['test','exec'].includes(n.callee.property.name)&&n.callee.object.regex){
  const literal=n.callee.object,pattern=literal.regex.pattern;
  const match=pattern.match(/\[\?&\]\)?([A-Za-z][A-Za-z0-9_]*)=/);
  if(match&&names.has(match[1])){
   const name=match[1],negated=parent?.type==='UnaryExpression'&&parent.operator==='!',regex=new RegExp(pattern,literal.regex.flags),method=n.callee.property.name;
   const values=[null,'0','1','off','false'];
   const cases=values.map(value=>{const query=value===null?'':'?'+name+'='+value;regex.lastIndex=0;const raw=method==='test'?regex.test(query):regex.exec(query);return{query,output:method==='test'?(negated?!raw:raw):(raw?Array.from(raw):null)}});
   predicates.push({name,file,line:n.loc.start.line,column:n.loc.start.column+1,expression:source.slice(negated?parent.start:n.start,negated?parent.end:n.end),pattern,flags:literal.regex.flags,method,negated,cases,scope:'literal regex predicate only; surrounding guards, fallback parsing and dependencies not evaluated'});
  }
 }
 for(const [key,value]of Object.entries(n)){if(['loc','start','end'].includes(key))continue;if(Array.isArray(value))for(const child of value)walk(child,n,source,file);else if(value&&typeof value==='object')walk(value,n,source,file);}
}
for(const file of files){const source=fs.readFileSync(file,'utf8');try{walk(acorn.parse(source,{ecmaVersion:'latest',sourceType:'script',locations:true}),null,source,file)}catch(e){parseFailures.push({file,message:String(e)})}}
const covered=new Set(predicates.map(p=>p.name));
const result={method:'Parse production JS with Acorn; execute original RegExp pattern/flags and directly enclosing ! on five inputs. No production code changed.',sourceBaseline:'f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9',candidateCount:inventory.length,predicates:predicates.length,cases:predicates.length*5,coveredNames:[...covered].sort(),unresolvedNames:inventory.filter(r=>!covered.has(r.name)).map(r=>r.name),parseFailures,rows:predicates};
result.initializers=initializers;result.helpers=helpers;result.successfulInitializerNames=[...new Set(initializers.flatMap(x=>x.cases.filter(c=>!c.error&&!c.unexecuted).map(c=>c.name)))].sort();result.helperNames=[...new Set(helpers.map(x=>x.name))].sort();result.remainingWithoutExecutedRead=inventory.filter(x=>!covered.has(x.name)&&!result.successfulInitializerNames.includes(x.name)&&!result.helperNames.includes(x.name)).map(x=>x.name);
fs.writeFileSync(dir+'flag-predicate-executions.json',JSON.stringify(result,null,2));console.log(JSON.stringify({predicates:result.predicates,cases:result.cases,covered:covered.size,initializerNames:result.successfulInitializerNames.length,helperNames:result.helperNames.length,remaining:result.remainingWithoutExecutedRead,parseFailures},null,2));
