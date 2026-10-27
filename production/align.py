"""Offline known-transcript forced alignment. No API, no ASR download."""
import sys,pathlib,json,re,wave
sys.path.insert(0,str(pathlib.Path(__file__).parent/'.python'))
from pocketsphinx import Decoder
wav,textfile,out=sys.argv[1:4]
text=pathlib.Path(textfile).read_text().lower().replace('’',"'")
words=re.findall(r"[a-z]+(?:'[a-z]+)*",text)
decoder=Decoder(loglevel='ERROR',samprate=16000)
unknown=sorted({w for w in words if not decoder.lookup_word(w)})
if unknown:raise ValueError('ALIGNMENT_OOV: unsupported pronunciation(s): '+', '.join(unknown)+'. Supply a pronunciation dictionary or pre-aligned recording sidecar; never invent timestamps.')
with wave.open(wav,'rb') as f:
 assert f.getnchannels()==1 and f.getsampwidth()==2 and f.getframerate()==16000
 data=f.readframes(f.getnframes());audio_seconds=f.getnframes()/16000
# First pass constrained to exactly the supplied transcript.
decoder.set_align_text(' '.join(words));decoder.start_utt();decoder.process_raw(data,True,True);decoder.end_utt()
segments=[{'word':re.sub(r'\(\d+\)$','',s.word),'start':s.start_frame/100,'end':(s.end_frame+1)/100} for s in decoder.seg() if s.word not in ['<sil>','[SPEECH]','<s>','</s>','(NULL)']]
assert [s['word'] for s in segments]==words,'ALIGNMENT_TOKEN_MISMATCH'
assert all(0<=s['start']<s['end']<=audio_seconds+.04 for s in segments),'ALIGNMENT_INVALID_TIMES'
assert all(a['end']<=b['start']+.011 for a,b in zip(segments,segments[1:])),'ALIGNMENT_NONMONOTONIC'
pathlib.Path(out).write_text(json.dumps({'method':'PocketSphinx 5.0.4 known-transcript forced alignment; 10ms acoustic frames','sourceSeconds':audio_seconds,'words':segments,'caveat':'Forced alignment is not semantic transcription or a proof of pronunciation accuracy. Review uncertain/very short word boundaries and proper nouns.'},indent=2)+'\n')
