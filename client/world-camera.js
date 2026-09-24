// Pure camera geometry: the world must cover the viewport at every zoom.
export const WORLD_SIZE={width:8000,height:5333.333333};
export function constrainCamera(camera,width,height){
 const z=Math.max(width/WORLD_SIZE.width,height/WORLD_SIZE.height,Math.min(.95,Number(camera.z)||.2));
 return {z,x:Math.max(width-WORLD_SIZE.width*z,Math.min(0,Number(camera.x)||0)),y:Math.max(height-WORLD_SIZE.height*z,Math.min(0,Number(camera.y)||0))};
}
export function centerCamera(x,y,z,width,height){return constrainCamera({z,x:width/2-x*z,y:height/2-y*z},width,height);}
export function zoomCamera(camera,next,ax,ay,width,height){
 const z=constrainCamera({z:next},width,height).z,ratio=z/camera.z;
 return constrainCamera({z,x:ax-(ax-camera.x)*ratio,y:ay-(ay-camera.y)*ratio},width,height);
}
export function cameraWindow(camera,width,height){return {x:-camera.x/camera.z/WORLD_SIZE.width*100,y:-camera.y/camera.z/WORLD_SIZE.height*100,width:width/camera.z/WORLD_SIZE.width*100,height:height/camera.z/WORLD_SIZE.height*100};}
