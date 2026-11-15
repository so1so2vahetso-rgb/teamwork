import {spawn} from 'node:child_process'
import {existsSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
const root=fileURLToPath(new URL('../',import.meta.url)),url='http://127.0.0.1:5173/'
let running=false
try{const response=await fetch(url,{signal:AbortSignal.timeout(1200)});running=response.ok&&(await response.text()).includes('TeamWork')}catch{}
if(running){
 console.log(`TeamWork dang chay: ${url}`)
 if(process.platform==='win32')spawn('cmd.exe',['/c','start','',url],{windowsHide:true,stdio:'ignore'}).unref()
}else{
 if(!existsSync(new URL('../node_modules/vite/bin/vite.js',import.meta.url))){console.error('Chay npm ci trong thu muc du an truoc.');process.exit(1)}
 console.log('Giu cua so nay mo trong khi su dung TeamWork. Nhan Ctrl+C de dung.')
 const child=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5173','--strictPort','--open'],{cwd:root,stdio:'inherit'})
 child.on('exit',code=>process.exitCode=code??0)
 child.on('error',()=>{console.error('Khong khoi dong duoc website.');process.exitCode=1})
}
