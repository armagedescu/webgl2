document.addEventListener('DOMContentLoaded', () =>
{
   let canvas = document.getElementById('mycanvas1');
   let context = canvas.getContext('2d');
   context.font = '20pt Calibri';
   context.fillStyle = 'green';
   context.fillText('Welcome to Tutorialspoint', 10, 30);
})
