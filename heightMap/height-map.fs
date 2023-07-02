#version 300 es
precision mediump float;
in vec4 terrainColor;
in vec3 terrainNormal;
in vec3 lightDirection;
out vec4 FragColor;
void main()
{
    float strength = dot(normalize(-lightDirection), normalize(terrainNormal)) * 1.2;//* 0.75;//1.0;//0.75;//
    FragColor = vec4( terrainColor.rgb * strength, terrainColor.a);
}