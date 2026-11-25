// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// Local synthetic workbench launcher, not an installer or DOCFA adapter.
import {execFile} from 'node:child_process';
import {pathToFileURL} from 'node:url';
export async function launchLocal({openBrowser=process.platform==='win32'}={}){
  if(Number(process.versions.node.split('.')[0])<22)throw Error('Node.js 22 o successivo richiesto.');
  const {createWorkbenchServer}=await import('./server.mjs');
  const server=createWorkbenchServer();
  // Let the OS select a free loopback port; never open an existing unknown service.
  await new Promise((resolve,reject)=>{
    server.once('error',reject);
    server.listen(0,'127.0.0.1',()=>{server.removeListener('error',reject);resolve();});
  });
  const url='http://127.0.0.1:'+server.address().port+'/';
  if(openBrowser&&process.platform==='win32'){
    // Fixed executable and generated URL, no shell or caller-supplied command.
    // Explorer may return a nonzero exit status even when opening the browser.
    execFile('explorer.exe',[url],{windowsHide:true},error=>{
      if(error)console.error('Se il browser non si apre, copiare il collegamento mostrato.');
    });
  }
  return {server,url};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{
    const args=process.argv.slice(2);
    if(args.some(a=>a!=='--no-browser'))throw Error('Argomento non supportato.');
    const {server,url}=await launchLocal({openBrowser:process.platform==='win32'&&!args.includes('--no-browser')});
    console.log('Catasto Italia — SOLO DATI SINTETICI — '+url);
    console.log('Chiudere con Ctrl+C. Nessun invio ufficiale.');
    const stop=()=>{server.close();server.closeAllConnections();};
    process.once('SIGINT',stop);
    process.once('SIGTERM',stop);
  }catch(error){console.error(error.message);process.exitCode=1;}
}
