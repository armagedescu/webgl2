{
let canvas = document.currentScript.parentElement;
document.addEventListener('DOMContentLoaded', () =>
{
   let gl = canvas.getContext('experimental-webgl');
   gl.clearColor(0.9,0.5,0.5,1);
   gl.clear(gl.COLOR_BUFFER_BIT);
});
}