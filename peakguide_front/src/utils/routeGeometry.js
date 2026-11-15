export function validRouteGeometry(value){
 if(!value||!['LineString','MultiLineString'].includes(value.type)||!Array.isArray(value.coordinates))return null;
 const lines=value.type==='LineString'?[value.coordinates]:value.coordinates;
 let count=0;
 if(!lines.length||lines.some(line=>!Array.isArray(line)||line.length<2||line.some(p=>{
  count++;return !Array.isArray(p)||p.length<2||!Number.isFinite(p[0])||!Number.isFinite(p[1])||Math.abs(p[0])>180||Math.abs(p[1])>90;
 }))||count>20000)return null;
 return value;
}
