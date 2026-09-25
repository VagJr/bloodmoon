export function touchSpan(points){
 const [a,b]=points;return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))};
}
/** Preserve the world coordinate under the two-finger midpoint, including pan. */
export function pinchCamera(start,span,min=.09,max=1.05){
 const z=Math.max(min,Math.min(max,start.camera.z*span.distance/start.span.distance));
 return {z,x:span.x-(start.span.x-start.camera.x)*z/start.camera.z,y:span.y-(start.span.y-start.camera.y)*z/start.camera.z};
}
