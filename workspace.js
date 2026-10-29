const $ = selector => document.querySelector(selector);
const status = (message, error=false) => {$('#status').textContent=message;$('#status').classList.toggle('error',error);};
let recognition=null, stream=null, recorder=null, timer=null, micActive=false, captureEpoch=0, answerController=null, audioController=null, history=[], currentAnswer='', busy=false, autoTimer;
function authorization(){return {'Content-Type':'application/json',Authorization:`Bearer ${$('#password').value}`};}
async function request(path,body,signal){
 const response=await fetch(path,{method:'POST',headers:authorization(),body:JSON.stringify(body),signal});
 let data;try{data=await response.json();}catch{throw Error('The API is unavailable. Open the deployed Vercel app; a static preview cannot run server functions.');}
 if(!response.ok)throw Error(data.error||'The request failed. Try again.');return data;
}
function controls(){const active=micActive||!!stream;$('#microphone').disabled=active;$('#tab-audio').disabled=active;$('#stop').disabled=!active;$('#capture-state').textContent=active?(micActive?'Microphone on':'Meeting audio on'):'Not listening';}
function stopCapture(){captureEpoch++;clearTimeout(timer);clearTimeout(autoTimer);micActive=false;if(recognition){recognition.onend=null;recognition.stop();recognition=null;}if(recorder?.state==='recording')recorder.stop();recorder=null;if(stream)stream.getTracks().forEach(track=>track.stop());stream=null;audioController?.abort();$('#interim').textContent='';controls();}
function renderHistory(){const list=$('#history');list.replaceChildren();if(!history.length){const li=document.createElement('li');li.textContent='No answers yet.';list.append(li);return;}history.forEach(entry=>{const li=document.createElement('li');const button=document.createElement('button');button.className='history-button';button.textContent=entry.question;button.addEventListener('click',()=>{if(busy)return;$('#question').value=entry.question;currentAnswer=entry.answer;$('#answer').textContent=currentAnswer;$('#copy').disabled=false;});li.append(button);list.append(li);});}
async function generate(){
 if(busy)return;
 const question=$('#question').value.trim();
 if(!question){status('Type or capture a question first.',true);return;}
 if(!$('#password').value){status('Enter your app password in the left panel first.',true);$('#password').focus();return;}
 busy=true;$('#generate').disabled=true;$('#generate').textContent='Thinking…';status('Generating talking points from your question and background…');
 const controller=new AbortController();answerController=controller;
 try{const data=await request('/api/answer',{question,resume:$('#resume').value,role:$('#role').value,style:$('#style').value},controller.signal);if(controller.signal.aborted)return;currentAnswer=data.answer;$('#answer').textContent=currentAnswer;$('#copy').disabled=false;history.unshift({question,answer:currentAnswer});history=history.slice(0,12);renderHistory();status('Answer ready. Check it against your experience and use your own words.');}
 catch(error){if(error.name!=='AbortError'){status(error.message,true);$('#auto').checked=false;}}
 finally{if(answerController===controller){busy=false;$('#generate').disabled=false;$('#generate').textContent='Generate answer ↗';}}
}
function appendTranscript(text){if(!text.trim())return;const question=$('#question');question.value=(question.value+' '+text.trim()).trim().slice(-6000);status('Transcript updated. Edit it if needed, then generate an answer.');if($('#auto').checked&&!busy){clearTimeout(autoTimer);autoTimer=setTimeout(generate,1000);}}
$('#generate').addEventListener('click',generate);
$('#new-question').addEventListener('click',()=>{clearTimeout(autoTimer);$('#question').value='';$('#interim').textContent='';$('#question').focus();status('Ready for the next question.');});
$('#microphone').addEventListener('click',()=>{
 const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SpeechRecognition){status('Microphone dictation is unavailable in this browser. Try desktop Chrome or Edge, or type your question.',true);return;}
 stopCapture();const epoch=captureEpoch;recognition=new SpeechRecognition();recognition.continuous=true;recognition.interimResults=true;recognition.lang='en-US';
 recognition.onresult=event=>{if(epoch!==captureEpoch)return;let interim='';let final='';for(let i=event.resultIndex;i<event.results.length;i++){if(event.results[i].isFinal)final+=event.results[i][0].transcript+' ';else interim+=event.results[i][0].transcript;}$('#interim').textContent=interim;if(final)appendTranscript(final);};
 recognition.onerror=event=>{if(epoch!==captureEpoch)return;stopCapture();status(event.error==='not-allowed'?'Microphone permission was denied. Allow it in browser settings, or type the question.':`Speech recognition stopped (${event.error}). You can type the question instead.`,true);};
 recognition.onend=()=>{if(epoch!==captureEpoch)return;micActive=false;recognition=null;controls();status('Microphone dictation ended. Start it again to continue.');};
 try{recognition.start();micActive=true;controls();status('Listening to your microphone. Browser speech recognition may use an online speech service.');}catch{stopCapture();status('Could not start microphone dictation. Check browser permissions.',true);}
});
async function encode(blob){const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(binary);}
function recordSegment(epoch){
 if(epoch!==captureEpoch||!stream)return;
 const audioStream=new MediaStream(stream.getAudioTracks());
 const type=['audio/webm;codecs=opus','audio/webm','audio/mp4'].find(t=>MediaRecorder.isTypeSupported(t));
 if(!type){stopCapture();status('This browser cannot record supported meeting audio. Use Chrome or Edge.',true);return;}
 const chunks=[];const segment=new MediaRecorder(audioStream,{mimeType:type});recorder=segment;
 segment.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
 segment.onerror=()=>{if(epoch===captureEpoch){stopCapture();status('Audio recording failed. Try sharing the tab again.',true);}};
 segment.onstop=async()=>{
 if(epoch!==captureEpoch)return;
 try{const blob=new Blob(chunks,{type});if(blob.size>2000000)throw Error('Audio segment is too large. Try again.');if(blob.size>200){status('Transcribing the last 10 seconds of meeting audio…');audioController=new AbortController();const data=await request('/api/transcribe',{audio:await encode(blob),mimeType:type.split(';')[0]},audioController.signal);if(epoch!==captureEpoch)return;appendTranscript(data.text);}}
 catch(error){if(epoch===captureEpoch){stopCapture();status(error.message,true);}return;}
 if(epoch===captureEpoch)recordSegment(epoch);
 };
 segment.start();timer=setTimeout(()=>{if(segment.state==='recording')segment.stop();},10000);
}
$('#tab-audio').addEventListener('click',async()=>{
 if(!$('#password').value){status('Enter your app password first. Meeting audio uses server transcription.',true);return;}
 if(!navigator.mediaDevices?.getDisplayMedia||!window.MediaRecorder){status('Meeting audio capture needs desktop Chrome or Edge. You can still type a question.',true);return;}
 stopCapture();const epoch=captureEpoch;
 try{const selected=await navigator.mediaDevices.getDisplayMedia({video:true,audio:true});if(epoch!==captureEpoch){selected.getTracks().forEach(t=>t.stop());return;}stream=selected;
 if(!stream.getAudioTracks().length){stopCapture();status('No audio was shared. Select the meeting browser tab and enable “Share tab audio”.',true);return;}
 stream.getTracks().forEach(track=>track.addEventListener('ended',()=>{if(epoch===captureEpoch){stopCapture();status('Tab sharing ended.');}}));controls();status('Listening to shared tab audio. Each 10-second segment is sent to Groq for transcription. No video is uploaded.');recordSegment(epoch);
 }catch(error){if(epoch===captureEpoch){stopCapture();status(error.name==='NotAllowedError'?'Tab sharing was canceled or denied. Try again or type the question.':'Could not share tab audio. Try desktop Chrome or Edge.',true);}}
});
$('#stop').addEventListener('click',()=>{stopCapture();status('Listening stopped. Captured text remains editable.');});
$('#clear-session').addEventListener('click',()=>{stopCapture();answerController?.abort();history=[];currentAnswer='';for(const id of ['question','resume','role','password'])$('#'+id).value='';$('#auto').checked=false;$('#answer').textContent='Your AI answer will appear here.';$('#copy').disabled=true;renderHistory();status('Session cleared.');});
$('#copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(currentAnswer);status('Answer copied.');}catch{status('Clipboard access unavailable. Select and copy the answer text manually.',true);}});
window.addEventListener('pagehide',()=>{stopCapture();answerController?.abort();});
