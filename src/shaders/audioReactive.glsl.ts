// Audio-Reactive Vertex Shader
// Используется для деформации геометрии на основе аудио-данных

export const audioReactiveVertexShader = `
  uniform float uTime;
  uniform float uAudioIntensity;
  uniform float uLowFreq;
  uniform sampler2D uNoiseTexture;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  
  // Simplex 3D Noise (Stefan Gustavson)
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) { 
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i); 
    vec4 p = permute(permute(permute( 
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0)) 
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
            
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    vec3 pos = position;
    
    // Audio-reactive displacement
    float noise = snoise(pos * 0.5 + uTime * 0.3);
    float displacement = noise * uAudioIntensity * 0.5;
    
    // Low frequency emphasis (bass response)
    displacement += snoise(pos * 0.2) * uLowFreq * 0.3;
    
    pos += normal * displacement;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vViewPosition = -mvPosition.xyz;
    
    gl_Position = projectionMatrix * mvPosition;
  }
`

// Fresnel Glow Fragment Shader
// Используется для создания эффекта свечения на краях объектов (resonance visualization)

export const fresnelFragmentShader = `
  uniform vec3 uBaseColor;
  uniform vec3 uGlowColor;
  uniform float uResonanceExp; // 1.0 - 5.0
  uniform float uAudioIntensity;
  uniform float uTime;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    
    // Fresnel effect
    float fresnel = pow(1.0 - abs(dot(normal, viewDir)), uResonanceExp);
    
    // Pulse effect
    float pulse = sin(uTime * 4.0) * 0.5 + 0.5;
    
    // Combine base color with glow
    vec3 color = uBaseColor + (uGlowColor * fresnel * uAudioIntensity * (0.5 + pulse * 0.5));
    
    gl_FragColor = vec4(color, 1.0);
  }
`

// Wavefolding Vertex Shader (Buchla-style)
// Используется для симуляции wavefolding эффекта в визуальном пространстве

export const wavefoldingVertexShader = `
  uniform float uTimbre; // 0.0 - 1.0
  uniform float uTime;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  
  float wavefold(float value, float threshold) {
    if (abs(value) > threshold) {
      return threshold - mod(abs(value) - threshold, 2.0 * threshold);
    }
    return value;
  }
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    vec3 pos = position;
    
    // Apply wavefolding to Y displacement
    float displacement = sin(pos.x * 2.0 + uTime) * (1.0 + uTimbre * 3.0);
    displacement = wavefold(displacement, 0.5 - uTimbre * 0.3);
    
    pos.y += displacement * 0.5;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

// Basic Fragment Shader (для использования с wavefoldingVertexShader)

export const basicFragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  
  void main() {
    vec3 light = normalize(vec3(1.0, 1.0, 1.0));
    float diffuse = max(dot(vNormal, light), 0.0);
    
    vec3 color = uColor * (0.5 + diffuse * 0.5);
    gl_FragColor = vec4(color, uOpacity);
  }
`
