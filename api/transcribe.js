import {authorize,bodyOf,groq,upstreamError} from './_shared.js';
export default async function handler(req,res){
 if(!authorize(req,res))return;
 let body;try{body=bodyOf(req);}catch{res.status(400).json({error:'Invalid audio request.'});return;}
 const {audio,mimeType}=body||{};
 if(typeof audio!=='string'||audio.length<20||audio.length>2800000||!['audio/webm','audio/mp4','audio/ogg'].includes(mimeType)){res.status(400).json({error:'Unsupported or oversized recording. Use a short recording under 2 MB.'});return;}
 try{
 const form=new FormData();form.set('model','whisper-large-v3-turbo');form.set('language','en');form.set('response_format','json');
 const ext={'audio/webm':'webm','audio/mp4':'mp4','audio/ogg':'ogg'}[mimeType];
 form.set('file',new Blob([Buffer.from(audio,'base64')],{type:mimeType}),`question.${ext}`);
 const response=await groq('audio/transcriptions',{method:'POST',body:form});
 if(!response.ok){upstreamError(response,res);return;}
 const data=await response.json();res.status(200).json({text:typeof data.text==='string'?data.text:''});
 }catch{res.status(502).json({error:'Audio transcription failed. Try again or type the question.'});}
}
