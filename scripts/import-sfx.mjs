import {readdirSync,readFileSync,mkdirSync,copyFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const assignments={
 'start_button_sfx':'start-button',
 'card_invocation':'card-invocation',
 '552126':'vampire-hiss-1','552127':'vampire-hiss-2','552131':'vampire-hiss-3','552130':'vampire-shriek',
 '185435':'steel-impact','511303':'wolf-growl','100270':'monster-attack','394476':'gold',
 '379733':'shield','379228':'sword-slash-1','379229':'sword-slash-2','379236':'teleport',
 '437495':'wolf-howl','544355':'fighter-grunt','566458':'unsheath','203600':'ui-click',
 '333896':'magic-spell','352708':'flesh-impact','482524':'beast-roar',
 '482515':'claw-1','482516':'claw-2','482507':'claw-3'
};
mkdirSync('client/assets/sfx',{recursive:true});mkdirSync('docs/audio',{recursive:true});
const seen=new Set(),manifest=[],duplicates=[];
for(const source of readdirSync('.').filter(f=>f.endsWith('.mp3')).sort()){
 const match=Object.keys(assignments).find(id=>source.includes(id));if(!match)continue;
 const bytes=readFileSync(source),sha256=createHash('sha256').update(bytes).digest('hex');
 if(seen.has(sha256)){duplicates.push(source);continue;}seen.add(sha256);
 const id=assignments[match],file=`/assets/sfx/${id}.mp3`;
 copyFileSync(source,'client'+file);manifest.push({id,file,source,bytes:bytes.length,sha256});
}
writeFileSync('docs/audio/imported-sfx.json',JSON.stringify({selection:'Classificação pelos nomes dos arquivos fornecidos',files:manifest,duplicates},null,2)+'\n');
console.log(`${manifest.length} efeitos importados; ${duplicates.length} duplicado ignorado.`);
