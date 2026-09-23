"""Render the opening film from existing Bloodmoon art; requires Pillow and FFmpeg."""
import math, random, subprocess, sys
from pathlib import Path
from PIL import Image, ImageEnhance, ImageDraw, ImageFilter

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.tmp-ui-preview/video-tools'))
import imageio_ffmpeg
WIDTH,HEIGHT,FPS,SECONDS=1280,720,24,9
scenes=[Image.open(ROOT/'client/assets/world'/name).convert('RGB') for name in ['court-board.png','forest-board.png','crypt-board.png']]
for i,img in enumerate(scenes):
    ratio=max(WIDTH*1.15/img.width,HEIGHT*1.15/img.height)
    scenes[i]=ImageEnhance.Color(img.resize((int(img.width*ratio),int(img.height*ratio)),Image.Resampling.LANCZOS)).enhance(.75)
vignette=Image.new('L',(WIDTH,HEIGHT));pixels=vignette.load()
for y in range(HEIGHT):
    for x in range(WIDTH):
        r=((x-WIDTH/2)/(WIDTH*.7))**2+((y-HEIGHT/2)/(HEIGHT*.85))**2
        pixels[x,y]=min(205,int(130*r))
overlay=Image.new('RGB',(WIDTH,HEIGHT),(3,5,10))
random.seed(31);embers=[(random.random()*WIDTH,random.random()*HEIGHT,random.random()*24+6,random.random()*2+1) for _ in range(42)]
target=ROOT/'client/assets/intro/vespera.mp4';target.parent.mkdir(parents=True,exist_ok=True)
cmd=[imageio_ffmpeg.get_ffmpeg_exe(),'-y','-loglevel','error','-f','rawvideo','-vcodec','rawvideo','-s',f'{WIDTH}x{HEIGHT}','-pix_fmt','rgb24','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','fast','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart',str(target)]
encoder=subprocess.Popen(cmd,stdin=subprocess.PIPE)
def scene(index,t):
    img=scenes[index];progress=max(0,min(1,t/3.3));zoom=1+progress*.055
    w,h=int(WIDTH/zoom),int(HEIGHT/zoom);cx=img.width/2+(progress-.5)*35;cy=img.height/2+(progress-.5)*18
    return img.crop((int(cx-w/2),int(cy-h/2),int(cx+w/2),int(cy+h/2))).resize((WIDTH,HEIGHT),Image.Resampling.BICUBIC)
for f in range(FPS*SECONDS):
    t=f/FPS;index=min(2,int(t/3));local=t-index*3;frame=scene(index,local)
    if local<.65 and index>0:frame=Image.blend(scene(index-1,3+local),frame,local/.65)
    frame=Image.composite(overlay,frame,vignette);draw=ImageDraw.Draw(frame,'RGBA')
    for x,y,speed,radius in embers:
        px=x+math.sin(t*.8+y)*9;py=(y-t*speed)%HEIGHT
        draw.ellipse((px-radius,py-radius,px+radius,py+radius),fill=(190,95 if index!=1 else 150,70,110))
    fade=min(1,t/.8,(SECONDS-t)/.9);frame=ImageEnhance.Brightness(frame).enhance(max(0,fade)*.88)
    encoder.stdin.write(frame.tobytes())
encoder.stdin.close();code=encoder.wait()
if code:raise SystemExit(code)
print(f'{target}: {target.stat().st_size} bytes, {SECONDS}s, {WIDTH}x{HEIGHT}, {FPS}fps')
