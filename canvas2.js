document.addEventListener('DOMContentLoaded', () =>
{
   let canvas = document.getElementById('mycanvas2');
   let gl = canvas.getContext('experimental-webgl');
   gl.clearColor(0.9,0.9,0.8,1);
   gl.clear(gl.COLOR_BUFFER_BIT);
})